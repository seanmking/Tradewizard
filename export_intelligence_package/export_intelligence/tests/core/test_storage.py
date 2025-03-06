"""Tests for the storage module."""

import os
import pytest
import sqlite3
from datetime import datetime

from export_intelligence.core.storage import StorageManager


class TestStorageManager:
    """Tests for the StorageManager class."""
    
    def test_init_and_connection(self, temp_db):
        """Test initialization and connection management."""
        # Create storage manager with existing database
        storage = StorageManager(temp_db, create_tables=False)
        
        # Test get_connection context manager
        with storage.get_connection() as conn:
            cursor = conn.cursor()
            
            # Check if connection works
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            assert result[0] == 1
    
    def test_create_tables(self, temp_db):
        """Test table creation."""
        storage = StorageManager(temp_db)
        
        # Check if tables were created
        with storage.get_connection() as conn:
            cursor = conn.cursor()
            
            # Get list of tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            
            # Verify all required tables exist
            required_tables = ['competitors', 'customers', 'products', 
                              'market_regulations', 'market_trends']
            
            for table in required_tables:
                assert table in tables
    
    def test_store_competitor(self, temp_db):
        """Test storing a competitor."""
        storage = StorageManager(temp_db)
        
        # Test data
        competitor = {
            'company_name': 'Test Competitor',
            'website': 'https://testcompetitor.example.com',
            'target_market': 'United States',
            'industry': 'food_processing'
        }
        
        # Store the competitor
        comp_id = storage.store_competitor(competitor)
        assert comp_id is not None
        
        # Check if competitor was stored correctly
        with storage.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM competitors WHERE id = ?", (comp_id,))
            result = dict(cursor.fetchone())
            
            assert result['company_name'] == competitor['company_name']
            assert result['website'] == competitor['website']
            assert result['target_market'] == competitor['target_market']
            assert result['industry'] == competitor['industry']
    
    def test_update_competitor(self, temp_db):
        """Test updating an existing competitor."""
        storage = StorageManager(temp_db)
        
        # Initial data
        competitor = {
            'company_name': 'Test Competitor',
            'website': 'https://testcompetitor.example.com',
            'target_market': 'United States',
            'industry': 'food_processing'
        }
        
        # Store initial data
        comp_id = storage.store_competitor(competitor)
        
        # Updated data (same website, different fields)
        updated_competitor = {
            'company_name': 'Updated Competitor',
            'website': 'https://testcompetitor.example.com',
            'target_market': 'Canada',
            'industry': 'food_processing'
        }
        
        # Update the competitor
        updated_id = storage.store_competitor(updated_competitor)
        assert updated_id == comp_id  # Should return same ID
        
        # Check if competitor was updated correctly
        with storage.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM competitors WHERE id = ?", (comp_id,))
            result = dict(cursor.fetchone())
            
            assert result['company_name'] == updated_competitor['company_name']
            assert result['target_market'] == updated_competitor['target_market']
    
    def test_store_customer(self, temp_db):
        """Test storing a customer."""
        storage = StorageManager(temp_db)
        
        # Test data
        customer = {
            'company_name': 'Test Customer',
            'website': 'https://testcustomer.example.com',
            'target_market': 'United States',
            'industry': 'retail',
            'distributor_type': 'wholesaler'
        }
        
        # Store the customer
        cust_id = storage.store_customer(customer)
        assert cust_id is not None
        
        # Check if customer was stored correctly
        with storage.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM customers WHERE id = ?", (cust_id,))
            result = dict(cursor.fetchone())
            
            assert result['company_name'] == customer['company_name']
            assert result['website'] == customer['website']
            assert result['target_market'] == customer['target_market']
            assert result['distributor_type'] == customer['distributor_type']
    
    def test_store_product(self, temp_db):
        """Test storing a product."""
        storage = StorageManager(temp_db)
        
        # First, create a competitor to link the product to
        competitor = {
            'company_name': 'Test Competitor',
            'website': 'https://testcompetitor.example.com',
            'target_market': 'United States',
            'industry': 'food_processing'
        }
        comp_id = storage.store_competitor(competitor)
        
        # Test product data
        product = {
            'name': 'Test Product',
            'price': 9.99,
            'currency': 'USD',
            'description': 'A test product description',
            'source_url': 'https://testcompetitor.example.com/product',
            'company_id': comp_id,
            'company_type': 'competitor',
            'target_market': 'United States'
        }
        
        # Store the product
        prod_id = storage.store_product(product)
        assert prod_id is not None
        
        # Check if product was stored correctly
        with storage.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM products WHERE id = ?", (prod_id,))
            result = dict(cursor.fetchone())
            
            assert result['name'] == product['name']
            assert result['price'] == product['price']
            assert result['currency'] == product['currency']
            assert result['company_id'] == comp_id
    
    def test_price_text_conversion(self, temp_db):
        """Test price text conversion to numeric values."""
        storage = StorageManager(temp_db)
        
        # Test product with price_text instead of price
        product = {
            'name': 'Price Text Product',
            'price_text': '$12.99',
            'currency': 'USD',
            'source_url': 'https://example.com/product',
            'company_type': 'competitor',
            'target_market': 'United States'
        }
        
        # Store the product
        prod_id = storage.store_product(product)
        
        # Check if price was correctly converted
        with storage.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT price FROM products WHERE id = ?", (prod_id,))
            result = cursor.fetchone()
            
            assert result[0] == 12.99
    
    def test_get_competitors(self, temp_db):
        """Test retrieving competitors."""
        storage = StorageManager(temp_db)
        
        # Create multiple competitors
        competitors = [
            {
                'company_name': 'Competitor 1',
                'website': 'https://competitor1.example.com',
                'target_market': 'United States',
                'industry': 'food'
            },
            {
                'company_name': 'Competitor 2',
                'website': 'https://competitor2.example.com',
                'target_market': 'Canada',
                'industry': 'food'
            },
            {
                'company_name': 'Competitor 3',
                'website': 'https://competitor3.example.com',
                'target_market': 'United States',
                'industry': 'beverages'
            }
        ]
        
        for comp in competitors:
            storage.store_competitor(comp)
        
        # Test retrieving all competitors
        all_comps = storage.get_competitors()
        assert len(all_comps) == 3
        
        # Test retrieving by target market
        us_comps = storage.get_competitors(target_market='United States')
        assert len(us_comps) == 2
        assert all(comp['target_market'] == 'United States' for comp in us_comps)
        
        # Test retrieving by industry
        food_comps = storage.get_competitors(industry='food')
        assert len(food_comps) == 2
        assert all(comp['industry'] == 'food' for comp in food_comps)
        
        # Test combining filters
        us_food_comps = storage.get_competitors(target_market='United States', industry='food')
        assert len(us_food_comps) == 1
        assert us_food_comps[0]['target_market'] == 'United States'
        assert us_food_comps[0]['industry'] == 'food'
    
    def test_get_product_stats(self, temp_db):
        """Test retrieving product statistics."""
        storage = StorageManager(temp_db)
        
        # Create a competitor and customer
        comp_id = storage.store_competitor({
            'company_name': 'Test Competitor',
            'website': 'https://testcompetitor.example.com',
            'target_market': 'United States',
            'industry': 'food'
        })
        
        cust_id = storage.store_customer({
            'company_name': 'Test Customer',
            'website': 'https://testcustomer.example.com',
            'target_market': 'United States',
            'industry': 'retail'
        })
        
        # Add products for both
        for i in range(5):
            # Competitor products
            storage.store_product({
                'name': f'Competitor Product {i}',
                'price': 10.0 + i,
                'currency': 'USD',
                'company_id': comp_id,
                'company_type': 'competitor',
                'target_market': 'United States'
            })
            
            # Customer products
            storage.store_product({
                'name': f'Customer Product {i}',
                'price': 15.0 + i,
                'currency': 'USD',
                'company_id': cust_id,
                'company_type': 'customer',
                'target_market': 'United States'
            })
        
        # Get stats
        stats = storage.get_product_stats('United States')
        
        # Check competitor stats
        assert 'competitor' in stats
        assert 'USD' in stats['competitor']
        comp_stats = stats['competitor']['USD']
        assert comp_stats['count'] == 5
        assert comp_stats['min_price'] == 10.0
        assert comp_stats['max_price'] == 14.0
        assert 11.0 < comp_stats['avg_price'] < 13.0  # Should be 12.0
        
        # Check customer stats
        assert 'customer' in stats
        assert 'USD' in stats['customer']
        cust_stats = stats['customer']['USD']
        assert cust_stats['count'] == 5
        assert cust_stats['min_price'] == 15.0
        assert cust_stats['max_price'] == 19.0
        assert 16.0 < cust_stats['avg_price'] < 18.0  # Should be 17.0
    
    def test_export_data(self, temp_db, tmpdir):
        """Test exporting data to files."""
        storage = StorageManager(temp_db)
        
        # Add some data
        comp_id = storage.store_competitor({
            'company_name': 'Test Competitor',
            'website': 'https://testcompetitor.example.com',
            'target_market': 'United States',
            'industry': 'food'
        })
        
        cust_id = storage.store_customer({
            'company_name': 'Test Customer',
            'website': 'https://testcustomer.example.com',
            'target_market': 'United States',
            'industry': 'retail'
        })
        
        storage.store_product({
            'name': 'Test Product',
            'price': 12.99,
            'currency': 'USD',
            'company_id': comp_id,
            'company_type': 'competitor',
            'target_market': 'United States'
        })
        
        # Export data
        export_dir = os.path.join(tmpdir, 'export')
        export_files = storage.export_data(export_dir)
        
        # Check if files were created
        assert os.path.exists(export_files['competitors'])
        assert os.path.exists(export_files['customers'])
        assert os.path.exists(export_files['products'])
        
        # Check file contents
        import json
        
        with open(export_files['competitors'], 'r') as f:
            competitors = json.load(f)
            assert len(competitors) == 1
            assert competitors[0]['company_name'] == 'Test Competitor'
        
        with open(export_files['customers'], 'r') as f:
            customers = json.load(f)
            assert len(customers) == 1
            assert customers[0]['company_name'] == 'Test Customer'
        
        with open(export_files['products'], 'r') as f:
            products = json.load(f)
            assert len(products) == 1
            assert products[0]['name'] == 'Test Product'
            assert products[0]['price'] == 12.99 