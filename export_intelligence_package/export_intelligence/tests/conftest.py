import os
import pytest
import sqlite3
import tempfile
from urllib.parse import urlparse

# Sample test configuration
@pytest.fixture
def test_config():
    """Provides a sample configuration for testing"""
    return {
        "sme_info": {
            "name": "Test Company",
            "industry": "food_processing",
            "website": "https://testcompany.example.com"
        },
        "industry_keywords": ["organic", "natural", "healthy"],
        "product_keywords": ["snack", "bar", "chocolate"],
        "target_markets": {
            "United States": {
                "competitors": ["https://competitor1.example.com"],
                "customers": ["https://customer1.example.com"]
            },
            "Canada": {
                "competitors": ["https://competitor2.example.com"],
                "customers": ["https://customer2.example.com"]
            }
        },
        "search_engines": [
            "https://www.google.com/search?q=",
            "https://www.bing.com/search?q="
        ]
    }

@pytest.fixture
def sample_html_product_page():
    """Sample HTML for testing product extraction"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Products</title>
    </head>
    <body>
        <div class="product-container">
            <div class="product">
                <h2 class="product-title">Organic Chocolate Bar</h2>
                <div class="product-price">$5.99</div>
                <div class="product-description">Delicious organic chocolate bar made with premium ingredients.</div>
                <img src="/images/chocolate-bar.jpg" alt="Chocolate Bar">
            </div>
            <div class="product">
                <h2 class="product-title">Healthy Granola Snack 250g</h2>
                <div class="product-price">$4.49</div>
                <div class="product-description">Nutritious granola snack for on the go.</div>
                <img src="/images/granola.jpg" alt="Granola Snack">
            </div>
        </div>
    </body>
    </html>
    """

@pytest.fixture
def temp_db():
    """Creates a temporary SQLite database for testing"""
    fd, path = tempfile.mkstemp(suffix='.db')
    conn = sqlite3.connect(path)
    cursor = conn.cursor()
    
    # Create sample tables
    cursor.execute('''
    CREATE TABLE competitors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT,
        website TEXT,
        target_market TEXT,
        industry TEXT,
        date_scraped TIMESTAMP
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price TEXT,
        currency TEXT,
        description TEXT,
        source_url TEXT,
        company_id INTEGER,
        target_market TEXT,
        date_scraped TIMESTAMP
    )
    ''')
    
    conn.commit()
    conn.close()
    os.close(fd)
    
    yield path
    
    # Cleanup
    os.unlink(path)

@pytest.fixture
def mocked_robots_txt():
    """Returns mocked robots.txt content for testing"""
    return """
    User-agent: *
    Disallow: /private/
    Disallow: /admin/
    Allow: /
    
    User-agent: Googlebot
    Allow: /
    
    Sitemap: https://example.com/sitemap.xml
    """

@pytest.fixture
def sample_urls():
    """Sample URLs for testing"""
    return [
        "https://example.com/product/1",
        "https://example.com/product/2",
        "https://competitor.example.com/about",
        "https://customer.example.com/shop"
    ] 