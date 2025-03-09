from typing import Dict, List, Any, Optional
import time
import random
import os
import json
from .market_data_service import MarketDataService
from .market_intelligence_service import MarketIntelligenceService as StructuredMarketIntelligenceService

class MarketIntelligenceService:
    """
    Service for providing market intelligence data.
    This includes market opportunities, trade statistics, and export markets.
    Updated to use structured market intelligence data.
    """
    
    def __init__(self):
        self.market_data_service = MarketDataService()
        # Initialize structured market intelligence service
        self.structured_market_service = StructuredMarketIntelligenceService()
        # Legacy market data store
        self.market_data = {}
        self._initialize_market_data()
        # Add path to mock data
        self.mock_data_dir = os.path.join("..", "..", "mock-data", "market_intelligence")
    
    def _initialize_market_data(self):
        """Initialize market data for development purposes"""
        # This is maintained for backward compatibility
        self.market_data = {
            "UAE": {
                "regions": ["Dubai", "Abu Dhabi", "Sharjah"],
                "market_size": {
                    "Dried Fruits": "$450M",
                    "Nuts": "$380M",
                    "Organic Food": "$720M",
                    "Software Development": "$2.1B",
                    "IT Consulting": "$1.7B",
                    "Cloud Services": "$890M"
                },
                "growth_rates": {
                    "Dried Fruits": "8.2%",
                    "Nuts": "6.7%",
                    "Organic Food": "12.4%",
                    "Software Development": "15.3%",
                    "IT Consulting": "11.8%",
                    "Cloud Services": "22.5%"
                },
                "regulatory_requirements": {
                    "Dried Fruits": [
                        "UAE Food Control Authority Approval",
                        "Halal Certification",
                        "Food Labeling Compliance"
                    ],
                    "Nuts": [
                        "UAE Food Control Authority Approval",
                        "Halal Certification", 
                        "Food Labeling Compliance"
                    ]
                }
            }
        }
    
    def _load_mock_market_data(self, market_code: str) -> Dict[str, Any]:
        """Load market data from mock JSON files"""
        try:
            file_path = os.path.join(self.mock_data_dir, f"{market_code.lower()}_market.json")
            if os.path.exists(file_path):
                with open(file_path, "r") as f:
                    return json.load(f)
            
            # Try alternative file format
            file_path = os.path.join(self.mock_data_dir, f"{market_code.lower()}.json")
            if os.path.exists(file_path):
                with open(file_path, "r") as f:
                    return json.load(f)
            
            print(f"No mock data found for market: {market_code}")
            return {}
        except Exception as e:
            print(f"Error loading mock data for {market_code}: {str(e)}")
            return {}
    
    def get_market_opportunities(self, products: Dict[str, Any], use_mock_data: bool = None) -> Dict[str, Any]:
        """
        Get market opportunities for a set of products.
        
        Args:
            products: Product information from website analysis
            use_mock_data: Whether to use mock data (overrides default setting)
            
        Returns:
            Dictionary with market opportunities data
        """
        if not products or not products.get('categories'):
            return {
                "opportunities": []
            }
        
        # Extract product categories
        categories = products.get('categories', [])
        
        # Get market data for each category
        market_data = {}
        for category in categories:
            market_data[category] = self.market_data_service.get_market_data_for_category(
                category, use_mock=use_mock_data
            )
        
        # Compile opportunities
        opportunities = []
        for category, data in market_data.items():
            # Add top markets as opportunities
            for market in data.get('top_markets', []):
                opportunities.append({
                    "product_category": category,
                    "market": market['country'],
                    "opportunity_score": market['score'],
                    "description": market['reason']
                })
        
        # Sort opportunities by score (descending)
        opportunities.sort(key=lambda x: x['opportunity_score'], reverse=True)
        
        return {
            "opportunities": opportunities
        }
    
    def get_market_trends(self, products: Dict[str, Any], use_mock_data: bool = None) -> Dict[str, Any]:
        """
        Get market trends for a set of products.
        
        Args:
            products: Product information from website analysis
            use_mock_data: Whether to use mock data (overrides default setting)
            
        Returns:
            Dictionary with market trends data
        """
        if not products or not products.get('categories'):
            return {
                "trends": []
            }
        
        # Extract product categories
        categories = products.get('categories', [])
        
        # Get market data for each category
        market_data = {}
        for category in categories:
            market_data[category] = self.market_data_service.get_market_data_for_category(
                category, use_mock=use_mock_data
            )
        
        # Compile trends
        all_trends = []
        for category, data in market_data.items():
            for trend in data.get('trends', []):
                all_trends.append({
                    "product_category": category,
                    "trend": trend
                })
        
        return {
            "trends": all_trends
        }
    
    def get_trade_barriers(self, products: Dict[str, Any], use_mock_data: bool = None) -> Dict[str, Any]:
        """
        Get trade barriers for a set of products.
        
        Args:
            products: Product information from website analysis
            use_mock_data: Whether to use mock data (overrides default setting)
            
        Returns:
            Dictionary with trade barriers data
        """
        if not products or not products.get('categories'):
            return {
                "barriers": []
            }
        
        # Extract product categories
        categories = products.get('categories', [])
        
        # Get market data for each category
        market_data = {}
        for category in categories:
            market_data[category] = self.market_data_service.get_market_data_for_category(
                category, use_mock=use_mock_data
            )
        
        # Compile barriers
        all_barriers = []
        for category, data in market_data.items():
            for barrier in data.get('barriers', []):
                all_barriers.append({
                    "product_category": category,
                    "market": barrier['country'],
                    "barrier": barrier['barrier'],
                    "impact": barrier['impact']
                })
        
        return {
            "barriers": all_barriers
        }
    
    def get_market_data_summary(self, products: Dict[str, Any], use_mock_data: bool = None) -> Dict[str, Any]:
        """
        Get a comprehensive summary of market data.
        
        Args:
            products: Product information from website analysis
            use_mock_data: Whether to use mock data (overrides default setting)
            
        Returns:
            Dictionary with comprehensive market data
        """
        opportunities = self.get_market_opportunities(products, use_mock_data)
        trends = self.get_market_trends(products, use_mock_data)
        barriers = self.get_trade_barriers(products, use_mock_data)
        
        return {
            "opportunities": opportunities['opportunities'],
            "trends": trends['trends'],
            "barriers": barriers['barriers']
        }
    
    def get_market_options(self, product_categories: List[str], use_mock_data: bool = True, user_data: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Get market options based on product categories.
        
        Args:
            product_categories: List of product categories
            use_mock_data: Whether to use mock data (defaults to True for safety)
            user_data: User data containing company information
            
        Returns:
            List of market options
        """
        # Log the parameters
        print(f"[MARKET] Getting market options for categories: {product_categories} (using mock data: {use_mock_data})")
        
        # Try to use the analysis-based market intelligence first
        try:
            from export_intelligence.analysis.market_intelligence import get_market_options as analysis_get_market_options
            market_options = analysis_get_market_options(product_categories, user_data)
            print(f"Generated market options from analysis package: {len(market_options)} options")
            
            # Check if the result indicates data is not available
            if len(market_options) == 1 and market_options[0].get("id") == "unavailable":
                return market_options
            
            return market_options
        except Exception as e:
            print(f"Error using analysis-based market intelligence: {e}")
        
        # If we get here, we'll try to use the structured market intelligence service
        try:
            # Get market options from structured data
            market_options = self.structured_market_service.get_market_options(product_categories, user_data)
            print(f"Generated market options from structured data: {len(market_options)} options")
            
            # Check if the result indicates data is not available
            if len(market_options) == 1 and market_options[0].get("id") == "unavailable":
                return market_options
            
            return market_options
        except Exception as e:
            print(f"Error using structured market data: {e}")
        
        # If we get here, something went wrong with both approaches
        # Return a message indicating data is not available
        return [{"id": "unavailable", "name": "Data Unavailable", "description": "Market intelligence data not available at present.", "confidence": 0.0}]
    
    def get_market_intelligence(self, 
                               market_name: str, 
                               product_categories: List[str]) -> Dict[str, Any]:
        """
        Get detailed market intelligence for a specific market.
        
        Args:
            market_name: Name of the market
            product_categories: List of product categories
            
        Returns:
            Market intelligence data
        """
        print(f"[MARKET] Getting market intelligence for market: {market_name}, categories: {product_categories}")
        
        # Try to use the analysis-based market intelligence first
        try:
            from export_intelligence.analysis.market_intelligence import get_market_intelligence as analysis_get_market_intelligence
            market_data = analysis_get_market_intelligence(market_name, product_categories)
            if market_data:
                print(f"Retrieved market intelligence from analysis package for: {market_name}")
                
                # Check if the result indicates data is not available
                if "error" in market_data:
                    return market_data
                    
                return market_data
        except Exception as e:
            print(f"Error using analysis-based market intelligence: {e}")
        
        # Normalize market name
        normalized_market = self._normalize_market_name(market_name)
        
        # Use the structured market intelligence service to get market intelligence
        try:
            # Get market intelligence from structured data
            market_data = self.structured_market_service.get_market_intelligence(normalized_market)
            if market_data:
                print(f"Retrieved market intelligence from structured data for: {market_name}")
                
                # Check if the result indicates data is not available
                if "error" in market_data:
                    return market_data
                    
                return market_data
        except Exception as e:
            print(f"Error using structured market data: {e}")
        
        # If we get here, something went wrong with both approaches
        # Return a message indicating data is not available
        return {"error": f"Market intelligence data for {market_name} not available at present."}
    
    def get_regulatory_requirements(self, 
                                  market_name: str, 
                                  product_category: str) -> List[str]:
        """
        Get regulatory requirements for a specific market and product category.
        
        Args:
            market_name: Name of the market
            product_category: Product category
            
        Returns:
            List of regulatory requirements
        """
        market_name = market_name.upper()
        if market_name not in self.market_data:
            return []
        
        market_data = self.market_data[market_name]
        return market_data["regulatory_requirements"].get(product_category, [])
    
    def _normalize_market_name(self, market_name: str) -> str:
        """
        Normalize market name for consistent lookup
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
        
    def _generate_simple_market_data(self, market_name: str, product_categories: List[str]) -> Dict[str, Any]:
        """
        Generate simple market data as a last resort
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