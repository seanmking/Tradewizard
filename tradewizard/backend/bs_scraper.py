#!/usr/bin/env python
# BeautifulSoup-based web scraper for TradeWizard
# Simpler and more reliable alternative to Scrapy

import requests
from bs4 import BeautifulSoup
import json
import time
import os
import re
import bs4
from urllib.parse import urlparse
from typing import Dict, Any, List, Optional
import traceback

class BsScraper:
    """BeautifulSoup-based web scraper for company websites"""
    
    def __init__(self):
        """Initialize the scraper"""
        # Common product categories to look for
        self.product_categories = [
            "food", "beverage", "fruit", "vegetable", "meat", "dairy", 
            "organic", "natural", "fresh", "dried", "frozen", "canned",
            "snack", "meal", "drink", "juice", "wine", "beer", "spirits"
        ]
        
        # Common certification terms
        self.certification_terms = [
            "certified", "certification", "haccp", "iso", "halal", "kosher", 
            "organic", "fair trade", "fairtrade", "global g.a.p", "fsc", 
            "brc", "ifs", "fssc", "usda", "quality", "safety"
        ]
        
        # Add logging
        print("BsScraper initialized")
        
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
        """Scrape a company website and extract relevant information"""
        try:
            domain = self.extract_domain(url)
            soup = self.fetch_page(url)
            
            if not soup:
                print(f"Failed to fetch page for {url}")
                return self._get_empty_data()
            
            # Basic information
            company_name = self._extract_company_name(soup, domain)
            description = self._extract_description(soup)
            business_details = self._extract_business_details(soup)
            
            # Product information
            product_items = self._extract_products(soup)
            product_categories = self._extract_categories(soup)
            
            # Market and certification information
            markets = self._extract_markets(soup)
            certifications = self._extract_certifications(soup)
            
            # New enriched information
            contact_info = self._extract_contact_info(soup, domain)
            team_info = self._extract_team_info(soup)
            facilities_info = self._extract_facilities_info(soup)
            distribution_info = self._extract_distribution_info(soup)
            sustainability_info = self._extract_sustainability_info(soup)
            
            # Combine all data
            return {
                "business_details": business_details,
                "company_name": company_name,
                "description": description,
                "products": {
                    "items": product_items,
                    "categories": product_categories,
                    "confidence": 0.7 if product_items or product_categories else 0.5
                },
                "markets": {
                    "current": markets,
                    "confidence": 0.6 if markets else 0.5
                },
                "certifications": {
                    "items": certifications,
                    "confidence": 0.5 if certifications else 0.4
                },
                "contact_info": contact_info,
                "team_info": team_info,
                "facilities_info": facilities_info,
                "distribution_info": distribution_info,
                "sustainability_info": sustainability_info
            }
            
        except Exception as e:
            print(f"Error scraping website {url}: {e}")
            traceback.print_exc()
            return self._get_empty_data()
    
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
    
    def _extract_contact_info(self, soup: BeautifulSoup, domain: str) -> Dict[str, Any]:
        """Extract contact information from the website"""
        contact_info = {
            "phone": None,
            "email": None,
            "address": None,
            "social_media": [],
            "confidence": 0.5
        }
        
        # Extract email addresses
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = []
        
        # Find emails in text
        for tag in soup.find_all(['p', 'div', 'span', 'a']):
            if tag.name == 'a' and tag.get('href', '').startswith('mailto:'):
                email = tag.get('href').replace('mailto:', '').strip()
                if re.match(email_pattern, email):
                    emails.append(email)
            else:
                matches = re.findall(email_pattern, tag.text)
                emails.extend(matches)
        
        # Filter out non-company emails
        domain_name = domain.split('.')[0]
        company_emails = [email for email in emails if domain_name.lower() in email.lower()]
        
        if company_emails:
            contact_info["email"] = company_emails[0]
            contact_info["confidence"] = 0.8
        elif emails:
            contact_info["email"] = emails[0]
        
        # Extract phone numbers
        phone_pattern = r'(?:\+\d{1,3}[ -]?)?(?:\(\d{1,4}\)|\d{1,4})[ -]?\d{1,4}[ -]?\d{1,4}[ -]?\d{1,4}'
        phones = []
        
        for tag in soup.find_all(['p', 'div', 'span', 'a']):
            if tag.name == 'a' and tag.get('href', '').startswith('tel:'):
                phone = tag.get('href').replace('tel:', '').strip()
                phones.append(phone)
            else:
                matches = re.findall(phone_pattern, tag.text)
                phones.extend(matches)
        
        if phones:
            contact_info["phone"] = phones[0]
            contact_info["confidence"] = 0.8
        
        # Extract addresses
        address_keywords = ['address', 'location', 'find us', 'visit us']
        address_texts = []
        
        for tag in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'p', 'div']):
            tag_text = tag.text.lower()
            if any(keyword in tag_text for keyword in address_keywords):
                # Get the next sibling or the parent's next sibling
                siblings = list(tag.next_siblings)
                if siblings and isinstance(siblings[0], (bs4.element.Tag)):
                    address_texts.append(siblings[0].text.strip())
                elif tag.parent and list(tag.parent.next_siblings):
                    next_parent_sibling = list(tag.parent.next_siblings)[0]
                    if isinstance(next_parent_sibling, (bs4.element.Tag)):
                        address_texts.append(next_parent_sibling.text.strip())
        
        # Check for social media links
        social_platforms = {
            'facebook': r'facebook\.com',
            'twitter': r'twitter\.com|x\.com',
            'instagram': r'instagram\.com',
            'linkedin': r'linkedin\.com',
            'youtube': r'youtube\.com'
        }
        
        social_media = []
        for link in soup.find_all('a', href=True):
            href = link['href'].lower()
            for platform, pattern in social_platforms.items():
                if re.search(pattern, href):
                    social_media.append(platform)
                    break
        
        if social_media:
            contact_info["social_media"] = list(set(social_media))
            contact_info["confidence"] = max(contact_info["confidence"], 0.7)
        
        if address_texts:
            contact_info["address"] = address_texts[0]
            contact_info["confidence"] = max(contact_info["confidence"], 0.7)
        
        return contact_info

    def _extract_team_info(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract information about the company team"""
        team_info = {
            "members": [],
            "confidence": 0.5
        }
        
        # Look for team sections
        team_section_keywords = ['team', 'leadership', 'management', 'our people', 'about us', 'who we are']
        team_sections = []
        
        for heading in soup.find_all(['h1', 'h2', 'h3']):
            if any(keyword in heading.text.lower() for keyword in team_section_keywords):
                # Get the section after this heading
                section = []
                for sibling in heading.next_siblings:
                    if sibling.name in ['h1', 'h2', 'h3']:
                        break
                    if sibling.name:
                        section.append(sibling)
                
                if section:
                    team_sections.append(section)
        
        # Look for team members within these sections
        if team_sections:
            # Find person cards or listings
            for section in team_sections:
                for element in section:
                    # Check for nested structure that might represent a person
                    person_elements = element.find_all(['div', 'article', 'section'])
                    
                    # Process each potential person card
                    for person in person_elements:
                        name = None
                        role = None
                        
                        # Look for name (usually in heading)
                        name_elem = person.find(['h4', 'h5', 'h6', 'strong'])
                        if name_elem:
                            name = name_elem.text.strip()
                        
                        # Look for role (usually in paragraph or div)
                        role_elem = person.find(['p', 'div', 'span'])
                        if role_elem and role_elem != name_elem:
                            role = role_elem.text.strip()
                            # Clean up role (often contains title or position)
                            role_keywords = ['ceo', 'cfo', 'coo', 'director', 'manager', 'head', 'leader']
                            if any(keyword in role.lower() for keyword in role_keywords):
                                role = role.strip()
                            else:
                                # Try to extract just the role part
                                role_match = re.search(r'(CEO|CFO|COO|Director|Manager|Head of|Lead)\b.*', role, re.IGNORECASE)
                                if role_match:
                                    role = role_match.group(0).strip()
                        
                        if name and role:
                            team_info["members"].append({
                                "name": name,
                                "role": role
                            })
        
        if team_info["members"]:
            team_info["confidence"] = 0.7
        
        return team_info

    def _extract_facilities_info(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract information about company facilities"""
        facilities_info = {
            "locations": [],
            "features": [],
            "confidence": 0.5
        }
        
        # Look for facility-related keywords
        facility_keywords = ['facility', 'facilities', 'factory', 'plant', 'production', 'manufacturing']
        facility_sections = []
        
        for heading in soup.find_all(['h1', 'h2', 'h3', 'h4']):
            if any(keyword in heading.text.lower() for keyword in facility_keywords):
                # Get the parent section
                parent = heading.parent
                if parent:
                    facility_sections.append(parent)
        
        # Extract locations from address information or facility mentions
        location_patterns = [
            r'located in (\w+(?:[ -]\w+)*)',
            r'facility in (\w+(?:[ -]\w+)*)',
            r'factory in (\w+(?:[ -]\w+)*)',
            r'based in (\w+(?:[ -]\w+)*)'
        ]
        
        for section in facility_sections:
            section_text = section.text
            
            # Look for locations
            for pattern in location_patterns:
                matches = re.findall(pattern, section_text, re.IGNORECASE)
                if matches:
                    facilities_info["locations"].extend(matches)
            
            # Look for facility features
            feature_keywords = ['equipment', 'technology', 'machine', 'capacity', 'production line', 'processing']
            for p in section.find_all('p'):
                p_text = p.text.lower()
                if any(keyword in p_text for keyword in feature_keywords):
                    facilities_info["features"].append(p.text.strip())
        
        # If we found locations or features
        if facilities_info["locations"] or facilities_info["features"]:
            facilities_info["confidence"] = 0.7
            
            # Remove duplicates
            facilities_info["locations"] = list(set(facilities_info["locations"]))
            facilities_info["features"] = list(set(facilities_info["features"]))
        
        return facilities_info

    def _extract_distribution_info(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract information about distribution channels"""
        distribution_info = {
            "retail_locations": [],
            "online_platforms": [],
            "export_markets": [],
            "confidence": 0.5
        }
        
        # Look for distribution-related sections
        dist_keywords = ['distribution', 'where to buy', 'find our products', 'retailers', 'stores']
        dist_sections = []
        
        for heading in soup.find_all(['h1', 'h2', 'h3', 'h4']):
            if any(keyword in heading.text.lower() for keyword in dist_keywords):
                # Get the parent section
                parent = heading.parent
                if parent:
                    dist_sections.append(parent)
        
        # Look for retailer mentions
        retailer_names = ['woolworths', 'spar', 'pick n pay', 'checkers', 'shoprite', 'makro', 
                         'walmart', 'tesco', 'sainsbury', 'aldi', 'lidl', 'carrefour', 'waitrose']
        
        # Look for online platform mentions
        online_platforms = ['website', 'online store', 'e-commerce', 'takealot', 'amazon', 'ebay', 'etsy', 'shopify']
        
        for section in dist_sections:
            section_text = section.text.lower()
            
            # Check for retailers
            for retailer in retailer_names:
                if retailer in section_text:
                    distribution_info["retail_locations"].append(retailer.title())
            
            # Check for online platforms
            for platform in online_platforms:
                if platform in section_text:
                    distribution_info["online_platforms"].append(platform.title())
            
            # Look for lists that might contain locations or stores
            for ul in section.find_all('ul'):
                for li in ul.find_all('li'):
                    li_text = li.text.strip()
                    if any(retailer in li_text.lower() for retailer in retailer_names):
                        distribution_info["retail_locations"].append(li_text)
                    elif any(platform in li_text.lower() for platform in online_platforms):
                        distribution_info["online_platforms"].append(li_text)
        
        # Check for export markets
        export_keywords = ['export', 'international', 'global market', 'overseas']
        export_sections = []
        
        for p in soup.find_all('p'):
            p_text = p.text.lower()
            if any(keyword in p_text for keyword in export_keywords):
                export_sections.append(p)
        
        # Common country names to look for
        countries = ['usa', 'united states', 'uk', 'united kingdom', 'europe', 'european union', 
                     'germany', 'france', 'china', 'japan', 'australia', 'canada', 'uae', 
                     'namibia', 'botswana', 'zimbabwe', 'mozambique']
        
        for section in export_sections:
            section_text = section.text.lower()
            for country in countries:
                if country in section_text:
                    distribution_info["export_markets"].append(country.title())
        
        # Remove duplicates
        distribution_info["retail_locations"] = list(set(distribution_info["retail_locations"]))
        distribution_info["online_platforms"] = list(set(distribution_info["online_platforms"]))
        distribution_info["export_markets"] = list(set(distribution_info["export_markets"]))
        
        if (distribution_info["retail_locations"] or 
            distribution_info["online_platforms"] or 
            distribution_info["export_markets"]):
            distribution_info["confidence"] = 0.7
        
        return distribution_info

    def _extract_sustainability_info(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract information about sustainability initiatives"""
        sustainability_info = {
            "initiatives": [],
            "certifications": [],
            "confidence": 0.5
        }
        
        # Look for sustainability-related sections
        sustain_keywords = ['sustainability', 'sustainable', 'environment', 'green', 'eco', 
                           'responsible', 'ethical', 'fair trade', 'organic']
        sustain_sections = []
        
        for heading in soup.find_all(['h1', 'h2', 'h3', 'h4']):
            if any(keyword in heading.text.lower() for keyword in sustain_keywords):
                # Get the parent section
                parent = heading.parent
                if parent:
                    sustain_sections.append(parent)
        
        # Initiative keywords
        initiative_keywords = ['packaging', 'waste', 'energy', 'water', 'carbon', 'community', 
                              'recycling', 'renewable', 'footprint']
        
        # Look for initiatives within sustainability sections
        for section in sustain_sections:
            # Check for lists
            for ul in section.find_all('ul'):
                for li in ul.find_all('li'):
                    sustainability_info["initiatives"].append(li.text.strip())
            
            # Check paragraphs
            for p in section.find_all('p'):
                p_text = p.text.lower()
                if any(keyword in p_text for keyword in initiative_keywords):
                    sustainability_info["initiatives"].append(p.text.strip())
            
            # Look for sustainability certifications
            cert_keywords = ['certified', 'certification', 'organic', 'fair trade', 'rainforest alliance']
            for p in section.find_all(['p', 'li']):
                p_text = p.text.lower()
                if any(keyword in p_text for keyword in cert_keywords):
                    potential_cert = p.text.strip()
                    # Avoid adding long paragraphs as certifications
                    if len(potential_cert.split()) < 10:
                        sustainability_info["certifications"].append(potential_cert)
        
        # Check the entire page for sustainability mentions
        if not sustain_sections:
            for p in soup.find_all('p'):
                p_text = p.text.lower()
                if any(keyword in p_text for keyword in sustain_keywords):
                    if any(initiative in p_text for initiative in initiative_keywords):
                        sustainability_info["initiatives"].append(p.text.strip())
        
        # Remove duplicates
        sustainability_info["initiatives"] = list(set(sustainability_info["initiatives"]))
        sustainability_info["certifications"] = list(set(sustainability_info["certifications"]))
        
        if sustainability_info["initiatives"] or sustainability_info["certifications"]:
            sustainability_info["confidence"] = 0.7
        
        return sustainability_info

    def _get_empty_data(self) -> Dict[str, Any]:
        """Return empty data structure for when scraping fails"""
        return {
            "business_details": {
                "estimated_size": "Unknown",
                "years_operating": "Unknown",
                "confidence": 0.5
            },
            "company_name": "",
            "description": "",
            "products": {
                "items": [],
                "categories": [],
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
            "contact_info": {
                "phone": None,
                "email": None,
                "address": None,
                "social_media": [],
                "confidence": 0.5
            },
            "team_info": {
                "members": [],
                "confidence": 0.5
            },
            "facilities_info": {
                "locations": [],
                "features": [],
                "confidence": 0.5
            },
            "distribution_info": {
                "retail_locations": [],
                "online_platforms": [],
                "export_markets": [],
                "confidence": 0.5
            },
            "sustainability_info": {
                "initiatives": [],
                "certifications": [],
                "confidence": 0.5
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