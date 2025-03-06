"""
Storage module for the Export Intelligence Scraper.

This module handles all database operations including connection management,
data persistence, and query functionality.
"""

import os
import json
import sqlite3
import logging
from datetime import datetime
from contextlib import contextmanager

# Configure logging
logger = logging.getLogger(__name__)


class StorageManager:
    """Manages database operations with proper connection handling."""
    
    def __init__(self, db_path, create_tables=True):
        """
        Initialize the storage manager.
        
        Args:
            db_path: Path to the SQLite database file
            create_tables: Whether to create tables if they don't exist
        """
        self.db_path = db_path
        
        if create_tables:
            with self.get_connection() as conn:
                self._create_tables(conn)
    
    @contextmanager
    def get_connection(self):
        """
        Context manager for database connections.
        Ensures connections are properly closed after use.
        
        Yields:
            SQLite connection object
        """
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row  # Access columns by name
            yield conn
        except sqlite3.Error as e:
            logger.error(f"Database error: {e}")
            raise
        finally:
            if conn:
                conn.close()
    
    def _create_tables(self, conn):
        """
        Create database tables if they don't exist.
        
        Args:
            conn: SQLite connection object
        """
        cursor = conn.cursor()
        
        # Competitors table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS competitors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT,
            website TEXT UNIQUE,
            target_market TEXT,
            industry TEXT,
            product_category TEXT,
            cluster_id INTEGER,
            date_scraped TIMESTAMP
        )
        ''')
        
        # Customers table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT,
            website TEXT UNIQUE,
            target_market TEXT,
            industry TEXT,
            product_category TEXT,
            distributor_type TEXT,
            date_scraped TIMESTAMP
        )
        ''')
        
        # Products table - simplified foreign key approach
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            price REAL,
            price_text TEXT,
            currency TEXT,
            size TEXT,
            description TEXT,
            image_url TEXT,
            source_url TEXT,
            company_id INTEGER,
            company_type TEXT,
            target_market TEXT,
            date_scraped TIMESTAMP
        )
        ''')
        
        # Market regulations table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS market_regulations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_market TEXT,
            industry TEXT,
            regulation_type TEXT,
            description TEXT,
            source_url TEXT,
            date_updated TIMESTAMP
        )
        ''')
        
        # Market trends table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS market_trends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_market TEXT,
            industry TEXT,
            trend_name TEXT,
            description TEXT,
            importance INTEGER,
            source_url TEXT,
            date_updated TIMESTAMP
        )
        ''')
        
        # Create indexes for common queries
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_competitors_market ON competitors(target_market)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_customers_market ON customers(target_market)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_products_market ON products(target_market)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id)')
        
        conn.commit()
    
    def store_competitor(self, competitor_data):
        """
        Store a competitor in the database.
        
        Args:
            competitor_data: Dictionary containing competitor information
            
        Returns:
            int: ID of the inserted/updated competitor
        """
        competitor_data.setdefault('date_scraped', datetime.now().isoformat())
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            try:
                # Check if competitor already exists
                if 'website' in competitor_data:
                    cursor.execute(
                        "SELECT id FROM competitors WHERE website = ?", 
                        (competitor_data['website'],)
                    )
                    result = cursor.fetchone()
                    
                    if result:
                        # Update existing record
                        comp_id = result[0]
                        
                        # Build update query dynamically based on available fields
                        fields = [f"{key} = ?" for key in competitor_data.keys() if key != 'website']
                        values = [competitor_data[key] for key in competitor_data.keys() if key != 'website']
                        values.append(competitor_data['website'])
                        
                        if fields:
                            cursor.execute(
                                f"UPDATE competitors SET {', '.join(fields)} WHERE website = ?",
                                tuple(values)
                            )
                            conn.commit()
                        
                        return comp_id
                
                # Insert new record
                fields = ', '.join(competitor_data.keys())
                placeholders = ', '.join(['?' for _ in competitor_data])
                values = tuple(competitor_data.values())
                
                cursor.execute(
                    f"INSERT INTO competitors ({fields}) VALUES ({placeholders})",
                    values
                )
                
                conn.commit()
                return cursor.lastrowid
                
            except sqlite3.Error as e:
                logger.error(f"Error storing competitor: {e}")
                conn.rollback()
                raise
    
    def store_customer(self, customer_data):
        """
        Store a customer in the database.
        
        Args:
            customer_data: Dictionary containing customer information
            
        Returns:
            int: ID of the inserted/updated customer
        """
        customer_data.setdefault('date_scraped', datetime.now().isoformat())
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            try:
                # Check if customer already exists
                if 'website' in customer_data:
                    cursor.execute(
                        "SELECT id FROM customers WHERE website = ?", 
                        (customer_data['website'],)
                    )
                    result = cursor.fetchone()
                    
                    if result:
                        # Update existing record
                        cust_id = result[0]
                        
                        # Build update query dynamically based on available fields
                        fields = [f"{key} = ?" for key in customer_data.keys() if key != 'website']
                        values = [customer_data[key] for key in customer_data.keys() if key != 'website']
                        values.append(customer_data['website'])
                        
                        if fields:
                            cursor.execute(
                                f"UPDATE customers SET {', '.join(fields)} WHERE website = ?",
                                tuple(values)
                            )
                        
                        return cust_id
                
                # Insert new record
                fields = ', '.join(customer_data.keys())
                placeholders = ', '.join(['?' for _ in customer_data])
                values = tuple(customer_data.values())
                
                cursor.execute(
                    f"INSERT INTO customers ({fields}) VALUES ({placeholders})",
                    values
                )
                
                conn.commit()
                return cursor.lastrowid
                
            except sqlite3.Error as e:
                logger.error(f"Error storing customer: {e}")
                conn.rollback()
                raise
    
    def store_product(self, product_data):
        """
        Store a product in the database.
        
        Args:
            product_data: Dictionary containing product information
            
        Returns:
            int: ID of the inserted product
        """
        product_data.setdefault('date_scraped', datetime.now().isoformat())
        
        # Handle price conversion if needed
        if 'price_text' in product_data and 'price' not in product_data:
            price_text = product_data['price_text']
            try:
                # Extract numeric price using simple regex
                import re
                price_match = re.search(r'[\d,\.]+', price_text)
                if price_match:
                    price_str = price_match.group(0).replace(',', '.')
                    product_data['price'] = float(price_str)
            except:
                logger.warning(f"Could not parse price from '{price_text}'")
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            try:
                # Insert new record
                fields = ', '.join(product_data.keys())
                placeholders = ', '.join(['?' for _ in product_data])
                values = tuple(product_data.values())
                
                cursor.execute(
                    f"INSERT INTO products ({fields}) VALUES ({placeholders})",
                    values
                )
                
                conn.commit()
                return cursor.lastrowid
                
            except sqlite3.Error as e:
                logger.error(f"Error storing product: {e}")
                conn.rollback()
                raise
    
    def get_competitors(self, target_market=None, industry=None, limit=100):
        """
        Get competitors from the database.
        
        Args:
            target_market: Filter by target market (optional)
            industry: Filter by industry (optional)
            limit: Maximum number of records to return
            
        Returns:
            list: List of competitor dictionaries
        """
        query = "SELECT * FROM competitors WHERE 1=1"
        params = []
        
        if target_market:
            query += " AND target_market = ?"
            params.append(target_market)
        
        if industry:
            query += " AND industry = ?"
            params.append(industry)
        
        query += f" LIMIT {limit}"
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            
            return [dict(row) for row in cursor.fetchall()]
    
    def get_customers(self, target_market=None, industry=None, limit=100):
        """
        Get customers from the database.
        
        Args:
            target_market: Filter by target market (optional)
            industry: Filter by industry (optional)
            limit: Maximum number of records to return
            
        Returns:
            list: List of customer dictionaries
        """
        query = "SELECT * FROM customers WHERE 1=1"
        params = []
        
        if target_market:
            query += " AND target_market = ?"
            params.append(target_market)
        
        if industry:
            query += " AND industry = ?"
            params.append(industry)
        
        query += f" LIMIT {limit}"
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            
            return [dict(row) for row in cursor.fetchall()]
    
    def get_products(self, target_market=None, company_type=None, min_price=None, max_price=None, limit=100):
        """
        Get products from the database.
        
        Args:
            target_market: Filter by target market (optional)
            company_type: Filter by company type ('competitor' or 'customer') (optional)
            min_price: Minimum price filter (optional)
            max_price: Maximum price filter (optional)
            limit: Maximum number of records to return
            
        Returns:
            list: List of product dictionaries
        """
        query = "SELECT * FROM products WHERE 1=1"
        params = []
        
        if target_market:
            query += " AND target_market = ?"
            params.append(target_market)
        
        if company_type:
            query += " AND company_type = ?"
            params.append(company_type)
        
        if min_price is not None:
            query += " AND price >= ?"
            params.append(min_price)
        
        if max_price is not None:
            query += " AND price <= ?"
            params.append(max_price)
        
        query += f" LIMIT {limit}"
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            
            return [dict(row) for row in cursor.fetchall()]
    
    def get_product_stats(self, target_market, company_type=None):
        """
        Get product price statistics for a target market.
        
        Args:
            target_market: Target market to analyze
            company_type: Filter by company type (optional)
            
        Returns:
            dict: Dictionary with price statistics
        """
        query = """
        SELECT 
            company_type,
            COUNT(*) as count,
            AVG(price) as avg_price,
            MIN(price) as min_price,
            MAX(price) as max_price,
            currency
        FROM products
        WHERE target_market = ? AND price IS NOT NULL
        """
        params = [target_market]
        
        if company_type:
            query += " AND company_type = ?"
            params.append(company_type)
        
        query += " GROUP BY company_type, currency"
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            
            results = [dict(row) for row in cursor.fetchall()]
            
            # Organize by company_type and currency
            stats = {}
            for row in results:
                company = row['company_type']
                currency = row['currency']
                
                if company not in stats:
                    stats[company] = {}
                
                stats[company][currency] = {
                    'count': row['count'],
                    'avg_price': row['avg_price'],
                    'min_price': row['min_price'],
                    'max_price': row['max_price']
                }
            
            return stats
    
    def export_data(self, target_dir, market=None):
        """
        Export database data to CSV/JSON files.
        
        Args:
            target_dir: Directory to save exported files
            market: Filter by specific market (optional)
            
        Returns:
            dict: Paths to the exported files
        """
        os.makedirs(target_dir, exist_ok=True)
        export_files = {}
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Export competitors
            query = "SELECT * FROM competitors"
            params = []
            if market:
                query += " WHERE target_market = ?"
                params.append(market)
            
            cursor.execute(query, params)
            competitors = [dict(row) for row in cursor.fetchall()]
            
            competitors_file = os.path.join(target_dir, "competitors.json")
            with open(competitors_file, 'w') as f:
                json.dump(competitors, f, indent=2)
            export_files['competitors'] = competitors_file
            
            # Export customers
            query = "SELECT * FROM customers"
            params = []
            if market:
                query += " WHERE target_market = ?"
                params.append(market)
            
            cursor.execute(query, params)
            customers = [dict(row) for row in cursor.fetchall()]
            
            customers_file = os.path.join(target_dir, "customers.json")
            with open(customers_file, 'w') as f:
                json.dump(customers, f, indent=2)
            export_files['customers'] = customers_file
            
            # Export products
            query = "SELECT * FROM products"
            params = []
            if market:
                query += " WHERE target_market = ?"
                params.append(market)
            
            cursor.execute(query, params)
            products = [dict(row) for row in cursor.fetchall()]
            
            products_file = os.path.join(target_dir, "products.json")
            with open(products_file, 'w') as f:
                json.dump(products, f, indent=2)
            export_files['products'] = products_file
        
        return export_files
        
    def close(self):
        """Close any open resources. Not needed with context managers, but included for compatibility."""
        pass  # The context manager handles connection closing 