"""
Base extractor module for the Export Intelligence Scraper.

This module defines the base extractor class that all specific extractors will inherit from.
"""

import re
import logging
from datetime import datetime
from bs4 import BeautifulSoup
from abc import ABC, abstractmethod

# Configure logging
logger = logging.getLogger(__name__)

class BaseExtractor(ABC):
    """
    Base class for all extractors with common functionality.
    
    This class implements common extraction methods and defines
    the interface that all concrete extractors must implement.
    """
    
    def __init__(self, config=None):
        """
        Initialize the base extractor.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        self.extraction_history = []
    
    def extract_from_html(self, html, url=None, context=None):
        """
        Extract data from HTML content.
        
        Args:
            html: HTML content as string
            url: Source URL for reference
            context: Additional context for extraction
            
        Returns:
            Extracted data as dictionary
        """
        soup = BeautifulSoup(html, 'html.parser')
        extraction_start = datetime.now()
        
        try:
            # Delegate to concrete implementation
            result = self._extract(soup, url, context)
            
            # Record success
            self._log_extraction(
                pattern_id=self.__class__.__name__,
                url=url,
                success=bool(result),
                duration=(datetime.now() - extraction_start).total_seconds()
            )
            
            return result
        except Exception as e:
            logger.error(f"Extraction error: {str(e)}")
            
            # Record failure
            self._log_extraction(
                pattern_id=self.__class__.__name__,
                url=url,
                success=False,
                duration=(datetime.now() - extraction_start).total_seconds(),
                error=str(e)
            )
            
            return None
    
    @abstractmethod
    def _extract(self, soup, url=None, context=None):
        """
        Extract data from parsed HTML.
        Must be implemented by concrete extractors.
        
        Args:
            soup: BeautifulSoup object
            url: Source URL for reference
            context: Additional context for extraction
            
        Returns:
            Extracted data as dictionary
        """
        pass
    
    def find_context_with_markers(self, soup, markers, window_size=500):
        """
        Find HTML elements containing at least one marker.
        
        Args:
            soup: BeautifulSoup object
            markers: List of marker strings to search for
            window_size: Size of context window
            
        Returns:
            List of elements containing markers
        """
        elements = []
        for marker in markers:
            # Try to find elements containing the marker
            for element in soup.find_all(string=re.compile(marker, re.IGNORECASE)):
                # Get parent elements for better context
                parent = element.parent
                if parent and parent not in elements:
                    elements.append(parent)
        
        return elements
    
    def extract_with_regex(self, text, pattern, group_mappings=None):
        """
        Extract data using regex pattern.
        
        Args:
            text: Text to search in
            pattern: Regex pattern
            group_mappings: Dictionary mapping group numbers to attribute names
            
        Returns:
            Dictionary of extracted values
        """
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if not match:
            return {}
            
        if not group_mappings:
            return {'match': match.group(0)}
            
        result = {}
        for attr_name, group_num in group_mappings.items():
            if len(match.groups()) >= group_num:
                result[attr_name] = match.group(group_num)
                
        return result
    
    def _log_extraction(self, pattern_id, url=None, success=False, duration=0, error=None):
        """
        Log extraction attempt for pattern performance tracking.
        
        Args:
            pattern_id: ID of the pattern used
            url: Source URL
            success: Whether extraction was successful
            duration: Time taken for extraction
            error: Error message if any
        """
        self.extraction_history.append({
            'pattern_id': pattern_id,
            'url': url,
            'timestamp': datetime.now().isoformat(),
            'success': success,
            'duration': duration,
            'error': error
        })
    
    def get_performance_stats(self):
        """
        Get performance statistics for this extractor.
        
        Returns:
            Dictionary of performance metrics
        """
        if not self.extraction_history:
            return {
                'attempts': 0,
                'success_rate': 0,
                'average_duration': 0
            }
            
        total = len(self.extraction_history)
        successful = sum(1 for entry in self.extraction_history if entry['success'])
        
        durations = [entry['duration'] for entry in self.extraction_history if entry['success']]
        avg_duration = sum(durations) / len(durations) if durations else 0
        
        return {
            'attempts': total,
            'success_rate': successful / total if total > 0 else 0,
            'average_duration': avg_duration,
            'needs_review': (successful / total < 0.75) if total > 0 else False
        } 