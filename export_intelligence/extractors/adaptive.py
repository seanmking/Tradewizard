"""
Adaptive extractor module for the Export Intelligence Scraper.

This module implements an extractor that can adapt and learn patterns
as it processes more documents.
"""

import re
import json
import logging
from copy import deepcopy
from datetime import datetime
from bs4 import BeautifulSoup

from export_intelligence.extractors.base import BaseExtractor

# Configure logging
logger = logging.getLogger(__name__)

class AdaptiveExtractor(BaseExtractor):
    """
    Adaptive extractor that can learn and adjust extraction patterns
    based on document processing history.
    """
    
    def __init__(self, config=None, industry_patterns=None, market_patterns=None):
        """
        Initialize the adaptive extractor.
        
        Args:
            config: Configuration dictionary
            industry_patterns: Dictionary mapping industries to extraction patterns
            market_patterns: Dictionary mapping markets to extraction patterns
        """
        super().__init__(config)
        self.industry_patterns = industry_patterns or {}
        self.market_patterns = market_patterns or {}
        self.learned_patterns = {}
        self.pattern_performance = {}  # Track pattern success rates
    
    def _extract(self, soup, url=None, context=None):
        """
        Extract data using industry and market-specific patterns.
        
        Args:
            soup: BeautifulSoup object
            url: Source URL for reference
            context: Additional context with industry, market, etc.
            
        Returns:
            Dictionary of extracted data
        """
        if not context or 'industry' not in context:
            logger.warning("Missing industry in context, extraction may be limited")
            return {}
            
        industry = context.get('industry')
        market = context.get('market')
        subsector = context.get('subsector')
        
        results = {}
        
        # Get patterns appropriate for this document
        patterns = self._get_patterns_for_context(industry, market, subsector)
        
        # Apply each pattern and collect results
        for pattern_id, pattern in patterns.items():
            pattern_result = self._apply_pattern(soup, pattern, url)
            
            if pattern_result:
                results[pattern_id] = pattern_result
                self._update_pattern_performance(pattern_id, True)
            else:
                self._update_pattern_performance(pattern_id, False)
                
                # Try to learn a better pattern if this one failed
                if self._should_attempt_learning(pattern_id):
                    learned_pattern = self._learn_pattern(soup, pattern, context)
                    if learned_pattern:
                        logger.info(f"Learned new pattern variant for {pattern_id}")
                        self._store_learned_pattern(pattern_id, learned_pattern)
        
        return results
    
    def _get_patterns_for_context(self, industry, market=None, subsector=None):
        """
        Get patterns applicable to the current context.
        
        Args:
            industry: Industry name
            market: Target market name
            subsector: Subsector name
            
        Returns:
            Dictionary of pattern_id -> pattern
        """
        patterns = {}
        
        # Add industry patterns
        if industry in self.industry_patterns:
            patterns.update(self.industry_patterns[industry])
            
        # Add subsector patterns if available
        if subsector and industry in self.industry_patterns and subsector in self.industry_patterns[industry]:
            patterns.update(self.industry_patterns[industry][subsector])
            
        # Add market patterns
        if market and market in self.market_patterns:
            patterns.update(self.market_patterns[market])
            
        # Add learned patterns
        for pattern_id, pattern in self.learned_patterns.items():
            # Only add learned patterns that match the current context
            if (not pattern.get('industry') or pattern.get('industry') == industry) and \
               (not pattern.get('market') or pattern.get('market') == market) and \
               (not pattern.get('subsector') or pattern.get('subsector') == subsector):
                patterns[pattern_id] = pattern
        
        return patterns
    
    def _apply_pattern(self, soup, pattern, url=None):
        """
        Apply a specific pattern to extract data.
        
        Args:
            soup: BeautifulSoup object
            pattern: Pattern dictionary
            url: Source URL
            
        Returns:
            Extracted data or None if extraction failed
        """
        if not pattern:
            return None
            
        pattern_type = pattern.get('type', 'regex')
        
        if pattern_type == 'regex':
            return self._apply_regex_pattern(soup, pattern)
        elif pattern_type == 'table':
            return self._extract_structured_table(soup, pattern)
        elif pattern_type == 'list':
            return self._extract_structured_list(soup, pattern)
        else:
            logger.warning(f"Unknown pattern type: {pattern_type}")
            return None
    
    def _apply_regex_pattern(self, soup, pattern):
        """
        Apply a regex-based extraction pattern.
        
        Args:
            soup: BeautifulSoup object
            pattern: Pattern dictionary
            
        Returns:
            Extracted data or None
        """
        # Find context elements with markers
        context_elements = self.find_context_with_markers(
            soup, 
            pattern.get('textMarkers', []), 
            pattern.get('contextWindowSize', 500)
        )
        
        if not context_elements:
            return None
        
        # Try to extract from each context element
        for element in context_elements:
            text = element.get_text(separator=' ', strip=True)
            regex = pattern.get('regexPattern', '')
            
            # Skip if no regex pattern
            if not regex:
                continue
                
            # Extract using regex
            group_mappings = {}
            if 'attributeExtraction' in pattern:
                for attr, mapping in pattern['attributeExtraction'].items():
                    if mapping.startswith('regexGroup'):
                        try:
                            group_num = int(mapping.split('[')[1].split(']')[0])
                            group_mappings[attr] = group_num
                        except (IndexError, ValueError):
                            pass
            
            result = self.extract_with_regex(text, regex, group_mappings)
            
            if result:
                # Apply validation if present
                if 'validationLogic' in pattern:
                    validation_result = self._validate_extraction(result, pattern)
                    result['validation'] = validation_result
                    
                # Enrich with metadata
                result['pattern_id'] = pattern.get('patternId', 'unknown')
                result['source_element'] = str(element)[:100] + '...' if len(str(element)) > 100 else str(element)
                
                return result
                
        return None
    
    def _extract_structured_table(self, soup, pattern):
        """
        Extract data from structured tables.
        
        Args:
            soup: BeautifulSoup object
            pattern: Pattern dictionary
            
        Returns:
            Extracted table data or None
        """
        # Find tables in the document
        tables = soup.find_all('table')
        if not tables:
            return None
            
        table_headers = pattern.get('structuredTableExtraction', {}).get('tableHeaders', [])
        required_nutrients = pattern.get('structuredTableExtraction', {}).get('requiredNutrients', [])
        
        for table in tables:
            # Check if this looks like a relevant table
            headers = [th.get_text(strip=True) for th in table.find_all('th')]
            if not headers and table.find('tr'):
                # Try first row if no th elements
                headers = [td.get_text(strip=True) for td in table.find('tr').find_all('td')]
                
            if not any(header in ' '.join(headers) for header in table_headers):
                continue
                
            rows = table.find_all('tr')
            
            # Extract data from rows
            table_data = {}
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    nutrient = cells[0].get_text(strip=True)
                    value = cells[1].get_text(strip=True)
                    
                    # Check if this is a nutrient we're interested in
                    if any(req.lower() in nutrient.lower() for req in required_nutrients):
                        table_data[nutrient] = value
            
            if table_data:
                return {
                    'type': 'table',
                    'data': table_data,
                    'pattern_id': pattern.get('patternId', 'unknown')
                }
                
        return None
    
    def _extract_structured_list(self, soup, pattern):
        """
        Extract data from structured lists.
        
        Args:
            soup: BeautifulSoup object
            pattern: Pattern dictionary
            
        Returns:
            Extracted list data or None
        """
        # Try to find context elements with markers
        context_elements = self.find_context_with_markers(
            soup, 
            pattern.get('textMarkers', []), 
            pattern.get('contextWindowSize', 500)
        )
        
        if not context_elements:
            return None
        
        for element in context_elements:
            # Look for lists in the context
            lists = element.find_all(['ul', 'ol'])
            
            # If no lists, look for specially formatted text
            if not lists:
                # Try to look for allergen lists or similar
                text = element.get_text(strip=True)
                regex = pattern.get('regexPattern', '')
                
                if regex:
                    result = self.extract_with_regex(text, regex)
                    if result:
                        return {
                            'type': 'extracted_list',
                            'data': result,
                            'pattern_id': pattern.get('patternId', 'unknown')
                        }
                continue
                
            # Extract items from lists
            mandatory_items = pattern.get('structuredListExtraction', {}).get('mandatoryAllergens', [])
            list_items = {}
            
            for lst in lists:
                items = [li.get_text(strip=True) for li in lst.find_all('li')]
                
                # Check if this list contains mandatory items
                matched_items = []
                for item in items:
                    for mandatory in mandatory_items:
                        if mandatory.lower() in item.lower():
                            matched_items.append(item)
                
                if matched_items:
                    list_items['items'] = matched_items
                    return {
                        'type': 'list',
                        'data': list_items,
                        'pattern_id': pattern.get('patternId', 'unknown')
                    }
                    
        return None
    
    def _validate_extraction(self, data, pattern):
        """
        Apply validation logic to extracted data.
        
        Args:
            data: Extracted data
            pattern: Pattern with validation logic
            
        Returns:
            Validation result
        """
        validation_logic = pattern.get('validationLogic', '')
        if not validation_logic:
            return None
            
        # This is a simplified approach - in production, you would use
        # a safer evaluation mechanism or predetermined validation functions
        flag = None
        
        # Variables available to validation logic
        subsector = pattern.get('subsector', '')
        
        # Extract validation-related variables from pattern
        vars_dict = {
            'subsector': subsector,
            'data': data,
            'flag': flag,
            'pattern': pattern
        }
        
        # Execute validation logic (simplified for example)
        # In production, use a safer approach or predefined validation functions
        try:
            # Simple case handling for common validation patterns
            if 'ALLERGEN_NOT_EMPHASIZED' in validation_logic:
                if 'allergen' in data and 'bold' not in str(data.get('source_element', '')).lower():
                    flag = 'ALLERGEN_NOT_EMPHASIZED'
            elif 'MISSING_ADDED_SUGARS' in validation_logic:
                if 'Added Sugars' not in data.get('data', {}):
                    flag = 'MISSING_ADDED_SUGARS'
            # Add more validation cases as needed
        except Exception as e:
            logger.error(f"Validation error: {str(e)}")
            flag = f"VALIDATION_ERROR: {str(e)}"
            
        return flag
    
    def _update_pattern_performance(self, pattern_id, success):
        """
        Update pattern performance metrics.
        
        Args:
            pattern_id: Pattern identifier
            success: Whether extraction was successful
        """
        if pattern_id not in self.pattern_performance:
            self.pattern_performance[pattern_id] = {
                'attempts': 0,
                'successes': 0
            }
            
        self.pattern_performance[pattern_id]['attempts'] += 1
        if success:
            self.pattern_performance[pattern_id]['successes'] += 1
    
    def _should_attempt_learning(self, pattern_id):
        """
        Determine if we should try to learn a new pattern.
        
        Args:
            pattern_id: Pattern identifier
            
        Returns:
            Boolean indicating whether to attempt learning
        """
        if pattern_id not in self.pattern_performance:
            return True
            
        stats = self.pattern_performance[pattern_id]
        success_rate = stats['successes'] / stats['attempts'] if stats['attempts'] > 0 else 0
        
        # Only try to learn if we have sufficient attempts and poor success rate
        return stats['attempts'] >= 5 and success_rate < 0.5
    
    def _learn_pattern(self, soup, original_pattern, context):
        """
        Try to learn a better pattern based on document structure.
        This is a simplified implementation - a real system would use more
        sophisticated pattern learning algorithms.
        
        Args:
            soup: BeautifulSoup object
            original_pattern: The original pattern that failed
            context: Context information
            
        Returns:
            New pattern or None if learning failed
        """
        # This is a simplified placeholder for pattern learning
        # In a real implementation, this would use more sophisticated algorithms
        
        if 'regexPattern' not in original_pattern:
            return None
            
        # Try to create a more generalized pattern
        original_regex = original_pattern['regexPattern']
        
        # Simple generalizations:
        # 1. Replace specific numbers with \d+
        generalized_regex = re.sub(r'\d+', r'\\d+', original_regex)
        
        # 2. Make whitespace more flexible
        generalized_regex = re.sub(r'\s+', r'\\s+', generalized_regex)
        
        # 3. Make some literal text more flexible
        for word in ['contains', 'allergens', 'ingredients', 'nutrition', 'facts']:
            if word in generalized_regex.lower():
                case_insensitive = f"(?i:{word})"
                generalized_regex = re.sub(r'\b' + word + r'\b', case_insensitive, generalized_regex, flags=re.IGNORECASE)
        
        # Only return if the new pattern is different
        if generalized_regex != original_regex:
            new_pattern = deepcopy(original_pattern)
            new_pattern['regexPattern'] = generalized_regex
            new_pattern['learned'] = True
            new_pattern['originalPatternId'] = original_pattern.get('patternId', 'unknown')
            new_pattern['patternId'] = f"{original_pattern.get('patternId', 'pattern')}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            # Add context information
            if 'industry' in context:
                new_pattern['industry'] = context['industry']
            if 'market' in context:
                new_pattern['market'] = context['market']
            if 'subsector' in context:
                new_pattern['subsector'] = context['subsector']
                
            return new_pattern
            
        return None
    
    def _store_learned_pattern(self, original_pattern_id, new_pattern):
        """
        Store a newly learned pattern.
        
        Args:
            original_pattern_id: ID of the original pattern
            new_pattern: The newly learned pattern
        """
        pattern_id = new_pattern.get('patternId', f"learned_{len(self.learned_patterns)}")
        self.learned_patterns[pattern_id] = new_pattern
        
        # Initialize performance tracking for new pattern
        self.pattern_performance[pattern_id] = {
            'attempts': 0,
            'successes': 0
        }
        
        # Log the new pattern
        logger.info(f"Learned new pattern {pattern_id} based on {original_pattern_id}")
    
    def load_patterns_from_file(self, file_path):
        """
        Load patterns from a JSON file.
        
        Args:
            file_path: Path to the JSON patterns file
        """
        try:
            with open(file_path, 'r') as f:
                patterns_data = json.load(f)
                
            if 'industryPatterns' in patterns_data:
                self.industry_patterns = patterns_data['industryPatterns']
                
            if 'marketPatterns' in patterns_data:
                self.market_patterns = patterns_data['marketPatterns']
                
            logger.info(f"Loaded patterns from {file_path}")
            return True
        except Exception as e:
            logger.error(f"Error loading patterns from {file_path}: {str(e)}")
            return False
    
    def save_learned_patterns(self, file_path):
        """
        Save learned patterns to a JSON file.
        
        Args:
            file_path: Path to save patterns to
        """
        if not self.learned_patterns:
            logger.info("No learned patterns to save")
            return False
            
        try:
            with open(file_path, 'w') as f:
                json.dump({
                    'learnedPatterns': self.learned_patterns,
                    'timestamp': datetime.now().isoformat(),
                    'performanceMetrics': self.pattern_performance
                }, f, indent=2)
                
            logger.info(f"Saved {len(self.learned_patterns)} learned patterns to {file_path}")
            return True
        except Exception as e:
            logger.error(f"Error saving learned patterns to {file_path}: {str(e)}")
            return False 