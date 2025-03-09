"""
Data processing pipeline for the Export Intelligence Scraper.

This module implements the extraction, validation, transformation pipeline
for processing documents and web pages.
"""

import re
import json
import logging
import hashlib
from datetime import datetime

from bs4 import BeautifulSoup

from export_intelligence.extractors.base import BaseExtractor
from export_intelligence.extractors.adaptive import AdaptiveExtractor
from export_intelligence.extractors.food import get_food_industry_patterns

# Configure logging
logger = logging.getLogger(__name__)


class ExtractionPipeline:
    """
    Pipeline for extracting, validating, and transforming data from documents.
    """
    
    def __init__(self, config=None, storage_manager=None):
        """
        Initialize the extraction pipeline.
        
        Args:
            config: Configuration dictionary
            storage_manager: StorageManager instance for persisting data
        """
        self.config = config or {}
        self.storage_manager = storage_manager
        self.extractors = {}
        self.preprocessors = []
        self.validators = []
        self.transformers = []
        self.processed_documents = {}
        
        # Initialize default extractors
        self._setup_default_extractors()
    
    def _setup_default_extractors(self):
        """Set up default extractors based on configuration."""
        # Load food industry patterns
        patterns = get_food_industry_patterns()
        
        # Create adaptive extractor with food patterns
        self.extractors['food'] = AdaptiveExtractor(
            config=self.config,
            industry_patterns=patterns['industry_patterns'],
            market_patterns=patterns['market_patterns']
        )
        
        # Add other industry extractors as needed
    
    def add_extractor(self, industry, extractor):
        """
        Add an extractor for a specific industry.
        
        Args:
            industry: Industry name
            extractor: Extractor instance
        """
        self.extractors[industry] = extractor
    
    def add_preprocessor(self, preprocessor):
        """
        Add a document preprocessor function.
        
        Args:
            preprocessor: Function that takes HTML and returns modified HTML
        """
        self.preprocessors.append(preprocessor)
    
    def add_validator(self, validator):
        """
        Add a data validator function.
        
        Args:
            validator: Function that takes extracted data and returns validation results
        """
        self.validators.append(validator)
    
    def add_transformer(self, transformer):
        """
        Add a data transformer function.
        
        Args:
            transformer: Function that takes extracted data and returns transformed data
        """
        self.transformers.append(transformer)
    
    def process_document(self, document_content, url=None, document_type=None, context=None):
        """
        Process a document through the extraction pipeline.
        
        Args:
            document_content: HTML or text content of the document
            url: Source URL for reference
            document_type: Type of document (e.g., 'regulatory', 'product')
            context: Additional context dictionary with industry, market, etc.
            
        Returns:
            Dictionary with processing results
        """
        document_id = self._generate_document_id(url, document_content)
        
        logger.info(f"Processing document: {url if url else document_id}")
        
        # Check if we've already processed this document
        if document_id in self.processed_documents:
            logger.info(f"Document already processed: {document_id}")
            return self.processed_documents[document_id]
        
        # Store basic document info
        result = {
            'document_id': document_id,
            'url': url,
            'processed_at': datetime.now().isoformat(),
            'document_type': document_type,
            'context': context or {},
            'extraction_results': {},
            'validation_results': {},
            'transformation_results': {}
        }
        
        try:
            # Preprocess the document
            processed_content = self._preprocess_document(document_content)
            
            # Extract data
            extraction_results = self._extract_data(processed_content, url, context)
            result['extraction_results'] = extraction_results
            
            # Validate extracted data
            validation_results = self._validate_data(extraction_results, context)
            result['validation_results'] = validation_results
            
            # Transform data
            transformation_results = self._transform_data(extraction_results, validation_results, context)
            result['transformation_results'] = transformation_results
            
            # Store processing result
            self.processed_documents[document_id] = result
            
            # Persist to storage if available
            if self.storage_manager and document_type:
                self._persist_results(result, document_type)
                
            return result
            
        except Exception as e:
            logger.error(f"Error processing document {url if url else document_id}: {str(e)}")
            result['error'] = str(e)
            return result
    
    def _preprocess_document(self, document_content):
        """
        Apply preprocessing steps to document content.
        
        Args:
            document_content: Raw document content
            
        Returns:
            Preprocessed document content
        """
        content = document_content
        
        # Apply each preprocessor in sequence
        for preprocessor in self.preprocessors:
            try:
                content = preprocessor(content)
            except Exception as e:
                logger.warning(f"Preprocessor error: {str(e)}")
                
        return content
    
    def _extract_data(self, content, url=None, context=None):
        """
        Extract data from document content using appropriate extractors.
        
        Args:
            content: Preprocessed document content
            url: Source URL
            context: Extraction context
            
        Returns:
            Dictionary of extracted data
        """
        if not context or 'industry' not in context:
            logger.warning("No industry specified in context, using general extraction")
            industry = 'general'
        else:
            industry = context['industry']
            
        # Get appropriate extractor
        if industry in self.extractors:
            extractor = self.extractors[industry]
        else:
            # Fall back to food extractor
            logger.warning(f"No specific extractor for {industry}, using food extractor")
            extractor = self.extractors.get('food')
            
        if not extractor:
            logger.error("No suitable extractor found")
            return {}
            
        # Extract data
        return extractor.extract_from_html(content, url, context)
    
    def _validate_data(self, extracted_data, context=None):
        """
        Validate extracted data.
        
        Args:
            extracted_data: Data extracted from document
            context: Validation context
            
        Returns:
            Dictionary of validation results
        """
        validation_results = {
            'valid': True,
            'issues': [],
            'warnings': [],
            'validator_results': {}
        }
        
        # Apply each validator
        for i, validator in enumerate(self.validators):
            try:
                validator_result = validator(extracted_data, context)
                validation_results['validator_results'][f'validator_{i}'] = validator_result
                
                # Check for validation issues
                if validator_result.get('valid') is False:
                    validation_results['valid'] = False
                    
                # Collect issues
                issues = validator_result.get('issues', [])
                if issues:
                    validation_results['issues'].extend(issues)
                    
                # Collect warnings
                warnings = validator_result.get('warnings', [])
                if warnings:
                    validation_results['warnings'].extend(warnings)
                    
            except Exception as e:
                logger.warning(f"Validator error: {str(e)}")
                validation_results['issues'].append(f"Validator {i} error: {str(e)}")
                
        return validation_results
    
    def _transform_data(self, extracted_data, validation_results, context=None):
        """
        Transform extracted and validated data.
        
        Args:
            extracted_data: Data extracted from document
            validation_results: Results of data validation
            context: Transformation context
            
        Returns:
            Dictionary of transformed data
        """
        transformed_data = extracted_data.copy()
        
        # Apply each transformer
        for i, transformer in enumerate(self.transformers):
            try:
                transformed_data = transformer(transformed_data, validation_results, context)
            except Exception as e:
                logger.warning(f"Transformer error: {str(e)}")
                
        return transformed_data
    
    def _persist_results(self, result, document_type):
        """
        Persist processing results to storage.
        
        Args:
            result: Processing result dictionary
            document_type: Type of document
        """
        try:
            if document_type == 'product':
                # Store product data
                product_data = self._prepare_product_data(result)
                if product_data:
                    self.storage_manager.store_product(product_data)
                    
            elif document_type == 'competitor':
                # Store competitor data
                competitor_data = self._prepare_competitor_data(result)
                if competitor_data:
                    self.storage_manager.store_competitor(competitor_data)
                    
            elif document_type == 'customer':
                # Store customer data
                customer_data = self._prepare_customer_data(result)
                if customer_data:
                    self.storage_manager.store_customer(customer_data)
                    
            else:
                logger.warning(f"Unknown document type for storage: {document_type}")
                
        except Exception as e:
            logger.error(f"Error persisting results: {str(e)}")
    
    def _prepare_product_data(self, result):
        """
        Prepare product data for storage.
        
        Args:
            result: Processing result dictionary
            
        Returns:
            Dictionary of product data for storage
        """
        # This is a simplified version - in production, would have more sophisticated mapping
        transformation = result.get('transformation_results', {})
        context = result.get('context', {})
        
        product_data = {
            'product_id': result.get('document_id'),
            'url': result.get('url'),
            'name': transformation.get('product_name'),
            'description': transformation.get('description'),
            'target_market': context.get('market'),
            'company_type': context.get('company_type', 'competitor'),
            'industry': context.get('industry'),
            'subsector': context.get('subsector'),
            'scraped_data': json.dumps(transformation),
            'price': self._extract_price(transformation),
            'extracted_at': result.get('processed_at')
        }
        
        return product_data
    
    def _prepare_competitor_data(self, result):
        """
        Prepare competitor data for storage.
        
        Args:
            result: Processing result dictionary
            
        Returns:
            Dictionary of competitor data for storage
        """
        # Implement competitor data preparation
        return {}
    
    def _prepare_customer_data(self, result):
        """
        Prepare customer data for storage.
        
        Args:
            result: Processing result dictionary
            
        Returns:
            Dictionary of customer data for storage
        """
        # Implement customer data preparation
        return {}
    
    def _extract_price(self, data):
        """
        Extract price from transformed data.
        
        Args:
            data: Transformed data dictionary
            
        Returns:
            Price value as float or None
        """
        # Look for price in common locations
        if 'price' in data:
            price_str = str(data['price'])
        else:
            return None
            
        # Clean and extract numeric value
        price_str = re.sub(r'[^\d.,]', '', price_str)
        
        try:
            # Handle different decimal separators
            if ',' in price_str and '.' in price_str:
                # Format like 1,234.56
                price_str = price_str.replace(',', '')
            elif ',' in price_str:
                # Format like 1,23 (European)
                price_str = price_str.replace(',', '.')
                
            return float(price_str)
        except ValueError:
            return None
    
    def _generate_document_id(self, url, content):
        """
        Generate a unique document ID.
        
        Args:
            url: Source URL
            content: Document content
            
        Returns:
            Unique document ID
        """
        if url:
            # Use URL as basis for ID
            return hashlib.md5(url.encode()).hexdigest()
        else:
            # Use content hash as ID
            return hashlib.md5(content.encode()).hexdigest()


