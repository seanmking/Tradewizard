"""Tests for the network module."""

import re
import pytest
import responses
import unittest.mock as mock
from urllib.parse import urlparse

from export_intelligence.core.network import NetworkManager, RateLimiter


@pytest.fixture
def network_manager(test_config):
    """Create a network manager for testing."""
    return NetworkManager(test_config)


class TestNetworkManager:
    """Tests for the NetworkManager class."""
    
    @responses.activate
    def test_fetch_success(self, network_manager):
        """Test successful fetch."""
        # Setup mock response
        url = "https://example.com/test"
        responses.add(
            responses.GET,
            url,
            body="<html><body>Test page</body></html>",
            status=200,
            content_type="text/html"
        )
        
        # Add robots.txt response
        responses.add(
            responses.GET,
            "https://example.com/robots.txt",
            body="User-agent: *\nAllow: /",
            status=200,
            content_type="text/plain"
        )
        
        # Test fetch
        result = network_manager.fetch(url)
        
        assert result["success"] is True
        assert result["status_code"] == 200
        assert result["content_type"] == "html"
        assert "<body>Test page</body>" in result["content"]

    @responses.activate
    def test_fetch_json(self, network_manager):
        """Test fetching JSON content."""
        # Setup mock response
        url = "https://api.example.com/data"
        responses.add(
            responses.GET,
            url,
            json={"key": "value"},
            status=200,
            content_type="application/json"
        )
        
        # Add robots.txt response
        responses.add(
            responses.GET,
            "https://api.example.com/robots.txt",
            body="User-agent: *\nAllow: /",
            status=200,
            content_type="text/plain"
        )
        
        # Test fetch
        result = network_manager.fetch(url)
        
        assert result["success"] is True
        assert result["content"] == {"key": "value"}
        assert result["content_type"] == "json"
    
    @responses.activate
    def test_fetch_failure(self, network_manager):
        """Test failed fetch with retries."""
        # Setup mock response
        url = "https://example.com/not-found"
        responses.add(
            responses.GET,
            url,
            body="Not Found",
            status=404
        )
        
        # Add robots.txt response
        responses.add(
            responses.GET,
            "https://example.com/robots.txt",
            body="User-agent: *\nAllow: /",
            status=200,
            content_type="text/plain"
        )
        
        # Mock sleep to speed up test
        with mock.patch('time.sleep'):
            result = network_manager.fetch(url, retry_count=2)
        
        assert result["success"] is False
        assert "Failed after" in result["error"]
    
    @responses.activate
    def test_robots_txt_compliance(self, network_manager):
        """Test robots.txt compliance."""
        # Setup robots.txt response
        responses.add(
            responses.GET,
            "https://example.com/robots.txt",
            body="User-agent: *\nDisallow: /private/",
            status=200,
            content_type="text/plain"
        )
        
        # Disallowed URL
        result = network_manager.fetch("https://example.com/private/data")
        assert result["success"] is False
        assert result["error"] == "Blocked by robots.txt"
        
        # Allowed URL
        responses.add(
            responses.GET,
            "https://example.com/public/data",
            body="<html><body>Public data</body></html>",
            status=200,
            content_type="text/html"
        )
        
        result = network_manager.fetch("https://example.com/public/data")
        assert result["success"] is True
    
    @responses.activate
    def test_rate_limiting(self, network_manager):
        """Test rate limiting."""
        # Setup mock responses
        url = "https://example.com/rate-limited"
        
        # Add robots.txt response
        responses.add(
            responses.GET,
            "https://example.com/robots.txt",
            body="User-agent: *\nAllow: /",
            status=200,
            content_type="text/plain"
        )
        
        # First request succeeds
        responses.add(
            responses.GET,
            url,
            body="<html><body>First request</body></html>",
            status=200,
            content_type="text/html"
        )
        
        # Second request gets rate limited
        responses.add(
            responses.GET,
            url,
            body="Rate limited",
            status=429,
            headers={"Retry-After": "2"},
            content_type="text/plain"
        )
        
        # Third request succeeds
        responses.add(
            responses.GET,
            url,
            body="<html><body>Third request</body></html>",
            status=200,
            content_type="text/html"
        )
        
        # Mock sleep to speed up test
        with mock.patch('time.sleep'):
            result1 = network_manager.fetch(url)
            assert result1["success"] is True
            
            # This should get rate limited but eventually succeed due to retries
            result2 = network_manager.fetch(url)
            assert result2["success"] is False  # Rate limited request fails
    
    @pytest.mark.asyncio
    @responses.activate
    async def test_fetch_async(self, network_manager):
        """Test async fetch."""
        # Setup mock response
        url = "https://example.com/async-test"
        responses.add(
            responses.GET,
            url,
            body="<html><body>Async test</body></html>",
            status=200,
            content_type="text/html"
        )
        
        # Add robots.txt response
        responses.add(
            responses.GET,
            "https://example.com/robots.txt",
            body="User-agent: *\nAllow: /",
            status=200,
            content_type="text/plain"
        )
        
        # Test fetch_async
        with mock.patch('asyncio.sleep'):
            result = await network_manager.fetch_async(url)
        
        assert result["success"] is True
        assert "Async test" in result["content"]
    
    @pytest.mark.asyncio
    @responses.activate
    async def test_fetch_multiple(self, network_manager, sample_urls):
        """Test fetching multiple URLs."""
        # Setup robots.txt responses for all domains
        domains = set()
        for url in sample_urls:
            domain = urlparse(url).netloc
            domains.add(domain)
        
        for domain in domains:
            responses.add(
                responses.GET,
                f"https://{domain}/robots.txt",
                body="User-agent: *\nAllow: /",
                status=200,
                content_type="text/plain"
            )
        
        # Setup mock responses for each URL
        for i, url in enumerate(sample_urls):
            responses.add(
                responses.GET,
                url,
                body=f"<html><body>Content for {i}</body></html>",
                status=200,
                content_type="text/html"
            )
        
        # Test fetch_multiple
        with mock.patch('asyncio.sleep'):
            results = await network_manager.fetch_multiple(sample_urls)
        
        assert len(results) == len(sample_urls)
        assert all(result["success"] for result in results)
        
        # Check content
        for i, result in enumerate(results):
            assert f"Content for {i}" in result["content"]


