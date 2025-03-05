#!/usr/bin/env python
import sys
import os
import argparse
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from company_scraper.spiders.company_spider import CompanySpider

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Scrape company data from a website')
    parser.add_argument('url', help='URL of the company website to scrape')
    parser.add_argument('-o', '--output', default='scraped_company_data.json',
                        help='Output JSON file (default: scraped_company_data.json)')
    args = parser.parse_args()
    
    # Set up the crawler process
    os.environ.setdefault('SCRAPY_SETTINGS_MODULE', 'company_scraper.settings')
    process = CrawlerProcess(get_project_settings())
    
    # Extract domain from URL to set as allowed domain
    from urllib.parse import urlparse
    domain = urlparse(args.url).netloc
    
    # Configure the spider
    spider = CompanySpider
    # Update allowed_domains and start_urls
    spider.allowed_domains = [domain]
    spider.start_urls = [args.url]
    
    # Start the crawler
    process.crawl(spider, url=args.url, output_file=args.output)
    process.start()
    
    print(f"\nScraping completed! Data saved to {args.output}")

if __name__ == "__main__":
    main()
