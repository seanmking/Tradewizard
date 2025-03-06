"""
Network operations module for the Export Intelligence Scraper.

This module handles all network operations including HTTP requests,
rate limiting, proxy rotation, and robots.txt compliance.
"""

import time
import random
import asyncio
import logging
from urllib.parse import urlparse, urljoin
from urllib.robotparser import RobotFileParser

import requests
import aiohttp
from fake_useragent import UserAgent

# Configure logging
logger = logging.getLogger(__name__)

class RateLimiter:
    """Rate limiter for making requests to specific domains."""
    
    def __init__(self, requests_per_minute=10):
        self.requests_per_minute = requests_per_minute
        self.interval = 60.0 / requests_per_minute
        self.last_request_time = {}
    
    def wait_for_next_request(self, domain):
        """Wait until it's safe to make the next request to this domain."""
        current_time = time.time()
        if domain in self.last_request_time:
            elapsed = current_time - self.last_request_time[domain]
            if elapsed < self.interval:
                wait_time = self.interval - elapsed
                time.sleep(wait_time)
        
        self.last_request_time[domain] = time.time()

    async def async_wait_for_next_request(self, domain):
        """Asynchronous version of wait_for_next_request."""
        current_time = time.time()
        if domain in self.last_request_time:
            elapsed = current_time - self.last_request_time[domain]
            if elapsed < self.interval:
                wait_time = self.interval - elapsed
                await asyncio.sleep(wait_time)
        
        self.last_request_time[domain] = time.time()