class HTMLFingerprinter:
    """
    HTML fingerprinting for change detection.
    
    This class creates a structural fingerprint of HTML documents
    that can be used to detect when a page's structure has changed.
    """
    
    def __init__(self):
        """Initialize the HTML fingerprinter."""
        pass
    
    def generate_fingerprint(self, html):
        """
        Generate a structural fingerprint of an HTML document.
        
        Args:
            html: HTML content
            
        Returns:
            Dictionary with fingerprint information
        """
        soup = BeautifulSoup(html, 'html.parser')
        
        # Create fingerprint components
        fingerprint = {
            'tag_counts': self._count_tags(soup),
            'structure_hash': self._hash_structure(soup),
            'links': self._extract_links(soup),
            'form_count': len(soup.find_all('form')),
            'table_count': len(soup.find_all('table')),
            'image_count': len(soup.find_all('img')),
            'text_length': len(soup.get_text()),
            'heading_texts': self._extract_heading_texts(soup)
        }
        
        return fingerprint
    
    def _count_tags(self, soup):
        """Count occurrences of HTML tags."""
        tag_counts = {}
        for tag in soup.find_all(True):
            tag_name = tag.name
            tag_counts[tag_name] = tag_counts.get(tag_name, 0) + 1
        return tag_counts
    
    def _hash_structure(self, soup):
        """Create a hash of the document structure."""
        # Create a simplified representation of the structure
        structure = []
        
        def process_element(element, depth=0):
            if element.name:
                structure.append(f"{depth}:{element.name}")
                for child in element.children:
                    if child.name:
                        process_element(child, depth + 1)
        
        # Process the document body
        body = soup.find('body')
        if body:
            process_element(body)
            
        # Create a hash of the structure
        structure_str = ' '.join(structure)
        return hashlib.md5(structure_str.encode()).hexdigest()
    
    def _extract_links(self, soup):
        """Extract and categorize links."""
        links = []
        for a in soup.find_all('a', href=True):
            href = a.get('href', '')
            if href and not href.startswith('#'):
                links.append(href)
        return links
    
    def _extract_heading_texts(self, soup):
        """Extract text from headings."""
        headings = []
        for level in range(1, 7):
            for heading in soup.find_all(f'h{level}'):
                headings.append(heading.get_text(strip=True))
        return headings
    
    def compare_fingerprints(self, old_fingerprint, new_fingerprint):
        """
        Compare two fingerprints to detect changes.
        
        Args:
            old_fingerprint: Previous fingerprint
            new_fingerprint: Current fingerprint
            
        Returns:
            Dictionary with change metrics
        """
        if not old_fingerprint or not new_fingerprint:
            return {'changed': True, 'reason': 'Missing fingerprint'}
            
        changes = {
            'changed': False,
            'structure_changed': old_fingerprint['structure_hash'] != new_fingerprint['structure_hash'],
            'text_length_diff': new_fingerprint['text_length'] - old_fingerprint['text_length'],
            'tag_count_diff': {},
            'heading_changes': self._compare_headings(old_fingerprint.get('heading_texts', []), 
                                                  new_fingerprint.get('heading_texts', [])),
            'link_changes': self._compare_links(old_fingerprint.get('links', []), 
                                             new_fingerprint.get('links', []))
        }
        
        # Compare tag counts
        old_tags = old_fingerprint.get('tag_counts', {})
        new_tags = new_fingerprint.get('tag_counts', {})
        
        for tag in set(list(old_tags.keys()) + list(new_tags.keys())):
            old_count = old_tags.get(tag, 0)
            new_count = new_tags.get(tag, 0)
            if old_count != new_count:
                changes['tag_count_diff'][tag] = new_count - old_count
                
        # Determine if the page has changed significantly
        if changes['structure_changed'] or abs(changes['text_length_diff']) > 200:
            changes['changed'] = True
            
        if changes['heading_changes']['added'] or changes['heading_changes']['removed']:
            changes['changed'] = True
            
        if len(changes['tag_count_diff']) > 3:
            changes['changed'] = True
            
        return changes
    
    def _compare_headings(self, old_headings, new_headings):
        """Compare heading texts."""
        old_set = set(old_headings)
        new_set = set(new_headings)
        
        return {
            'added': list(new_set - old_set),
            'removed': list(old_set - new_set),
            'unchanged': list(old_set.intersection(new_set))
        }
    
    def _compare_links(self, old_links, new_links):
        """Compare links."""
        old_set = set(old_links)
        new_set = set(new_links)
        
        return {
            'added': list(new_set - old_set),
            'removed': list(old_set - new_set),
            'unchanged': len(old_set.intersection(new_set))
        }