class TestRateLimiter:
    """Tests for the RateLimiter class."""
    
    def test_rate_limiting(self):
        """Test that rate limiting enforces delays between requests."""
        rate_limiter = RateLimiter(requests_per_minute=60)  # 1 request per second
        
        # First request should not wait
        with mock.patch('time.sleep') as mock_sleep:
            rate_limiter.wait_for_next_request("example.com")
            mock_sleep.assert_not_called()
        
        # Second request should wait for remaining time
        with mock.patch('time.time', side_effect=[0.5, 0.5]):  # Only 0.5s passed
            with mock.patch('time.sleep') as mock_sleep:
                rate_limiter.wait_for_next_request("example.com")
                # Should wait for 0.5s more to reach 1s interval
                mock_sleep.assert_called_once()
                call_args = mock_sleep.call_args[0][0]
                assert 0.4 < call_args < 0.6
    
    @pytest.mark.asyncio
    async def test_async_rate_limiting(self):
        """Test that async rate limiting enforces delays between requests."""
        rate_limiter = RateLimiter(requests_per_minute=60)  # 1 request per second
        
        # First request should not wait
        with mock.patch('asyncio.sleep') as mock_sleep:
            await rate_limiter.async_wait_for_next_request("example.com")
            mock_sleep.assert_not_called()
        
        # Second request should wait for remaining time
        with mock.patch('time.time', side_effect=[0.5, 0.5]):  # Only 0.5s passed
            with mock.patch('asyncio.sleep') as mock_sleep:
                await rate_limiter.async_wait_for_next_request("example.com")
                # Should wait for 0.5s more to reach 1s interval
                mock_sleep.assert_called_once()
                call_args = mock_sleep.call_args[0][0]
                assert 0.4 < call_args < 0.6 