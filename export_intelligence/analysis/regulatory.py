"""
Regulatory analysis module.

This module provides functionality for analyzing regulatory requirements
for different markets and industries.
"""

import logging
from datetime import datetime
import json
import os

# Configure logging
logger = logging.getLogger(__name__)

# Importance levels
IMPORTANCE_LEVELS = ['critical', 'high', 'medium', 'low']

def load_regulatory_data():
    """
    Load regulatory data from data files.
    
    Returns:
        Dictionary of regulatory data by market and industry
    """
    try:
        # In a real implementation, this would load from a database
        # For now, return a static structure
        
        # Structure: market -> industry -> document list
        return {
            'United Kingdom': {
                'Food Products': [
                    {
                        'id': 'uk-food-1',
                        'name': 'UK Food Safety Certificate',
                        'description': 'Certification for food safety standards compliance',
                        'importance': 'critical',
                        'estimatedCost': 2500,
                        'estimatedTimeInWeeks': 8,
                        'details': 'Required for all food products. Certifies compliance with UK food safety regulations.'
                    },
                    {
                        'id': 'uk-food-2',
                        'name': 'Food Labeling Compliance',
                        'description': 'Documentation of compliance with UK food labeling requirements',
                        'importance': 'critical',
                        'estimatedCost': 1200,
                        'estimatedTimeInWeeks': 4,
                        'details': 'Required for all food products. Ensures all packaging meets UK labeling standards.'
                    },
                    {
                        'id': 'uk-food-3',
                        'name': 'Health Certificate',
                        'description': 'Certificate for food product health standards',
                        'importance': 'high',
                        'estimatedCost': 800,
                        'estimatedTimeInWeeks': 3,
                        'details': 'Required for processed food products. Certifies product is safe for consumption.'
                    },
                    {
                        'id': 'uk-food-4',
                        'name': 'Organic Certification',
                        'description': 'Certification for organic food products',
                        'importance': 'medium',
                        'estimatedCost': 3000,
                        'estimatedTimeInWeeks': 12,
                        'details': 'Optional. Required only if marketing products as organic.'
                    }
                ]
            },
            'United States': {
                'Food Products': [
                    {
                        'id': 'us-food-1',
                        'name': 'FDA Registration',
                        'description': 'Registration with the US Food and Drug Administration',
                        'importance': 'critical',
                        'estimatedCost': 1500,
                        'estimatedTimeInWeeks': 6,
                        'details': 'Required for all food facilities. Must be renewed every two years.'
                    },
                    {
                        'id': 'us-food-2',
                        'name': 'Food Facility Inspection',
                        'description': 'Inspection of food production facilities',
                        'importance': 'critical',
                        'estimatedCost': 2000,
                        'estimatedTimeInWeeks': 8,
                        'details': 'Required for all food production facilities exporting to the US.'
                    },
                    {
                        'id': 'us-food-3',
                        'name': 'Nutrition Facts Compliance',
                        'description': 'Documentation of compliance with US nutrition labeling',
                        'importance': 'high',
                        'estimatedCost': 1000,
                        'estimatedTimeInWeeks': 4,
                        'details': 'Required for all packaged food products. Must follow FDA format.'
                    },
                    {
                        'id': 'us-food-4',
                        'name': 'Food Safety Plan',
                        'description': 'Documented food safety plan under FSMA',
                        'importance': 'high',
                        'estimatedCost': 3500,
                        'estimatedTimeInWeeks': 10,
                        'details': 'Required under the Food Safety Modernization Act for all food facilities.'
                    }
                ]
            },
            'United Arab Emirates': {
                'Food Products': [
                    {
                        'id': 'uae-food-1',
                        'name': 'Halal Certification',
                        'description': 'Certification for compliance with Halal requirements',
                        'importance': 'critical',
                        'estimatedCost': 2000,
                        'estimatedTimeInWeeks': 8,
                        'details': 'Required for all food products containing animal products or derivatives.'
                    },
                    {
                        'id': 'uae-food-2',
                        'name': 'Food Import License',
                        'description': 'License for importing food products into UAE',
                        'importance': 'critical',
                        'estimatedCost': 1200,
                        'estimatedTimeInWeeks': 6,
                        'details': 'Required for all imported food products. Must be obtained by local importer.'
                    },
                    {
                        'id': 'uae-food-3',
                        'name': 'Arabic Labeling Compliance',
                        'description': 'Documentation of compliance with Arabic labeling requirements',
                        'importance': 'high',
                        'estimatedCost': 800,
                        'estimatedTimeInWeeks': 4,
                        'details': 'Required for all food products. All information must be in Arabic and English.'
                    }
                ]
            }
        }
    except Exception as e:
        logger.error(f"Error loading regulatory data: {str(e)}")
        return {}

