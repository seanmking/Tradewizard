"""
Extractors package for the Export Intelligence Scraper.

This package contains the data extraction components that parse
and extract structured data from unstructured documents.
"""

from export_intelligence.extractors.base import BaseExtractor
from export_intelligence.extractors.adaptive import AdaptiveExtractor
from export_intelligence.extractors.food import (
    FoodProductExtractor,
    FrozenCannedExtractor,
    ProcessedFoodExtractor,
    BeverageExtractor,
    get_food_industry_patterns
)
from export_intelligence.extractors.pipeline import (
    ExtractionPipeline,
    HTMLFingerprinter,
    clean_html_preprocessor,
    normalize_whitespace_preprocessor,
    required_fields_validator,
    market_compliance_validator,
    standardize_fields_transformer,
    enrich_data_transformer
)

__all__ = [
    'BaseExtractor',
    'AdaptiveExtractor',
    'FoodProductExtractor',
    'FrozenCannedExtractor',
    'ProcessedFoodExtractor',
    'BeverageExtractor',
    'ExtractionPipeline',
    'HTMLFingerprinter',
    'clean_html_preprocessor',
    'normalize_whitespace_preprocessor',
    'required_fields_validator',
    'market_compliance_validator',
    'standardize_fields_transformer',
    'enrich_data_transformer',
    'get_food_industry_patterns'
]
