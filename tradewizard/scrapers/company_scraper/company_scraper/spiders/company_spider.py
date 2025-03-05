import scrapy


class CompanySpiderSpider(scrapy.Spider):
    name = "company_spider"
    allowed_domains = ["example.com"]
    start_urls = ["https://example.com"]

    def parse(self, response):
        pass