def analyze_regulatory_requirements(industry, markets):
    """
    Analyze regulatory requirements for specific markets and industry.
    
    Args:
        industry: Industry name
        markets: List of target markets
        
    Returns:
        Dictionary with regulatory requirements by market
    """
    try:
        regulatory_data = load_regulatory_data()
        
        result = {
            'markets': {}
        }
        
        for market in markets:
            if market in regulatory_data and industry in regulatory_data[market]:
                result['markets'][market] = {
                    'documents': regulatory_data[market][industry]
                }
            else:
                # Provide default documents if specific combination not found
                result['markets'][market] = {
                    'documents': _get_default_documents(market, industry)
                }
                
        return result
    except Exception as e:
        logger.error(f"Error analyzing regulatory requirements: {str(e)}")
        return {'markets': {}}

def _get_default_documents(market, industry):
    """
    Get default documents for a market-industry combination.
    
    Args:
        market: Market name
        industry: Industry name
        
    Returns:
        List of default documents
    """
    # Generic documents that apply to most markets/industries
    return [
        {
            'id': f'{market.lower()}-{industry.lower()}-1',
            'name': 'Business Registration',
            'description': f'Official business registration in {market}',
            'importance': 'critical',
            'estimatedCost': 500,
            'estimatedTimeInWeeks': 4,
            'details': f'Required for all businesses operating in {market}.'
        },
        {
            'id': f'{market.lower()}-{industry.lower()}-2',
            'name': 'Import License',
            'description': f'License to import products into {market}',
            'importance': 'critical',
            'estimatedCost': 1000,
            'estimatedTimeInWeeks': 6,
            'details': f'Required for importing goods into {market}.'
        },
        {
            'id': f'{market.lower()}-{industry.lower()}-3',
            'name': 'Quality Certification',
            'description': f'Product quality certification for {market}',
            'importance': 'high',
            'estimatedCost': 1500,
            'estimatedTimeInWeeks': 8,
            'details': f'Required for most products sold in {market}.'
        }
    ]

def calculate_compliance_readiness(owned_documents, required_documents):
    """
    Calculate compliance readiness score based on owned vs. required documents.
    
    Args:
        owned_documents: Dictionary of document IDs with boolean ownership status
        required_documents: List of required document dictionaries
        
    Returns:
        Readiness score (0-100)
    """
    if not required_documents:
        return 100  # No requirements = fully compliant
        
    # Calculate weighted score based on importance
    importance_weights = {
        'critical': 4,
        'high': 2,
        'medium': 1,
        'low': 0.5
    }
    
    total_weight = 0
    owned_weight = 0
    
    for doc in required_documents:
        weight = importance_weights.get(doc.get('importance', 'medium'), 1)
        total_weight += weight
        
        if owned_documents.get(doc.get('id')):
            owned_weight += weight
            
    if total_weight == 0:
        return 100
        
    return int((owned_weight / total_weight) * 100)

def identify_missing_critical_documents(owned_documents, required_documents):
    """
    Identify missing critical documents.
    
    Args:
        owned_documents: Dictionary of document IDs with boolean ownership status
        required_documents: List of required document dictionaries
        
    Returns:
        List of critical documents that are not owned
    """
    missing_critical = []
    
    for doc in required_documents:
        if doc.get('importance') == 'critical' and not owned_documents.get(doc.get('id')):
            missing_critical.append(doc)
            
    return missing_critical

def estimate_compliance_timeline(missing_documents):
    """
    Estimate timeline to achieve full compliance.
    
    Args:
        missing_documents: List of documents that are not owned
        
    Returns:
        Estimated timeline in weeks
    """
    if not missing_documents:
        return 0
        
    # Assuming some documents can be processed in parallel
    # Use the longest timeline as the overall estimate
    return max(doc.get('estimatedTimeInWeeks', 0) for doc in missing_documents)

def estimate_compliance_cost(missing_documents):
    """
    Estimate cost to achieve full compliance.
    
    Args:
        missing_documents: List of documents that are not owned
        
    Returns:
        Estimated cost
    """
    if not missing_documents:
        return 0
        
    # Sum up the costs of all missing documents
    return sum(doc.get('estimatedCost', 0) for doc in missing_documents) 