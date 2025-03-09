#!/usr/bin/env python3
"""
Example usage of the Export Intelligence Scraper for food products.

This script demonstrates how to set up and use the extraction pipeline
to process food product data from HTML content.
"""

import os
import json
import argparse
import logging
from datetime import datetime

from export_intelligence.core.network import NetworkManager
from export_intelligence.core.storage import StorageManager
from export_intelligence.extractors import (
    ExtractionPipeline,
    clean_html_preprocessor,
    normalize_whitespace_preprocessor,
    required_fields_validator,
    market_compliance_validator,
    standardize_fields_transformer,
    enrich_data_transformer
)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def setup_extraction_pipeline(config, storage_manager=None):
    """
    Set up and configure the extraction pipeline.
    
    Args:
        config: Configuration dictionary
        storage_manager: StorageManager instance
        
    Returns:
        Configured ExtractionPipeline
    """
    pipeline = ExtractionPipeline(config, storage_manager)
    
    # Add preprocessors
    pipeline.add_preprocessor(clean_html_preprocessor)
    pipeline.add_preprocessor(normalize_whitespace_preprocessor)
    
    # Add validators
    pipeline.add_validator(required_fields_validator)
    pipeline.add_validator(market_compliance_validator)
    
    # Add transformers
    pipeline.add_transformer(standardize_fields_transformer)
    pipeline.add_transformer(enrich_data_transformer)
    
    return pipeline


def process_url(url, pipeline, network_manager, industry, market, subsector=None):
    """
    Process a product URL through the extraction pipeline.
    
    Args:
        url: URL to process
        pipeline: ExtractionPipeline instance
        network_manager: NetworkManager instance
        industry: Industry name
        market: Target market
        subsector: Industry subsector
        
    Returns:
        Processing result
    """
    logger.info(f"Processing URL: {url}")
    
    # Fetch the URL
    response = network_manager.fetch(url)
    
    if not response.get('success', False):
        logger.error(f"Failed to fetch URL: {url}")
        return None
        
    html_content = response.get('content', '')
    
    # Set up context for processing
    context = {
        'industry': industry,
        'market': market,
        'subsector': subsector,
        'company_type': 'competitor',  # Assuming we're analyzing competitor products
        'document_type': 'product'
    }
    
    # Process the document
    result = pipeline.process_document(
        document_content=html_content,
        url=url,
        document_type='product',
        context=context
    )
    
    return result


def save_results(results, output_dir):
    """
    Save results to JSON files.
    
    Args:
        results: List of processing results
        output_dir: Directory to save results to
    """
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Save each result to a separate file
    for i, result in enumerate(results):
        if not result:
            continue
            
        filename = f"product_{i}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = os.path.join(output_dir, filename)
        
        with open(filepath, 'w') as f:
            json.dump(result, f, indent=2)
            
        logger.info(f"Saved result to {filepath}")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Process food product URLs")
    parser.add_argument('--urls', nargs='+', required=True, help='URLs to process')
    parser.add_argument('--industry', default='Food Products', help='Industry name')
    parser.add_argument('--market', required=True, help='Target market (UK, USA, UAE)')
    parser.add_argument('--subsector', default='Processed Foods', help='Industry subsector')
    parser.add_argument('--output-dir', default='output', help='Output directory')
    parser.add_argument('--db-path', default='export_intelligence.db', help='Database file path')
    
    args = parser.parse_args()
    
    # Set up configuration
    config = {
        'network': {
            'timeout': 30,
            'retries': 3,
            'user_agent': 'Export Intelligence Scraper/1.0',
            'respect_robots_txt': True,
            'rate_limit': 10  # requests per minute
        },
        'storage': {
            'db_path': args.db_path
        },
        'extraction': {
            'html_fingerprinting': True,
            'use_adaptive_extraction': True,
            'save_learned_patterns': True
        }
    }
    
    # Set up storage
    storage_manager = StorageManager(db_path=config['storage']['db_path'], create_tables=True)
    
    # Set up network manager
    network_manager = NetworkManager(config=config['network'])
    
    # Set up extraction pipeline
    pipeline = setup_extraction_pipeline(config['extraction'], storage_manager)
    
    # Process each URL
    results = []
    for url in args.urls:
        result = process_url(
            url=url,
            pipeline=pipeline,
            network_manager=network_manager,
            industry=args.industry,
            market=args.market,
            subsector=args.subsector
        )
        results.append(result)
    
    # Save results
    save_results(results, args.output_dir)
    
    # Clean up
    storage_manager.close()
    
    logger.info("Processing complete!")


if __name__ == '__main__':
    main() 