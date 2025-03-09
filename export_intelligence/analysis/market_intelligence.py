"""
Market intelligence analysis module.

This module provides functionality for analyzing market intelligence data
for different markets and product categories.
"""

import logging
import json
import os

# Configure logging
logger = logging.getLogger(__name__)

def load_market_intelligence_data():
    """
    Load market intelligence data from data files.
    
    Returns:
        Dictionary containing structured market intelligence data
    """
    try:
        # In a real implementation, this would load from a database
        # For now, use a static file
        data_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
                                "mock-data", "market_intelligence", "market_data.json")
        
        logger.info(f"Loading market intelligence data from {data_path}")
        
        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        return data['market_intelligence']
    except Exception as e:
        logger.error(f"Error loading market intelligence data: {e}")
        # Fallback to minimal structure
        return {
            "markets": {},
            "food_sectors": {},
            "cross_market_insights": {}
        }

def get_market_options(product_categories, user_data=None):
    """
    Get market options based on product categories and user data.
    
    Args:
        product_categories: List of product category strings
        user_data: Dictionary containing user data (optional)
        
    Returns:
        List of market options with match scores and detailed market data
    """
    try:
        market_data = load_market_intelligence_data()
        markets = market_data.get('markets', {})
        
        # Build a list of market options
        market_options = []
        for market_id, market_info in markets.items():
            # Get the market name
            market_name = market_info.get('market_overview', {}).get('country', market_id.upper())
            
            # Calculate match score based on product categories
            match_score = market_info.get('match_score', {}).get('value', 75)
            confidence = market_info.get('match_score', {}).get('confidence', 0.8)
            
            # Generate a description
            description = _generate_market_description(market_id, market_info, product_categories)
            
            # Add business context if available
            if user_data and isinstance(user_data, dict) and 'business_name' in user_data:
                business_name = user_data['business_name']
                if isinstance(business_name, dict) and 'text' in business_name:
                    business_name = business_name['text']
                elif not isinstance(business_name, str):
                    business_name = "Your company"
                    
                description += f" {business_name}'s products align well with this market's demand."
            
            # Get market size and growth rate
            market_size = market_info.get('market_size', {}).get('value', 'Unknown')
            growth_rate = market_info.get('growth_rate', {}).get('value', 'Unknown')
            
            # Extract the numeric part of growth rate if it's a string like "3.2% per year"
            if isinstance(growth_rate, str) and "%" in growth_rate:
                try:
                    growth_rate = float(growth_rate.split("%")[0].strip())
                except ValueError:
                    growth_rate = 3.0  # Default value if parsing fails
            
            # Get entry barriers and regulatory complexity
            entry_barriers = market_info.get('entry_barriers', {}).get('rating', 'Medium')
            regulatory_complexity = market_info.get('regulatory_complexity', {}).get('rating', 'Medium')
            
            # Get strengths based on product categories
            strengths = []
            if 'Food' in ' '.join(product_categories) or 'food' in ' '.join(product_categories):
                if market_id == 'uk':
                    strengths = [
                        'Strong demand for premium food products',
                        'Established trade relations with South Africa',
                        'English-speaking market with familiar business practices'
                    ]
                elif market_id == 'us':
                    strengths = [
                        'Largest consumer market globally',
                        'Growing interest in international cuisines',
                        'Premium pricing for quality imported foods'
                    ]
                elif market_id == 'uae':
                    strengths = [
                        'High disposable income among consumers',
                        'Strong expatriate community familiar with international foods',
                        'Gateway to broader Middle East market'
                    ]
            else:
                strengths = [
                    'Strong consumer demand',
                    'Favorable trade agreements',
                    'Growing market'
                ]
            
            # Create a complete market option with all relevant data
            market_options.append({
                'id': market_id,
                'name': market_name,
                'description': description,
                'confidence': confidence,
                'market_size': market_size,
                'growth_rate': growth_rate,
                'entry_barriers': entry_barriers,
                'regulatory_complexity': regulatory_complexity,
                'strengths': strengths
            })
        
        # Sort by match score (confidence)
        market_options.sort(key=lambda x: x['confidence'], reverse=True)
        return market_options
    except Exception as e:
        logger.error(f"Error getting market options: {e}")
        # Return minimal fallback options
        return [
            {
                "id": "uk", 
                "name": "United Kingdom", 
                "description": "Major market with extensive data on South African exports.", 
                "confidence": 0.94
            },
            {
                "id": "usa", 
                "name": "United States", 
                "description": "Largest consumer market with high demand.", 
                "confidence": 0.92
            },
            {
                "id": "uae", 
                "name": "United Arab Emirates", 
                "description": "Growing market with high purchasing power.", 
                "confidence": 0.85
            }
        ]

