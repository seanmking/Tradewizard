from typing import Dict, List, Any, Optional
import time
import random
import os
import json
from .market_data_service import MarketDataService

class MarketIntelligenceService:
    """
    Service for providing market intelligence data.
    This includes market opportunities, trade statistics, and export markets.
    """
    
    def __init__(self):
        self.market_data_service = MarketDataService()
        self.market_data = {}
        self._initialize_market_data()
        # Add path to mock data
        self.mock_data_dir = os.path.join("..", "..", "mock-data", "market_intelligence")
    
    def _initialize_market_data(self):
        """Initialize market data for development purposes"""
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
                        "Import License"
                    ],
                    "Organic Food": [
                        "UAE Organic Certification",
                        "Food Labeling Compliance",
                        "Import License"
                    ],
                    "Software Development": [
                        "UAE TRA Compliance",
                        "Data Security Certification"
                    ],
                    "IT Consulting": [
                        "UAE Professional Services License",
                        "TRA Registration"
                    ],
                    "Cloud Services": [
                        "UAE Cloud Security Compliance",
                        "Data Residency Requirements"
                    ]
                },
                "market_description": "Premium market with high disposable income and strong demand for quality products."
            },
            "UK": {
                "regions": ["London", "Manchester", "Birmingham"],
                "market_size": {
                    "Dried Fruits": "$780M",
                    "Nuts": "$650M",
                    "Organic Food": "$1.2B",
                    "Software Development": "$4.5B",
                    "IT Consulting": "$3.8B",
                    "Cloud Services": "$2.7B"
                },
                "growth_rates": {
                    "Dried Fruits": "4.5%",
                    "Nuts": "3.9%",
                    "Organic Food": "7.8%",
                    "Software Development": "9.2%",
                    "IT Consulting": "6.5%",
                    "Cloud Services": "17.8%"
                },
                "regulatory_requirements": {
                    "Dried Fruits": [
                        "UK Food Standards Agency Approval",
                        "EU Food Labeling Compliance"
                    ],
                    "Nuts": [
                        "UK Food Standards Agency Approval",
                        "Allergen Labeling Requirements"
                    ],
                    "Organic Food": [
                        "UK Organic Certification",
                        "EU Organic Standards Compliance"
                    ],
                    "Software Development": [
                        "UK GDPR Compliance",
                        "ICO Registration"
                    ],
                    "IT Consulting": [
                        "UK Professional Service Standards",
                        "GDPR Compliance"
                    ],
                    "Cloud Services": [
                        "UK Data Protection Standards",
                        "ISO 27001 Certification"
                    ]
                },
                "market_description": "Mature market with strong emphasis on quality, sustainability, and ethical sourcing."
            },
            "Singapore": {
                "regions": ["Central", "East", "West"],
                "market_size": {
                    "Dried Fruits": "$180M",
                    "Nuts": "$210M",
                    "Organic Food": "$320M",
                    "Software Development": "$1.8B",
                    "IT Consulting": "$1.2B",
                    "Cloud Services": "$950M"
                },
                "growth_rates": {
                    "Dried Fruits": "7.2%",
                    "Nuts": "8.1%",
                    "Organic Food": "11.3%",
                    "Software Development": "17.5%",
                    "IT Consulting": "14.2%",
                    "Cloud Services": "23.1%"
                },
                "regulatory_requirements": {
                    "Dried Fruits": [
                        "Singapore Food Agency Approval",
                        "Food Import License"
                    ],
                    "Nuts": [
                        "Singapore Food Agency Approval",
                        "Food Import License"
                    ],
                    "Organic Food": [
                        "AVA Certification",
                        "Food Import License"
                    ],
                    "Software Development": [
                        "PDPA Compliance",
                        "IMDA Registration"
                    ],
                    "IT Consulting": [
                        "ACRA Registration",
                        "PDPA Compliance"
                    ],
                    "Cloud Services": [
                        "Singapore PDPA Compliance",
                        "MTCS Certification"
                    ]
                },
                "market_description": "Dynamic, tech-forward market with strong government support for innovation and international trade."
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
        
        # If no valid categories, use default
        if not product_categories or len(product_categories) == 0:
            product_categories = ["General"]
        
        # Convert product categories to string for matching
        product_category = ", ".join(product_categories[:3])
        
        # Get business name from user_data if available
        business_name = "Your company"  # Default generic name
        product_type = "premium products"  # Default product type
        
        if user_data:
            # Extract business name from user_data
            if 'business_name' in user_data:
                if isinstance(user_data['business_name'], dict) and 'text' in user_data['business_name']:
                    business_name = user_data['business_name']['text']
                else:
                    business_name = user_data['business_name']
                    
            # Extract product info if available
            if 'products' in user_data and 'items' in user_data['products']:
                items = user_data['products']['items']
                if items and len(items) > 0:
                    product_type = items[0] if isinstance(items[0], str) else "premium products"
        
        print(f"[MARKET] Using business name: {business_name}, product type: {product_type}")
        
        # Standard market options that can be customized
        market_options = [
            {
                "id": "uk", 
                "name": "United Kingdom", 
                "description": f"Major market with extensive data on South African exports. Strong demand for {product_category} with established trade relationships and consumer interest in premium South African products. Well-suited for {business_name}'s quality offerings with favorable import regulations.", 
                "confidence": 0.94
            },
            {
                "id": "us", 
                "name": "United States", 
                "description": f"Largest consumer market with high demand for {product_category}. E-commerce friendly with multiple entry strategies available for {product_type}. {business_name}'s premium offerings align well with US consumer preferences for quality and innovation.", 
                "confidence": 0.92
            },
            {
                "id": "eu", 
                "name": "European Union", 
                "description": f"Unified market with 450M consumers. Once certified, your {product_type} can be sold across all member states with minimal additional requirements. Strong demand for South African products with established trade agreements making export easier.", 
                "confidence": 0.88
            },
            {
                "id": "uae", 
                "name": "United Arab Emirates", 
                "description": f"Growing market with high purchasing power and appetite for premium {product_category}. Dubai serves as a regional distribution hub for MENA region. {business_name}'s products would appeal to the UAE's health-conscious consumers and expat community.", 
                "confidence": 0.85
            }
        ]
        
        print(f"Generated market options: {len(market_options)} options")
        return market_options
    
    def get_market_intelligence(self, 
                               market_name: str, 
                               product_categories: List[str]) -> Dict[str, Any]:
        """
        Get detailed market intelligence for a specific market.
        
        Args:
            market_name: Name of the market
            product_categories: List of product categories from business analysis
            
        Returns:
            Detailed market intelligence
        """
        # Simulate processing time
        time.sleep(0.5)
        
        # Try to load mock data first
        mock_data = self._load_mock_market_data(market_name)
        if mock_data:
            print(f"Using mock data for {market_name}")
            
            # Extract relevant information from mock data
            result = {
                "market_size": {"value": "Unknown", "confidence": 0.5},
                "growth_rate": {"value": "Unknown", "confidence": 0.5},
                "regulations": {"items": [], "confidence": 0.7},
                "opportunity_timeline": {"months": random.randint(3, 8), "confidence": 0.75}
            }
            
            # Extract market size and growth rate
            if "market_size" in mock_data:
                if isinstance(mock_data["market_size"], str):
                    result["market_size"] = {
                        "value": mock_data["market_size"],
                        "confidence": 0.9
                    }
                elif isinstance(mock_data["market_size"], dict) and "dried_fruit_sector" in mock_data:
                    # Handle detailed market data format
                    result["market_size"] = {
                        "value": mock_data["dried_fruit_sector"]["market_size"],
                        "confidence": 0.95
                    }
            
            if "growth_rate" in mock_data:
                if isinstance(mock_data["growth_rate"], str):
                    result["growth_rate"] = {
                        "value": mock_data["growth_rate"],
                        "confidence": 0.85
                    }
                elif isinstance(mock_data["growth_rate"], dict) and "dried_fruit_sector" in mock_data:
                    # Handle detailed market data format
                    result["growth_rate"] = {
                        "value": mock_data["dried_fruit_sector"]["growth_rate"],
                        "confidence": 0.9
                    }
            
            # Extract regulatory requirements
            regulations = []
            if "regulatory_requirements" in mock_data:
                if isinstance(mock_data["regulatory_requirements"], dict) and "import_regulations" in mock_data["regulatory_requirements"]:
                    # Detailed format
                    regs = mock_data["regulatory_requirements"]["import_regulations"].get("key_requirements", [])
                    regulations.extend(regs[:5])  # Limit to 5 items
                elif isinstance(mock_data["regulatory_requirements"], dict) and "labeling" in mock_data["regulatory_requirements"]:
                    # Simplified format
                    regulations.extend(mock_data["regulatory_requirements"]["labeling"][:3])
                    regulations.extend(mock_data["regulatory_requirements"]["certifications"][:2])
            
            if regulations:
                result["regulations"] = {
                    "items": regulations,
                    "confidence": 0.9
                }
            
            return result
        
        # Fall back to hardcoded data if mock data not available
        market_name = market_name.upper()
        if market_name not in self.market_data:
            return {
                "market_size": {"value": "Unknown", "confidence": 0.5},
                "growth_rate": {"value": "Unknown", "confidence": 0.5},
                "regulations": {"items": [], "confidence": 0.5},
                "opportunity_timeline": {"months": 6, "confidence": 0.5}
            }
        
        market_data = self.market_data[market_name]
        result = {
            "market_size": {"value": "Unknown", "confidence": 0.5},
            "growth_rate": {"value": "Unknown", "confidence": 0.5},
            "regulations": {"items": [], "confidence": 0.7},
            "opportunity_timeline": {"months": random.randint(3, 8), "confidence": 0.75}
        }
        
        # Find the most relevant product category
        for category in product_categories:
            if category in market_data["market_size"]:
                result["market_size"] = {
                    "value": market_data["market_size"][category],
                    "confidence": 0.85
                }
                result["growth_rate"] = {
                    "value": market_data["growth_rates"][category],
                    "confidence": 0.8
                }
                result["regulations"]["items"] = market_data["regulatory_requirements"].get(category, [])
                
                # Timeline is shorter for higher growth markets
                growth_value = float(market_data["growth_rates"][category].strip('%'))
                result["opportunity_timeline"]["months"] = max(3, int(10 - (growth_value / 3)))
                
                break
        
        return result
    
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