# Common preprocessors
def clean_html_preprocessor(html):
    """
    Clean HTML content by removing scripts, styles, and comments.
    
    Args:
        html: HTML content
        
    Returns:
        Cleaned HTML
    """
    soup = BeautifulSoup(html, 'html.parser')
    
    # Remove scripts, styles, and comments
    for element in soup(["script", "style"]):
        element.decompose()
        
    # Remove comments
    for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
        comment.extract()
        
    return str(soup)


def normalize_whitespace_preprocessor(html):
    """
    Normalize whitespace in HTML text nodes.
    
    Args:
        html: HTML content
        
    Returns:
        HTML with normalized whitespace
    """
    soup = BeautifulSoup(html, 'html.parser')
    
    for text in soup.find_all(text=True):
        if text.parent.name not in ['script', 'style', 'pre', 'code']:
            new_text = re.sub(r'\s+', ' ', text.string.strip())
            text.replace_with(new_text)
            
    return str(soup)


# Common validators
def required_fields_validator(data, context):
    """
    Validate that required fields are present.
    
    Args:
        data: Extracted data
        context: Validation context
        
    Returns:
        Validation results
    """
    result = {
        'valid': True,
        'issues': [],
        'warnings': []
    }
    
    # Define required fields based on document type
    required_fields = []
    
    document_type = context.get('document_type', '')
    if document_type == 'product':
        required_fields = ['product_name']
    elif document_type == 'competitor':
        required_fields = ['company_name']
    elif document_type == 'customer':
        required_fields = ['company_name']
        
    # Check for missing required fields
    missing_fields = []
    for field in required_fields:
        if field not in data or not data[field]:
            missing_fields.append(field)
            
    if missing_fields:
        result['valid'] = False
        result['issues'].append(f"Missing required fields: {', '.join(missing_fields)}")
        
    return result