def _generate_market_description(market_id, market_data, product_categories=None):
    """
    Generate a market description based on market data.
    
    Args:
        market_id: Market ID string
        market_data: Market data dictionary
        product_categories: List of product categories (optional)
    
    Returns:
        String description
    """
    try:
        # Get key data points
        market_size = market_data.get('market_size', {}).get('value', 'Substantial')
        growth_rate = market_data.get('growth_rate', {}).get('value', 'Steady')
        barriers = market_data.get('entry_barriers', {}).get('rating', 'Medium')
        outlook = market_data.get('market_overview', {}).get('economic_outlook', '')
        
        # Generate description
        description = f"Market size: {market_size} with {growth_rate} growth. "
        description += f"Entry barriers are {barriers.lower()}. "
        
        if outlook:
            description += outlook
            
        # Add a trend if available
        trends = market_data.get('market_trends', {}).get('emerging_trends', [])
        if trends and len(trends) > 0:
            top_trend = trends[0]
            description += f" Key trend: {top_trend.get('trend_name')} - {top_trend.get('description')}"
            
        return description
    except Exception as e:
        logger.error(f"Error generating market description for {market_id}: {e}")
        return f"Key export market with opportunities for South African products."

def get_market_intelligence(market_name, product_categories=None):
    """
    Get detailed market intelligence for a specific market.
    
    Args:
        market_name: Market name string
        product_categories: List of product category strings (optional)
    
    Returns:
        Dictionary containing detailed market intelligence
    """
    try:
        # Load market data
        market_data = load_market_intelligence_data()
        
        # Normalize market name
        normalized_market = _normalize_market_name(market_name)
        
        # Get market specific data
        markets = market_data.get('markets', {})
        market_info = markets.get(normalized_market, {})
        
        if not market_info:
            logger.warning(f"Market data not found for: {market_name}")
            return _generate_simple_market_data(market_name, product_categories)
            
        # Extract the key data points needed for the dashboard
        result = {
            "market_overview": market_info.get("market_overview", {}),
            "market_size": {
                "value": market_info.get("market_size", {}).get("value", "Unknown"),
                "confidence": market_info.get("market_size", {}).get("confidence", 0.7)
            },
            "growth_rate": {
                "value": market_info.get("growth_rate", {}).get("value", "Unknown"),
                "confidence": market_info.get("growth_rate", {}).get("confidence", 0.7)
            },
            "entry_barriers": market_info.get("entry_barriers", {}).get("rating", "Medium"),
            "regulatory_complexity": market_info.get("regulatory_complexity", {}).get("rating", "Medium"),
            "match_score": market_info.get("match_score", {}).get("value", 75),
            "regulations": {
                "items": [reg.get("name") for reg in market_info.get("regulatory_complexity", {}).get("key_regulations", [])],
                "confidence": market_info.get("regulatory_complexity", {}).get("confidence", 0.7)
            },
            "opportunity_timeline": {
                "months": _calculate_opportunity_timeline(market_info),
                "confidence": 0.75
            },
            "distribution_channels": market_info.get("distribution_channels", {}).get("primary_channels", []),
            "consumer_trends": _extract_consumer_trends(market_info),
            "competitor_landscape": market_info.get("competitor_landscape", {})
        }
        
        return result
    except Exception as e:
        logger.error(f"Error getting market intelligence for {market_name}: {e}")
        return _generate_simple_market_data(market_name, product_categories)

def _normalize_market_name(market_name):
    """
    Normalize market name for consistent lookup.
    
    Args:
        market_name: Market name string
    
    Returns:
        Normalized market name string
    """
    # Convert to lowercase and remove spaces
    normalized = market_name.lower().replace(' ', '')
    
    # Handle common market name variations
    market_mapping = {
        'unitedkingdom': 'uk',
        'uk': 'uk',
        'unitedstates': 'usa',
        'usa': 'usa',
        'us': 'usa',
        'unitedarabemirates': 'uae',
        'uae': 'uae',
        'emirates': 'uae'
    }
    
    return market_mapping.get(normalized, normalized)

