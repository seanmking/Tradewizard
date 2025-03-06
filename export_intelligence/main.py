#!/usr/bin/env python3
"""
Export Intelligence Scraper - Main Entry Point

This script initializes and runs the Export Market Intelligence Scraper.
"""

import os
import sys
import json
import logging
import argparse
from datetime import datetime

from export_intelligence.core.network import NetworkManager
from export_intelligence.core.storage import StorageManager


def setup_logging(log_level=logging.INFO, log_file=None):
    """Set up logging configuration.
    
    Args:
        log_level: Logging level (default: INFO)
        log_file: Path to log file (default: None, log to console only)
    """
    handlers = [logging.StreamHandler()]
    
    if log_file:
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        handlers.append(logging.FileHandler(log_file))
    
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=handlers
    )


def load_config(config_path):
    """Load configuration from JSON file.
    
    Args:
        config_path: Path to configuration file
        
    Returns:
        dict: Configuration dictionary
    """
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        return config
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logging.error(f"Error loading configuration: {e}")
        sys.exit(1)


def interactive_setup():
    """Run interactive setup to create configuration.
    
    Returns:
        dict: Configuration dictionary
    """
    print("=" * 50)
    print("SME EXPORT INTELLIGENCE SCRAPER SETUP")
    print("=" * 50)
    
    config = {
        "sme_info": {},
        "industry_keywords": [],
        "product_keywords": [],
        "target_markets": {},
        "search_engines": [
            "https://www.google.com/search?q=",
            "https://www.bing.com/search?q="
        ]
    }
    
    # Basic SME information
    config["sme_info"]["name"] = input("Enter SME name: ")
    config["sme_info"]["industry"] = input("Enter SME industry (e.g., food processing, textiles): ")
    config["sme_info"]["website"] = input("Enter SME website URL: ")
    
    # Keywords for the industry
    print("\nEnter industry keywords (separated by commas): ")
    keywords = input("> ")
    config["industry_keywords"] = [k.strip() for k in keywords.split(",")]
    
    # Keywords for products
    print("\nEnter product keywords (separated by commas): ")
    keywords = input("> ")
    config["product_keywords"] = [k.strip() for k in keywords.split(",")]
    
    # Target market information
    markets_count = int(input("\nHow many target export markets? "))
    
    for i in range(markets_count):
        market = input(f"\nTarget market #{i+1} (country name): ")
        config["target_markets"][market] = {
            "competitors": [],
            "customers": []
        }
        
        # Optionally add known competitors/customers
        add_known = input(f"Add known competitors/customers for {market}? (y/n): ")
        if add_known.lower() == 'y':
            comp_count = int(input("How many known competitors? "))
            for j in range(comp_count):
                comp_url = input(f"Competitor #{j+1} URL: ")
                config["target_markets"][market]["competitors"].append(comp_url)
            
            cust_count = int(input("How many known customers/retailers? "))
            for j in range(cust_count):
                cust_url = input(f"Customer/Retailer #{j+1} URL: ")
                config["target_markets"][market]["customers"].append(cust_url)
    
    return config


def save_config(config, output_path):
    """Save configuration to JSON file.
    
    Args:
        config: Configuration dictionary
        output_path: Path to save configuration file
    """
    try:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(config, f, indent=2)
        print(f"Configuration saved to {output_path}")
    except Exception as e:
        logging.error(f"Error saving configuration: {e}")
        sys.exit(1)


def create_scraper(config, db_path=None):
    """Create and initialize scraper components.
    
    Args:
        config: Configuration dictionary
        db_path: Path to SQLite database file (default: None, creates in project dir)
        
    Returns:
        tuple: (NetworkManager, StorageManager)
    """
    # Create project directory
    project_dir = f"export_intel_{config['sme_info']['name'].replace(' ', '_').lower()}_{datetime.now().strftime('%Y%m%d')}"
    os.makedirs(project_dir, exist_ok=True)
    
    # Initialize database
    if db_path is None:
        db_path = os.path.join(project_dir, 'export_intelligence.db')
    
    # Initialize components
    network_manager = NetworkManager(config)
    storage_manager = StorageManager(db_path)
    
    return network_manager, storage_manager, project_dir


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='SME Export Intelligence Scraper')
    
    # Configuration options
    config_group = parser.add_argument_group('Configuration')
    config_group.add_argument('--config', type=str, help='Path to configuration file')
    config_group.add_argument('--create-config', action='store_true', help='Run interactive setup to create config')
    config_group.add_argument('--save-config', type=str, help='Path to save configuration')
    
    # Database options
    db_group = parser.add_argument_group('Database')
    db_group.add_argument('--db-path', type=str, help='Path to SQLite database file')
    
    # Execution options
    exec_group = parser.add_argument_group('Execution')
    exec_group.add_argument('--discover', action='store_true', help='Discover market players')
    exec_group.add_argument('--scrape', action='store_true', help='Scrape product data')
    exec_group.add_argument('--analyze', action='store_true', help='Analyze data')
    exec_group.add_argument('--export', type=str, help='Export data to directory')
    exec_group.add_argument('--market', type=str, help='Target specific market')
    
    # Logging options
    log_group = parser.add_argument_group('Logging')
    log_group.add_argument('--log-file', type=str, help='Path to log file')
    log_group.add_argument('--verbose', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    # Set up logging
    log_level = logging.DEBUG if args.verbose else logging.INFO
    setup_logging(log_level=log_level, log_file=args.log_file)
    
    # Handle configuration
    if args.create_config:
        config = interactive_setup()
        if args.save_config:
            save_config(config, args.save_config)
        elif args.config:
            save_config(config, args.config)
    elif args.config:
        config = load_config(args.config)
    else:
        parser.print_help()
        sys.exit(0)
    
    # Create scraper components
    network_manager, storage_manager, project_dir = create_scraper(config, args.db_path)
    
    # TODO: Implement operation handlers for discovery, scraping, and analysis
    if args.discover:
        print("Discover operation not implemented yet")
        # Will implement in Phase 2 when we build the extractor component
    
    if args.scrape:
        print("Scrape operation not implemented yet")
        # Will implement in Phase 2 when we build the extractor component
    
    if args.analyze:
        print("Analyze operation not implemented yet")
        # Will implement in Phase 3 when we build the analysis component
    
    # Export data if requested
    if args.export:
        export_dir = args.export
        os.makedirs(export_dir, exist_ok=True)
        export_files = storage_manager.export_data(export_dir, market=args.market)
        print(f"Data exported to {export_dir}")
        for file_type, file_path in export_files.items():
            print(f"- {file_type}: {file_path}")
    
    print(f"Project directory: {project_dir}")
    print("Done.")


if __name__ == "__main__":
    main() 