def market_compliance_validator(data, context):
    """
    Validate market-specific compliance requirements.
    
    Args:
        data: Extracted data
        context: Validation context
        
    Returns:
        Validation results
    """
    result = {
        'valid': True,
        'issues': [],
        'warnings': []
    }
    
    market = context.get('market', '')
    industry = context.get('industry', '')
    subsector = context.get('subsector', '')
    
    # UK market validations
    if market == 'UK':
        if subsector == 'Frozen/Canned Goods':
            # Check temperature specifications
            if 'shelf_life' in data and 'storage_temperature' in data['shelf_life']:
                temp = data['shelf_life']['storage_temperature']
                if not re.search(r'-18°C', temp):
                    result['warnings'].append("UK requires frozen goods to be stored at ≤-18°C")
                    
        # Check allergen highlighting
        if 'allergens' in data and 'contains' in data['allergens']:
            if 'emphasized_allergens' not in data['allergens'] or not data['allergens']['emphasized_allergens']:
                result['warnings'].append("UK requires allergens to be emphasized in ingredients list")
                
    # USA market validations
    elif market == 'USA':
        if 'nutrition' in data:
            # Check for complete nutrition facts
            if 'Added Sugars' not in str(data['nutrition']):
                result['warnings'].append("USA requires Added Sugars to be listed in Nutrition Facts")
                
            # Check for serving size
            if 'serving_size' not in data['nutrition']:
                result['warnings'].append("USA requires serving size information in Nutrition Facts")
                
    # UAE market validations
    elif market == 'UAE':
        # Check for Halal certification
        if 'certifications' in data:
            certifications = data['certifications'].get('certifications', [])
            if 'halal' not in [c.lower() for c in certifications]:
                result['warnings'].append("UAE markets require Halal certification for many food products")
                
        # Check for BPA-free labeling
        if 'packaging' in data and data['packaging'].get('type') == 'plastic':
            if not data['packaging'].get('bpa_free'):
                result['warnings'].append("UAE requires BPA-free labeling for plastic containers")
                
    return result


