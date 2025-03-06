import requests
import json
import os
from typing import Dict, List, Any, Optional
import re
from .llm_service import LLMService

class MarketDataService:
    """
    Service for fetching market data for specific products and industries.
    
    This service provides market data for export opportunities, trade statistics,
    and market intelligence for specific products/industries that are mentioned
    in the assessment.
    """
    
    def __init__(self):
        self.llm = LLMService()
        self.use_mock_data = os.environ.get("USE_MOCK_MARKET_DATA", "true").lower() == "true"
        
        # Mock data for development/demo purposes
        self._initialize_mock_data()
    
    def _initialize_mock_data(self):
        """Initialize mock market data"""
        self.mock_data = {
            "Dried Fruits": {
                "top_markets": [
                    {"country": "United Kingdom", "score": 0.89, "reason": "High demand for premium dried fruits, established trade relationships"},
                    {"country": "Netherlands", "score": 0.87, "reason": "Major import hub for the EU, strong interest in organic products"},
                    {"country": "Germany", "score": 0.85, "reason": "Large consumer market with focus on healthy snacks"}
                ],
                "growth_rate": "7.8%",
                "market_size": "$12.5B",
                "trends": [
                    "Increased demand for organic and all-natural products",
                    "Rising popularity as healthy snacking options",
                    "Growing use in breakfast cereals and baked goods"
                ],
                "barriers": [
                    {"country": "EU", "barrier": "Strict pesticide residue regulations", "impact": "high"},
                    {"country": "USA", "barrier": "FDA food safety compliance", "impact": "medium"}
                ]
            },
            "Nuts": {
                "top_markets": [
                    {"country": "Germany", "score": 0.92, "reason": "Large market with strong demand for premium quality nuts"},
                    {"country": "China", "score": 0.88, "reason": "Growing middle class with increasing disposable income"},
                    {"country": "United Arab Emirates", "score": 0.84, "reason": "High-value market with demand for luxury food items"}
                ],
                "growth_rate": "6.2%",
                "market_size": "$8.7B",
                "trends": [
                    "Increased consumer awareness of health benefits",
                    "Growing use in plant-based diets",
                    "Rising demand for flavored and specialty varieties"
                ],
                "barriers": [
                    {"country": "EU", "barrier": "Aflatoxin testing requirements", "impact": "high"},
                    {"country": "China", "barrier": "Changing import regulations", "impact": "medium"}
                ]
            },
            "Software Development": {
                "top_markets": [
                    {"country": "United States", "score": 0.94, "reason": "Largest technology market globally"},
                    {"country": "United Kingdom", "score": 0.89, "reason": "Strong fintech and enterprise software demand"},
                    {"country": "Australia", "score": 0.85, "reason": "Cultural compatibility and English language market"}
                ],
                "growth_rate": "11.5%",
                "market_size": "$527B",
                "trends": [
                    "Increasing demand for cloud-native solutions",
                    "Growing focus on cybersecurity features",
                    "Rise of AI/ML integration in software products"
                ],
                "barriers": [
                    {"country": "EU", "barrier": "GDPR compliance requirements", "impact": "high"},
                    {"country": "China", "barrier": "Market access restrictions", "impact": "high"}
                ]
            }
        }
    
    def get_market_data_for_category(self, category: str, use_mock: bool = None) -> Dict[str, Any]:
        """
        Get market data for a specific product category.
        
        Args:
            category: The product category to get market data for
            use_mock: Override the service's default mock data setting
            
        Returns:
            Dictionary with market data for the category
        """
        if use_mock is None:
            use_mock = self.use_mock_data
        
        if use_mock:
            # Use mock data
            if category in self.mock_data:
                return self.mock_data[category]
            
            # Try to find a similar category
            for mock_category in self.mock_data:
                if self._category_similarity(category, mock_category) > 0.7:
                    print(f"Using similar category mock data: {mock_category} for {category}")
                    return self.mock_data[mock_category]
            
            # Default to first mock category if no match found
            print(f"No matching mock data for category: {category}, using default")
            return next(iter(self.mock_data.values()))
        else:
            # Use LLM to generate market data
            return self._generate_market_data_with_llm(category)
    
    def _category_similarity(self, category1: str, category2: str) -> float:
        """Simple similarity check between categories"""
        # Convert to lowercase for comparison
        cat1 = category1.lower()
        cat2 = category2.lower()
        
        # Direct match
        if cat1 == cat2:
            return 1.0
            
        # Check if one contains the other
        if cat1 in cat2 or cat2 in cat1:
            return 0.8
            
        # Check for word overlap
        words1 = set(re.findall(r'\b\w+\b', cat1))
        words2 = set(re.findall(r'\b\w+\b', cat2))
        
        if not words1 or not words2:
            return 0.0
            
        overlap = words1.intersection(words2)
        similarity = len(overlap) / max(len(words1), len(words2))
        
        return similarity
    
    def _generate_market_data_with_llm(self, category: str) -> Dict[str, Any]:
        """
        Generate market data using LLM with web search capabilities.
        This simulates searching for and synthesizing market data.
        
        Args:
            category: The product category to generate market data for
            
        Returns:
            Dictionary with generated market data
        """
        prompt = f"""
        As a market intelligence expert, provide detailed export market data for {category}.
        
        Return a JSON object with this exact structure:
        {{
          "top_markets": [
            {{"country": "Country Name", "score": 0.95, "reason": "Brief reason why this market is attractive"}},
            {{"country": "Country Name", "score": 0.90, "reason": "Brief reason why this market is attractive"}},
            {{"country": "Country Name", "score": 0.85, "reason": "Brief reason why this market is attractive"}}
          ],
          "growth_rate": "X.X%",
          "market_size": "$XXB",
          "trends": [
            "Major trend 1",
            "Major trend 2",
            "Major trend 3"
          ],
          "barriers": [
            {{"country": "Country/Region", "barrier": "Specific trade barrier", "impact": "high/medium/low"}},
            {{"country": "Country/Region", "barrier": "Specific trade barrier", "impact": "high/medium/low"}}
          ]
        }}
        
        Make realistic estimates based on current global market conditions.
        Return ONLY valid JSON, nothing else.
        """
        
        try:
            # Generate market data
            llm_response = self.llm.generate(prompt)
            
            # Parse the JSON response
            import json
            import re
            
            # Find JSON in the response
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```|({[\s\S]*})', llm_response)
            if json_match:
                json_str = json_match.group(1) or json_match.group(2)
                return json.loads(json_str)
            else:
                return json.loads(llm_response)
        except Exception as e:
            print(f"Error generating market data with LLM: {str(e)}")
            # Return default structure on error
            return {
                "top_markets": [
                    {"country": "Global", "score": 0.7, "reason": "Limited data available"}
                ],
                "growth_rate": "Unknown",
                "market_size": "Unknown",
                "trends": [
                    "Data currently unavailable"
                ],
                "barriers": [
                    {"country": "General", "barrier": "Research needed", "impact": "unknown"}
                ]
            }
    
    def get_market_data_for_products(self, products: List[str], use_mock: bool = None) -> Dict[str, Dict[str, Any]]:
        """
        Get market data for multiple product categories.
        
        Args:
            products: List of product categories to get market data for
            use_mock: Override the service's default mock data setting
            
        Returns:
            Dictionary mapping categories to their market data
        """
        result = {}
        
        for product in products:
            result[product] = self.get_market_data_for_category(product, use_mock)
            
        return result 