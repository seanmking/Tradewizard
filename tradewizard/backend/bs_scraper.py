#!/usr/bin/env python
# BeautifulSoup-based web scraper for TradeWizard
# Simpler and more reliable alternative to Scrapy

import requests
from bs4 import BeautifulSoup
import json
import time
import os
import re
from urllib.parse import urlparse
from typing import Dict, Any, List, Optional

class BsScraper:
    """BeautifulSoup-based scraper for company websites"""
    
    def __init__(self):
        """Initialize the scraper with default settings"""
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        # Special case handling for known websites
        self.special_cases = {
            # No special cases by default - each website should be analyzed individually
        }
    
    def extract_domain(self, url: str) -> str:
        """Extract domain from URL"""
        parsed_url = urlparse(url)
        domain = parsed_url.netloc
        if domain.startswith('www.'):
            domain = domain[4:]
        return domain
    
    def fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch a webpage and return a BeautifulSoup object"""
        # Add protocol if missing
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        try:
            print(f"[BS_SCRAPER] Fetching: {url}")
            response = requests.get(url, headers=self.headers, timeout=15, verify=False)
            response.raise_for_status()
            print(f"[BS_SCRAPER] Fetch successful, status: {response.status_code}")
            return BeautifulSoup(response.text, 'html.parser')
        except requests.exceptions.RequestException as e:
            print(f"[BS_SCRAPER] Error fetching {url}: {e}")
            return None
    
    def scrape_company_website(self, url: str) -> Dict[str, Any]:
        """Scrape a company website for business intelligence data"""
        domain = self.extract_domain(url)
        print(f"[BS_SCRAPER] Analyzing website: {url} (domain: {domain})")
        
        # Check if this is a special case website
        if domain in self.special_cases:
            print(f"[BS_SCRAPER] Using special case data for {domain}")
            return self.special_cases[domain]
        
        # Fetch the homepage
        soup = self.fetch_page(url)
        if not soup:
            print(f"[BS_SCRAPER] Failed to fetch {url}, returning empty data")
            return self._get_empty_data()
        
        # Initialize data structure
        company_data = {
            "products": {
                "categories": [],
                "items": [],
                "confidence": 0.5
            },
            "markets": {
                "current": [],
                "confidence": 0.5
            },
            "certifications": {
                "items": [],
                "confidence": 0.5
            },
            "business_details": {
                "estimated_size": "Unknown",
                "years_operating": "Unknown",
                "confidence": 0.5
            }
        }
        
        # Extract company name and basic info
        company_name = self._extract_company_name(soup, domain)
        description = self._extract_description(soup)
        
        # Extract products
        product_items = self._extract_products(soup)
        if product_items:
            company_data["products"]["items"] = product_items
            company_data["products"]["confidence"] = 0.7
        
        # Extract product categories
        categories = self._extract_categories(soup)
        if categories:
            company_data["products"]["categories"] = categories
            company_data["products"]["confidence"] = 0.7
        
        # Extract markets
        markets = self._extract_markets(soup)
        if markets:
            company_data["markets"]["current"] = markets
            company_data["markets"]["confidence"] = 0.6
        else:
            # Default to South Africa if no markets found
            company_data["markets"]["current"] = ["South Africa"]
            company_data["markets"]["confidence"] = 0.8
        
        # Extract certifications
        certifications = self._extract_certifications(soup)
        if certifications:
            company_data["certifications"]["items"] = certifications
            company_data["certifications"]["confidence"] = 0.7
        
        # Extract business details
        company_data["business_details"] = self._extract_business_details(soup)
        
        print(f"[BS_SCRAPER] Analysis complete for {domain}")
        return company_data
    
    def _extract_company_name(self, soup: BeautifulSoup, domain: str) -> str:
        """Extract company name from the webpage"""
        # Try to get from title
        if soup.title:
            title = soup.title.text.strip()
            # Clean up title (often has suffix like "| Home")
            title_parts = title.split('|')
            if len(title_parts) > 1:
                return title_parts[0].strip()
            
            # Try to extract from title without pipe
            possible_name = title.strip()
            if len(possible_name) < 50:  # Avoid very long titles
                return possible_name
        
        # Try to get from h1
        h1 = soup.find('h1')
        if h1:
            return h1.text.strip()
        
        # Try to get from logo alt text
        logo = soup.find('img', {'class': ['logo', 'header-logo']})
        if logo and 'alt' in logo.attrs:
            return logo['alt'].strip()
        
        # Fall back to domain name
        return domain.split('.')[0].title()
    
    def _extract_description(self, soup: BeautifulSoup) -> str:
        """Extract company description"""
        # Try meta description
        meta_desc = soup.find('meta', {'name': 'description'})
        if meta_desc and 'content' in meta_desc.attrs:
            return meta_desc['content'].strip()
        
        # Try about section
        about_section = soup.find(['div', 'section'], {'id': 'about'}) or \
                        soup.find(['div', 'section'], {'class': 'about'})
        if about_section:
            paragraphs = about_section.find_all('p')
            if paragraphs:
                return ' '.join([p.text.strip() for p in paragraphs[:2]])
        
        # Try first few paragraphs
        paragraphs = soup.find_all('p')
        if paragraphs:
            return ' '.join([p.text.strip() for p in paragraphs[:2]])
        
        return "No description found"
    
    def _extract_products(self, soup: BeautifulSoup) -> List[str]:
        """Extract product items"""
        products = []
        
        # Try product sections
        product_section = soup.find(['div', 'section'], {'id': 'products'}) or \
                         soup.find(['div', 'section'], {'class': 'products'})
        
        if product_section:
            # Try to find product items
            product_items = product_section.find_all(['div', 'article'], {'class': ['product', 'product-item']})
            if product_items:
                for item in product_items[:5]:  # Limit to 5 products
                    name = item.find(['h2', 'h3', 'h4'])
                    if name:
                        products.append(name.text.strip())
        
        # If no products found, try looking for product mentions in headings
        if not products:
            for heading in soup.find_all(['h2', 'h3']):
                if 'product' in heading.text.lower():
                    parent = heading.parent
                    if parent:
                        list_items = parent.find_all('li')
                        if list_items:
                            for item in list_items[:5]:
                                products.append(item.text.strip())
        
        # If still no products, try looking at all links that might be products
        if not products:
            for link in soup.find_all('a'):
                href = link.get('href', '')
                if 'product' in href.lower() and link.text.strip():
                    products.append(link.text.strip())
            
            # Limit to 5 unique products
            products = list(set(products))[:5]
        
        return products
    
    def _extract_categories(self, soup: BeautifulSoup) -> List[str]:
        """Extract product categories"""
        categories = []
        
        # Try to find category sections
        category_section = soup.find(['div', 'section'], {'class': ['categories', 'product-categories']})
        if category_section:
            category_items = category_section.find_all(['div', 'li', 'a'], {'class': ['category', 'product-category']})
            if category_items:
                for item in category_items[:3]:  # Limit to 3 categories
                    categories.append(item.text.strip())
        
        # If no categories found, look for menu items that might be categories
        if not categories:
            menu_items = soup.find_all(['a'], {'class': ['menu-item', 'nav-item']})
            for item in menu_items:
                text = item.text.strip()
                if text and 'product' in item.get('href', '').lower():
                    categories.append(text)
        
        # If still no categories, create some based on the products
        if not categories and soup.title:
            title = soup.title.text.lower()
            if 'food' in title or 'meal' in title:
                categories = ['Food Products', 'Prepared Meals']
            elif 'cloth' in title or 'apparel' in title:
                categories = ['Clothing', 'Apparel']
            else:
                categories = ['General Products']
        
        return categories[:3]  # Limit to 3 categories
    
    def _extract_markets(self, soup: BeautifulSoup) -> List[str]:
        """Extract current markets"""
        markets = []
        
        # Look for text mentioning countries or regions
        country_indicators = [
            'south africa', 'namibia', 'botswana', 'zimbabwe', 'mozambique',
            'zambia', 'angola', 'swaziland', 'lesotho', 'africa', 'global',
            'international', 'worldwide', 'europe', 'asia', 'americas'
        ]
        
        # Search for these indicators in paragraphs
        for p in soup.find_all('p'):
            text = p.text.lower()
            for country in country_indicators:
                if country in text:
                    # Check if its mentioned in context of operations/sales
                    context_indicators = ['operate', 'market', 'sell', 'distribut', 'export', 'presence']
                    if any(indicator in text for indicator in context_indicators):
                        if country == 'africa':
                            markets.append('Africa')
                        elif country == 'europe':
                            markets.append('European Union')
                        elif country == 'asia':
                            markets.append('Asia')
                        elif country == 'americas':
                            markets.append('Americas')
                        elif country == 'global' or country == 'worldwide' or country == 'international':
                            markets.append('Global')
                        else:
                            markets.append(country.title())
        
        # Default to South Africa if no markets found
        if not markets:
            markets = ['South Africa']
        
        return list(set(markets))  # Remove duplicates
    
    def _extract_certifications(self, soup: BeautifulSoup) -> List[str]:
        """Extract certifications"""
        certifications = []
        
        # Common certification terms
        cert_terms = [
            'iso', 'haccp', 'fssc', 'certified', 'certification', 'standard',
            'sabs', 'halal', 'kosher', 'organic', 'fair trade'
        ]
        
        # Look for certification mentions
        for p in soup.find_all(['p', 'li', 'div']):
            text = p.text.lower()
            
            # Look for common certification patterns
            if any(term in text for term in cert_terms):
                # Try to extract the specific certification
                # ISO pattern (e.g., ISO 9001, ISO 14001)
                iso_match = re.search(r'iso\s+\d+', text)
                if iso_match:
                    certifications.append(iso_match.group(0).upper())
                
                # HACCP pattern
                if 'haccp' in text:
                    haccp_match = re.search(r'haccp(?:\s+level\s+\d+)?', text, re.IGNORECASE)
                    if haccp_match:
                        certifications.append(haccp_match.group(0).upper())
                    else:
                        certifications.append('HACCP')
                
                # FSSC pattern (e.g., FSSC 22000)
                fssc_match = re.search(r'fssc\s+\d+', text, re.IGNORECASE)
                if fssc_match:
                    certifications.append(fssc_match.group(0).upper())
                
                # Other common certifications
                for cert in ['Halal', 'Kosher', 'Organic', 'Fair Trade', 'SABS']:
                    if cert.lower() in text:
                        certifications.append(cert)
        
        # Remove duplicates and return the list of certifications
        return list(set(certifications))
    
    def _extract_business_details(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract business details"""
        details = {
            "estimated_size": "Unknown",
            "years_operating": "Unknown",
            "confidence": 0.5
        }
        
        # Try to find founding year
        founded_patterns = [
            r'(?:founded|established|since|est\.?)\s+in\s+(\d{4})',
            r'(?:founded|established|since|est\.?)[:\s]+(\d{4})',
            r'since\s+(\d{4})'
        ]
        
        for p in soup.find_all('p'):
            text = p.text.lower()
            for pattern in founded_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    founded_year = int(match.group(1))
                    current_year = 2024  # Hardcoded current year
                    years_operating = current_year - founded_year
                    
                    if years_operating < 5:
                        details["years_operating"] = "< 5 years"
                    elif years_operating < 10:
                        details["years_operating"] = "5-10 years"
                    else:
                        details["years_operating"] = "10+ years"
                    
                    details["confidence"] = 0.8
                    break
        
        # Try to estimate size
        size_indicators = {
            'small': ['small business', 'family owned', 'family-owned', 'family business'],
            'medium': ['medium-sized', 'medium sized', 'growing business'],
            'large': ['large', 'corporation', 'international', 'global presence']
        }
        
        for p in soup.find_all('p'):
            text = p.text.lower()
            for size, indicators in size_indicators.items():
                if any(indicator in text for indicator in indicators):
                    details["estimated_size"] = size.title()
                    details["confidence"] = 0.7
                    break
        
        # Check for team/about page for size estimation
        team_page = soup.find('a', text=re.compile(r'team|about us|our people', re.IGNORECASE))
        if team_page and team_page.has_attr('href'):
            details["estimated_size"] = "Medium"  # Default assumption
            details["confidence"] = 0.6
        
        return details
    
    def _get_empty_data(self) -> Dict[str, Any]:
        """Return empty data structure"""
        return {
            "products": {
                "categories": [],
                "items": [],
                "confidence": 0
            },
            "markets": {
                "current": [],
                "confidence": 0
            },
            "certifications": {
                "items": [],
                "confidence": 0
            },
            "business_details": {
                "estimated_size": "Unknown",
                "years_operating": "Unknown",
                "confidence": 0
            }
        }

# For direct testing
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 3:
        print("Usage: python bs_scraper.py <url> <output_file>")
        sys.exit(1)
    
    url = sys.argv[1]
    output_file = sys.argv[2]
    
    scraper = BsScraper()
    data = scraper.scrape_company_website(url)
    
    # Write data to output file
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Data saved to {output_file}") 