# Common transformers
def standardize_fields_transformer(data, validation_results, context):
    """
    Standardize field names and formats.
    
    Args:
        data: Extracted data
        validation_results: Validation results
        context: Transformation context
        
    Returns:
        Transformed data
    """
    transformed = data.copy()
    
    # Standardize product name
    if 'product_name' in transformed:
        transformed['product_name'] = transformed['product_name'].strip()
        
    # Standardize date formats
    if 'shelf_life' in transformed and 'date_format' in transformed['shelf_life']:
        date_format = transformed['shelf_life']['date_format']
        
        # Convert to standard ISO format if possible
        # This is a simplified example - would need more robust date parsing
        transformed['shelf_life']['date_format_standardized'] = 'ISO-8601'
        
    # Standardize temperature formats
    if 'shelf_life' in transformed and 'storage_temperature' in transformed['shelf_life']:
        temp = transformed['shelf_life']['storage_temperature']
        
        # Convert temperature to standard celsius format
        if '°F' in temp:
            try:
                f_temp = float(re.search(r'-?[\d.]+', temp).group())
                c_temp = round((f_temp - 32) * 5/9, 1)
                transformed['shelf_life']['storage_temperature_c'] = f"{c_temp}°C"
            except:
                pass
        else:
            transformed['shelf_life']['storage_temperature_c'] = temp
            
    return transformed


def enrich_data_transformer(data, validation_results, context):
    """
    Enrich data with additional information.
    
    Args:
        data: Extracted data
        validation_results: Validation results
        context: Transformation context
        
    Returns:
        Enriched data
    """
    enriched = data.copy()
    
    # Add market information
    if 'market' in context:
        enriched['target_market'] = context['market']
        
    # Add industry and subsector
    if 'industry' in context:
        enriched['industry'] = context['industry']
        
    if 'subsector' in context:
        enriched['subsector'] = context['subsector']
        
    # Add extraction quality metrics
    if validation_results:
        enriched['data_quality'] = {
            'is_valid': validation_results.get('valid', False),
            'warning_count': len(validation_results.get('warnings', [])),
            'issue_count': len(validation_results.get('issues', []))
        }
        
    # Add timestamp
    enriched['processed_timestamp'] = datetime.now().isoformat()
    
    return enriched 