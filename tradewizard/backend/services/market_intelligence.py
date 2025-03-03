from typing import Dict, List, Any, Optional
import time
import random
import os
import json

class MarketIntelligenceService:
    """
    Service for providing market intelligence, including personalized market
    recommendations based on business data.
    """
    
    def __init__(self):
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
    
    def get_market_options(self, product_categories: List[str]) -> List[Dict[str, Any]]:
        """
        Generate personalized market options based on product categories.
        
        Args:
            product_categories: List of product categories from business analysis
            
        Returns:
            List of market options with personalized descriptions
        """
        # Simulate processing time
        time.sleep(1)
        
        market_options = []
        
        for market_name, market_data in self.market_data.items():
            # Find the most relevant product category for this market
            best_category = None
            best_growth = 0
            
            for category in product_categories:
                if category in market_data["growth_rates"]:
                    growth_rate = float(market_data["growth_rates"][category].strip('%'))
                    if growth_rate > best_growth:
                        best_growth = growth_rate
                        best_category = category
            
            if best_category:
                # Create personalized description
                size = market_data["market_size"].get(best_category, "Unknown")
                growth = market_data["growth_rates"].get(best_category, "Unknown")
                
                description = f"Premium {best_category} market sized at {size} and growing at {growth} annually. {market_data['market_description']}"
                
                market_options.append({
                    "id": market_name.lower(),
                    "name": market_name,
                    "description": description,
                    "confidence": min(0.5 + (best_growth / 20), 0.95)  # Higher growth = higher confidence
                })
        
        # Sort by confidence
        market_options.sort(key=lambda x: x["confidence"], reverse=True)
        
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