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
    Load regulatory data from the MCP server.
    
    Returns:
        Dictionary of regulatory data by market and industry
    """
    try:
        from ..core.mcp_client import MCPClient
        
        # Initialize MCP client
        mcp_client = MCPClient()
        
        # Get regulatory data for all supported markets and industries
        regulatory_data = {}
        
        # Get data for each major market
        markets = ['United Kingdom', 'United States', 'European Union', 'United Arab Emirates']
        industries = ['Food Products', 'Prepared Meals']
        
        for market in markets:
            regulatory_data[market] = {}
            for industry in industries:
                requirements = mcp_client.get_regulatory_requirements(market, industry)
                if requirements.get('success'):
                    regulatory_data[market][industry] = requirements['data']
        
        return regulatory_data
    except Exception as e:
        logger.error(f"Error loading regulatory data from MCP: {e}")
        # Return minimal structure
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