class NetworkManager:
    """Manages all network operations with proper error handling and resource management."""
    
    def __init__(self, config, proxies=None):
        """
        Initialize the network manager.
        
        Args:
            config: Configuration dictionary
            proxies: List of proxy servers to use (optional)
        """
        self.config = config
        self.proxies = proxies or []
        self.user_agent = UserAgent()
        self.robots_cache = {}  # Cache for robots.txt parsers
        self.rate_limiters = {}  # Domain-specific rate limiters
        self.session = requests.Session()  # Reuse session for better performance
    
    def __del__(self):
        """Clean up resources."""
        if hasattr(self, 'session'):
            self.session.close()
    
    def _get_rate_limiter(self, domain):
        """Get or create a rate limiter for a specific domain."""
        if domain not in self.rate_limiters:
            # Default is 10 requests per minute, but could be configurable per domain
            self.rate_limiters[domain] = RateLimiter(requests_per_minute=10)
        return self.rate_limiters[domain]
    
    def _get_headers(self):
        """Generate random user agent headers to avoid detection."""
        return {
            'User-Agent': self.user_agent.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
    
    def _get_random_proxy(self):
        """Get a random proxy from the list."""
        return random.choice(self.proxies) if self.proxies else None
    
    def _can_fetch(self, url, user_agent='*'):
        """Check if the URL can be fetched according to robots.txt."""
        parsed_url = urlparse(url)
        domain = parsed_url.netloc
        
        # Skip check for non-HTTP URLs
        if not parsed_url.scheme.startswith('http'):
            return True
        
        if domain not in self.robots_cache:
            robots_url = f"{parsed_url.scheme}://{domain}/robots.txt"
            parser = RobotFileParser()
            parser.set_url(robots_url)
            try:
                # Direct read without using our request functions to avoid circular dependencies
                response = requests.get(robots_url, timeout=5)
                if response.status_code == 200:
                    parser.parse(response.text.splitlines())
                else:
                    # If no robots.txt or error, assume everything is allowed
                    logger.warning(f"No robots.txt found at {robots_url}")
            except Exception as e:
                logger.warning(f"Error fetching robots.txt from {robots_url}: {e}")
            
            self.robots_cache[domain] = parser
        
        return self.robots_cache[domain].can_fetch(user_agent, url)
    
    def fetch(self, url, method="GET", params=None, data=None, headers=None, retry_count=3, respect_robots=True):
        """
        Fetch a URL with retry logic and error handling.
        
        Args:
            url: URL to fetch
            method: HTTP method (GET, POST, etc.)
            params: URL parameters
            data: POST data
            headers: Additional headers
            retry_count: Number of retries on failure
            respect_robots: Whether to respect robots.txt
            
        Returns:
            dict: Result dictionary with status and content
        """
        parsed_url = urlparse(url)
        domain = parsed_url.netloc
        
        # Check robots.txt
        if respect_robots and not self._can_fetch(url):
            logger.warning(f"URL {url} disallowed by robots.txt")
            return {"success": False, "error": "Blocked by robots.txt"}
        
        # Apply rate limiting
        rate_limiter = self._get_rate_limiter(domain)
        rate_limiter.wait_for_next_request(domain)
        
        # Set up request
        request_headers = self._get_headers()
        if headers:
            request_headers.update(headers)
            
        proxy = self._get_random_proxy()
        
        # Attempt request with retries
        for attempt in range(retry_count):
            try:
                response = self.session.request(
                    method=method,
                    url=url,
                    params=params,
                    data=data,
                    headers=request_headers,
                    proxies=proxy,
                    timeout=(10, 30)  # (connect timeout, read timeout)
                )
                response.raise_for_status()
                
                # Check content type
                content_type = response.headers.get('Content-Type', '')
                if 'text/html' in content_type:
                    return {
                        "success": True,
                        "content": response.text,
                        "status_code": response.status_code,
                        "content_type": "html"
                    }
                elif 'application/json' in content_type:
                    return {
                        "success": True,
                        "content": response.json(),
                        "status_code": response.status_code,
                        "content_type": "json"
                    }
                else:
                    return {
                        "success": True,
                        "content": response.text,
                        "status_code": response.status_code,
                        "content_type": "text",
                        "headers": dict(response.headers)
                    }
                
            except requests.exceptions.HTTPError as e:
                logger.warning(f"HTTP error on attempt {attempt+1}/{retry_count} for {url}: {e}")
                
                # Handle rate limiting (429) specially
                if hasattr(e, 'response') and e.response.status_code == 429:
                    wait_time = int(e.response.headers.get('Retry-After', 60))
                    logger.info(f"Rate limited, waiting {wait_time} seconds")
                    time.sleep(wait_time)
                
            except (requests.exceptions.ConnectionError, 
                    requests.exceptions.Timeout,
                    requests.exceptions.RequestException) as e:
                logger.warning(f"Request error on attempt {attempt+1}/{retry_count} for {url}: {e}")
            
            # Exponential backoff
            if attempt < retry_count - 1:
                wait_time = 2 ** attempt + random.uniform(0, 1)
                logger.info(f"Retrying in {wait_time:.2f} seconds...")
                time.sleep(wait_time)
        
        # All attempts failed
        logger.error(f"Failed to fetch {url} after {retry_count} attempts")
        return {"success": False, "error": f"Failed after {retry_count} attempts"}
    
    async def fetch_async(self, url, method="GET", params=None, data=None, headers=None, retry_count=3, respect_robots=True):
        """
        Asynchronous version of fetch.
        
        Args:
            Same as fetch()
            
        Returns:
            dict: Result dictionary with status and content
        """
        parsed_url = urlparse(url)
        domain = parsed_url.netloc
        
        # Check robots.txt (reusing the sync implementation for simplicity)
        if respect_robots and not self._can_fetch(url):
            logger.warning(f"URL {url} disallowed by robots.txt")
            return {"success": False, "error": "Blocked by robots.txt"}
        
        # Apply rate limiting
        rate_limiter = self._get_rate_limiter(domain)
        await rate_limiter.async_wait_for_next_request(domain)
        
        # Set up request
        request_headers = self._get_headers()
        if headers:
            request_headers.update(headers)
            
        proxy = self._get_random_proxy()
        proxy_url = proxy.get('http') if proxy else None
        
        # Attempt request with retries
        for attempt in range(retry_count):
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.request(
                        method=method,
                        url=url,
                        params=params,
                        data=data,
                        headers=request_headers,
                        proxy=proxy_url,
                        timeout=aiohttp.ClientTimeout(total=30)
                    ) as response:
                        response.raise_for_status()
                        
                        # Check content type
                        content_type = response.headers.get('Content-Type', '')
                        if 'text/html' in content_type:
                            text = await response.text()
                            return {
                                "success": True,
                                "content": text,
                                "status_code": response.status,
                                "content_type": "html"
                            }
                        elif 'application/json' in content_type:
                            json_data = await response.json()
                            return {
                                "success": True,
                                "content": json_data,
                                "status_code": response.status,
                                "content_type": "json"
                            }
                        else:
                            text = await response.text()
                            return {
                                "success": True,
                                "content": text,
                                "status_code": response.status,
                                "content_type": "text",
                                "headers": dict(response.headers)
                            }
                
            except aiohttp.ClientResponseError as e:
                logger.warning(f"HTTP error on attempt {attempt+1}/{retry_count} for {url}: {e}")
                
                # Handle rate limiting
                if e.status == 429:
                    wait_time = int(e.headers.get('Retry-After', 60))
                    logger.info(f"Rate limited, waiting {wait_time} seconds")
                    await asyncio.sleep(wait_time)
                
            except (aiohttp.ClientConnectorError, 
                    aiohttp.ClientOSError,
                    aiohttp.ServerDisconnectedError,
                    asyncio.TimeoutError) as e:
                logger.warning(f"Request error on attempt {attempt+1}/{retry_count} for {url}: {e}")
            
            # Exponential backoff
            if attempt < retry_count - 1:
                wait_time = 2 ** attempt + random.uniform(0, 1)
                logger.info(f"Retrying in {wait_time:.2f} seconds...")
                await asyncio.sleep(wait_time)
        
        # All attempts failed
        logger.error(f"Failed to fetch {url} after {retry_count} attempts")
        return {"success": False, "error": f"Failed after {retry_count} attempts"}
    
    async def fetch_multiple(self, urls, max_concurrent=5, **kwargs):
        """
        Fetch multiple URLs concurrently.
        
        Args:
            urls: List of URLs to fetch
            max_concurrent: Maximum number of concurrent requests
            **kwargs: Additional arguments to pass to fetch_async
            
        Returns:
            list: List of result dictionaries
        """
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def fetch_with_semaphore(url):
            async with semaphore:
                return await self.fetch_async(url, **kwargs)
        
        tasks = [fetch_with_semaphore(url) for url in urls]
        return await asyncio.gather(*tasks) 