def _calculate_opportunity_timeline(market_data):
    """
    Calculate the opportunity timeline in months based on market data.
    
    Args:
        market_data: Market data dictionary
    
    Returns:
        Integer number of months
    """
    try:
        # Default timeline
        timeline = 9
        
        # Check if we have direct entry pathways data
        pathways = market_data.get('market_entry_pathways', {})
        if pathways:
            # Get the fastest entry pathway
            entry_times = []
            
            for pathway, details in pathways.items():
                if 'timeframe' in details:
                    # Parse timeframe like "6-10 months"
                    timeframe = details['timeframe']
                    if 'month' in timeframe.lower():
                        # Extract numeric values
                        nums = [int(s) for s in timeframe.split() if s.isdigit()]
                        if nums:
                            entry_times.append(min(nums))
            
            if entry_times:
                timeline = min(entry_times)
        
        # Adjust based on entry barriers
        barriers = market_data.get('entry_barriers', {}).get('rating', 'Medium')
        if barriers == 'Low':
            timeline = max(6, timeline - 2)
        elif barriers == 'High':
            timeline = timeline + 3
            
        return timeline
    except Exception as e:
        logger.error(f"Error calculating opportunity timeline: {e}")
        return 9  # Default 9 months

def _extract_consumer_trends(market_data):
    """
    Extract consumer trends from market data.
    
    Args:
        market_data: Market data dictionary
    
    Returns:
        List of consumer trend dictionaries
    """
    trends = []
    
    try:
        # Get market trends
        market_trends = market_data.get('market_trends', {}).get('emerging_trends', [])
        for trend in market_trends:
            trends.append({
                'name': trend.get('trend_name', ''),
                'description': trend.get('description', ''),
                'growth_rate': trend.get('growth_rate', ''),
                'impact': trend.get('impact_level', 'Medium')
            })
            
        # Get dietary trends
        dietary_trends = market_data.get('consumer_preferences', {}).get('dietary_trends', [])
        for trend in dietary_trends:
            trends.append({
                'name': trend.get('trend_name', ''),
                'description': trend.get('adoption_rate', ''),
                'growth_rate': trend.get('growth_trajectory', ''),
                'impact': 'Medium'
            })
    except Exception as e:
        logger.error(f"Error extracting consumer trends: {e}")
        
    return trends

def _generate_simple_market_data(market_name, product_categories):
    """
    Generate simple market data as a fallback.
    
    Args:
        market_name: Market name string
        product_categories: List of product category strings
    
    Returns:
        Dictionary with basic market data
    """
    # Default market data structure
    result = {
        "market_overview": {
            "country": market_name,
            "population": "Unknown",
            "gdp": "Unknown",
            "gdp_growth": "Unknown"
        },
        "market_size": {
            "value": "Unknown market size",
            "confidence": 0.5
        },
        "growth_rate": {
            "value": "Unknown growth rate",
            "confidence": 0.5
        },
        "entry_barriers": "Medium",
        "regulatory_complexity": "Medium",
        "match_score": 50,
        "regulations": {
            "items": ["Regulatory information not available"],
            "confidence": 0.5
        },
        "opportunity_timeline": {
            "months": 6,
            "confidence": 0.5
        }
    }
    
    # Customize based on known markets
    if "uk" in market_name.lower() or "kingdom" in market_name.lower():
        result["market_overview"]["country"] = "United Kingdom"
        result["market_size"]["value"] = "$24.5 billion"
        result["growth_rate"]["value"] = "3.2% per year"
        result["match_score"] = 85
    elif "us" in market_name.lower() or "states" in market_name.lower():
        result["market_overview"]["country"] = "United States"
        result["market_size"]["value"] = "$156.2 billion"
        result["growth_rate"]["value"] = "3.9% per year"
        result["match_score"] = 82
    elif "uae" in market_name.lower() or "emirates" in market_name.lower():
        result["market_overview"]["country"] = "United Arab Emirates"
        result["market_size"]["value"] = "$12.3 billion"
        result["growth_rate"]["value"] = "4.5% per year" 
        result["match_score"] = 65
        
    return result

def get_sector_intelligence(sector_id, market=None):
    """
    Get detailed intelligence for a specific food sector.
    
    Args:
        sector_id: Sector ID string
        market: Optional market to filter sector data
    
    Returns:
        Dictionary containing sector intelligence
    """
    try:
        # Load market data
        market_data = load_market_intelligence_data()
        
        # Get sector data
        sectors = market_data.get('food_sectors', {})
        sector_data = sectors.get(sector_id.lower(), {})
        
        if not sector_data:
            logger.warning(f"Sector data not found for: {sector_id}")
            return {}
        
        # If market is specified, filter relevant data
        if market:
            # In a complete implementation, we would filter sector data by market
            pass
            
        return sector_data
    except Exception as e:
        logger.error(f"Error getting sector intelligence for {sector_id}: {e}")
        return {}

def get_cross_market_insights():
    """
    Get cross-market insights and comparative analysis.
    
    Returns:
        Dictionary containing cross-market insights
    """
    try:
        market_data = load_market_intelligence_data()
        return market_data.get('cross_market_insights', {})
    except Exception as e:
        logger.error(f"Error getting cross-market insights: {e}")
        return {} 