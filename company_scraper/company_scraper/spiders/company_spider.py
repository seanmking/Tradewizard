import scrapy
import json
import re
from datetime import datetime
from scrapy.loader import ItemLoader
from scrapy.linkextractors import LinkExtractor

class CompanySpider(scrapy.Spider):
    name = "company_spider"
    allowed_domains = ["example.com"]  # Change this to the domain you want to scrape
    start_urls = ["https://example.com"]  # Change this to the URL you want to start scraping from
    
    # Load our template structure
    def __init__(self, *args, **kwargs):
        super(CompanySpider, self).__init__(*args, **kwargs)
        # You can override these when running the spider
        self.company_url = kwargs.get('url', self.start_urls[0])
        self.output_file = kwargs.get('output_file', 'scraped_company_data.json')
        
        # Initialize the data structure
        self.company_data = {
            "companyInfo": {
                "name": "",
                "founded": None,
                "location": "",
                "description": "",
                "contact": {
                    "phone": "",
                    "email": "",
                    "businessHours": "",
                    "social": {
                        "instagram": "",
                        "facebook": "",
                        "linkedin": ""
                    }
                },
                "registrationDetails": {
                    "regNumber": "",
                    "vat": "",
                    "beeLevel": ""
                }
            },
            "team": [],
            "products": {
                "categories": []
            },
            "facilities": {
                "mainFacility": {
                    "size": "",
                    "location": "",
                    "features": [],
                    "capacity": "",
                    "certifications": [],
                    "upcomingCertifications": []
                }
            },
            "distribution": {
                "retailLocations": {},
                "markets": [],
                "onlinePlatforms": []
            },
            "blogPosts": [],
            "sustainability": {
                "initiatives": [],
                "futurePlans": []
            }
        }
    
    def start_requests(self):
        # Start with the main company URL
        yield scrapy.Request(url=self.company_url, callback=self.parse_main_page)
    
    def parse_main_page(self, response):
        """Parse the main company page for general information"""
        self.logger.info(f"Parsing main page: {response.url}")
        
        # Extract company name (usually in title or prominent heading)
        company_name = response.css('h1::text, .company-name::text, .logo-text::text').get('').strip()
        if not company_name:
            company_name = response.css('title::text').get('').split('|')[0].strip()
        
        self.company_data['companyInfo']['name'] = company_name
        
        # Extract company description (usually in an about section or main content)
        description = response.css('.company-description::text, #about p::text, .about-us p::text').get('').strip()
        if description:
            self.company_data['companyInfo']['description'] = description
        
        # Look for contact information
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, response.text)
        if emails:
            self.company_data['companyInfo']['contact']['email'] = emails[0]
        
        # Phone pattern
        phone_pattern = r'(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        phones = re.findall(phone_pattern, response.text)
        if phones:
            self.company_data['companyInfo']['contact']['phone'] = phones[0]
        
        # Look for social media links
        social_links = response.css('a[href*="instagram.com"]::attr(href), a[href*="facebook.com"]::attr(href), a[href*="linkedin.com"]::attr(href)').getall()
        for link in social_links:
            if 'instagram.com' in link:
                self.company_data['companyInfo']['contact']['social']['instagram'] = link
            elif 'facebook.com' in link:
                self.company_data['companyInfo']['contact']['social']['facebook'] = link
            elif 'linkedin.com' in link:
                self.company_data['companyInfo']['contact']['social']['linkedin'] = link
        
        # Look for about page, team page, products page, etc.
        about_link = response.css('a:contains("About"), a:contains("about"), a[href*="about"]').xpath('@href').get()
        team_link = response.css('a:contains("Team"), a:contains("team"), a:contains("People"), a[href*="team"]').xpath('@href').get()
        products_link = response.css('a:contains("Products"), a:contains("products"), a[href*="product"]').xpath('@href').get()
        blog_link = response.css('a:contains("Blog"), a:contains("blog"), a:contains("News"), a[href*="blog"]').xpath('@href').get()
        
        # Follow links to other pages
        if about_link:
            about_url = response.urljoin(about_link)
            yield scrapy.Request(about_url, callback=self.parse_about_page)
        
        if team_link:
            team_url = response.urljoin(team_link)
            yield scrapy.Request(team_url, callback=self.parse_team_page)
        
        if products_link:
            products_url = response.urljoin(products_link)
            yield scrapy.Request(products_url, callback=self.parse_products_page)
        
        if blog_link:
            blog_url = response.urljoin(blog_link)
            yield scrapy.Request(blog_url, callback=self.parse_blog_page)
    
    def parse_about_page(self, response):
        """Parse the about page for company history, location, etc."""
        self.logger.info(f"Parsing about page: {response.url}")
        
        # Try to find founding year
        founding_text = response.css('.founding::text, .history::text, .about p:contains("founded")::text, .about p:contains("established")::text').get()
        if founding_text:
            # Extract year with regex
            year_pattern = r'\b(19|20)\d{2}\b'
            years = re.findall(year_pattern, founding_text)
            if years:
                self.company_data['companyInfo']['founded'] = int(years[0])
        
        # Get company location
        location = response.css('.location::text, .address::text, .contact-info .address::text').get('').strip()
        if location:
            self.company_data['companyInfo']['location'] = location
        
        # Look for sustainability information
        sustainability_elements = response.css('.sustainability p, #sustainability p, .environmental p')
        for element in sustainability_elements:
            initiative_text = element.css('::text').get().strip()
            if initiative_text:
                initiative = {
                    "name": "Environmental Initiative",  # Default name
                    "description": initiative_text
                }
                self.company_data['sustainability']['initiatives'].append(initiative)
        
        # Look for facility information
        facility_elements = response.css('.facility, #facility, .production')
        if facility_elements:
            facility = facility_elements.css('::text').get().strip()
            self.company_data['facilities']['mainFacility']['location'] = facility
    
    def parse_team_page(self, response):
        """Parse the team page for information about team members"""
        self.logger.info(f"Parsing team page: {response.url}")
        
        # Look for team member cards/sections
        team_members = response.css('.team-member, .staff-member, .person, .employee')
        
        for member in team_members:
            name = member.css('.name::text, h3::text, h4::text').get('').strip()
            role = member.css('.role::text, .position::text, .title::text').get('').strip()
            background = member.css('.background::text, .bio::text, p::text').get('').strip()
            description = member.css('.description::text, .bio p::text, p:not(:first-child)::text').get('').strip()
            
            if name:
                team_member = {
                    "name": name,
                    "role": role,
                    "background": background,
                    "description": description or background
                }
                self.company_data['team'].append(team_member)
    
    def parse_products_page(self, response):
        """Parse the products page for product information"""
        self.logger.info(f"Parsing products page: {response.url}")
        
        # Look for product categories
        categories = response.css('.product-category, .category')
        
        # If no clear categories, treat all products as one category
        if not categories:
            category_name = "Products"
            category_description = response.css('.category-description::text, .products-intro::text').get('').strip()
            
            products = response.css('.product, .product-item, .item')
            items = []
            
            for product in products:
                name = product.css('.product-name::text, h3::text, h4::text').get('').strip()
                description = product.css('.product-description::text, .description::text, p::text').get('').strip()
                
                # Try to extract sizes and prices
                sizes = product.css('.size::text, .variant::text').getall()
                prices = product.css('.price::text').re(r'\d+\.?\d*')
                prices = [float(price) for price in prices] if prices else []
                
                # Extract ingredients if available
                ingredients_text = product.css('.ingredients::text').get('')
                ingredients = [ing.strip() for ing in ingredients_text.split(',')] if ingredients_text else []
                
                # Extract shelf life if available
                shelf_life = product.css('.shelf-life::text, .expiry::text').get('').strip()
                
                if name:
                    item = {
                        "name": name,
                        "sizes": sizes,
                        "prices": prices,
                        "description": description,
                        "ingredients": ingredients,
                        "shelfLife": shelf_life
                    }
                    items.append(item)
            
            self.company_data['products']['categories'].append({
                "name": category_name,
                "description": category_description,
                "items": items
            })
        else:
            # Process each category separately
            for category in categories:
                category_name = category.css('.category-name::text, h2::text, h3::text').get('').strip()
                category_description = category.css('.category-description::text, p::text').get('').strip()
                
                products = category.css('.product, .product-item, .item')
                items = []
                
                for product in products:
                    name = product.css('.product-name::text, h3::text, h4::text').get('').strip()
                    description = product.css('.product-description::text, .description::text, p::text').get('').strip()
                    
                    # Try to extract sizes and prices
                    sizes = product.css('.size::text, .variant::text').getall()
                    prices = product.css('.price::text').re(r'\d+\.?\d*')
                    prices = [float(price) for price in prices] if prices else []
                    
                    # Extract ingredients if available
                    ingredients_text = product.css('.ingredients::text').get('')
                    ingredients = [ing.strip() for ing in ingredients_text.split(',')] if ingredients_text else []
                    
                    # Extract shelf life if available
                    shelf_life = product.css('.shelf-life::text, .expiry::text').get('').strip()
                    
                    if name:
                        item = {
                            "name": name,
                            "sizes": sizes,
                            "prices": prices,
                            "description": description,
                            "ingredients": ingredients,
                            "shelfLife": shelf_life
                        }
                        items.append(item)
                
                if category_name:
                    self.company_data['products']['categories'].append({
                        "name": category_name,
                        "description": category_description,
                        "items": items
                    })
    
    def parse_blog_page(self, response):
        """Parse the blog page for recent blog posts"""
        self.logger.info(f"Parsing blog page: {response.url}")
        
        # Look for blog posts
        blog_posts = response.css('.blog-post, .post, .article, .news-item')[:3]  # Get the most recent 3 posts
        
        for post in blog_posts:
            title = post.css('.post-title::text, h2::text, h3::text').get('').strip()
            date_text = post.css('.post-date::text, .date::text, .published::text').get('').strip()
            content = post.css('.post-content::text, .content::text, .excerpt::text, p::text').get('').strip()
            
            # Try to format the date (basic attempt)
            date = date_text
            
            if title:
                blog_post = {
                    "title": title,
                    "date": date,
                    "content": content
                }
                self.company_data['blogPosts'].append(blog_post)
    
    def closed(self, reason):
        """When the spider closes, write the collected data to a JSON file"""
        with open(self.output_file, 'w', encoding='utf-8') as f:
            json.dump(self.company_data, f, ensure_ascii=False, indent=2)
        
        self.logger.info(f"Company data saved to {self.output_file}") 