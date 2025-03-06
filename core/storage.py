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