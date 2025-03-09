import os
import json
from typing import Dict, List, Any, Optional

class MarketIntelligenceService:
    """
    Service for providing structured market intelligence data.
    Uses the new structured data format instead of mock data.
    """
    
    def __init__(self):
        # Path to the structured market data
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "market_intelligence")
        self.data_file = os.path.join(self.data_dir, "market_data.json")
        self.market_data = self._load_market_data()
        
    def _load_market_data(self) -> Dict[str, Any]:
        """
        Load the structured market intelligence data
        """
        try:
            with open(self.data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            print(f"Loaded market intelligence data: {len(data['market_intelligence']['markets'])} markets")
            return data
        except Exception as e:
            print(f"Error loading market intelligence data: {e}")
            # Return structure indicating data is not available
            return {"market_intelligence": {"data_available": False, "error_message": "Market intelligence data not available at present."}}
    
    def get_available_markets(self) -> List[Dict[str, Any]]:
        """
        Returns the list of available markets with their basic information
        """
        markets = []
        
        try:
            # Check if data is available
            if "data_available" in self.market_data["market_intelligence"] and self.market_data["market_intelligence"]["data_available"] is False:
                # Return a single entry indicating data is not available
                return [{"id": "unavailable", "name": "Data Unavailable", "description": "Market intelligence data not available at present.", "confidence": 0.0}]
            
            for market_id, market_data in self.market_data["market_intelligence"]["markets"].items():
                market_name = market_data.get("market_overview", {}).get("country", market_id.upper())
                
                # Create market option structure
                market_option = {
                    "id": market_id,
                    "name": market_name,
                    "description": self._generate_market_description(market_id, market_data),
                    "confidence": market_data.get("match_score", {}).get("value", 80) / 100.0  # Convert to 0-1 scale
                }
                
                markets.append(market_option)
                
            # Sort by confidence/match score
            markets.sort(key=lambda x: x["confidence"], reverse=True)
            
        except Exception as e:
            print(f"Error getting available markets: {e}")
            # Return message indicating data is not available
            markets = [{"id": "unavailable", "name": "Data Unavailable", "description": "Market intelligence data not available at present.", "confidence": 0.0}]
            
        return markets
    
    def _generate_market_description(self, market_id: str, market_data: Dict[str, Any]) -> str:
        """
        Generates a market description based on the market data
        """
        try:
            # Get key data points
            market_size = market_data.get("market_size", {}).get("value")
            growth_rate = market_data.get("growth_rate", {}).get("value")
            barriers = market_data.get("entry_barriers", {}).get("rating")
            outlook = market_data.get("market_overview", {}).get("economic_outlook", "")
            
            # Check if we have enough data to generate a description
            if not market_size or not growth_rate or not barriers:
                return "Market description not available at present."
            
            # Generate description
            description = f"Market size: {market_size} with {growth_rate} growth. "
            description += f"Entry barriers are {barriers.lower()}. "
            
            if outlook:
                description += outlook
                
            # Add a trend if available
            trends = market_data.get("market_trends", {}).get("emerging_trends", [])
            if trends and len(trends) > 0:
                top_trend = trends[0]
                description += f" Key trend: {top_trend.get('trend_name')} - {top_trend.get('description')}"
                
            return description
            
        except Exception as e:
            print(f"Error generating market description for {market_id}: {e}")
            return "Market description not available at present."
    
    def get_market_intelligence(self, market_id: str) -> Dict[str, Any]:
        """
        Get detailed market intelligence for a specific market
        """
        try:
            # Check if data is available
            if "data_available" in self.market_data["market_intelligence"] and self.market_data["market_intelligence"]["data_available"] is False:
                return {"error": "Market intelligence data not available at present."}
            
            # Get the market data
            market_data = self.market_data["market_intelligence"]["markets"].get(market_id.lower(), {})
            
            if not market_data:
                print(f"Market data not found for: {market_id}")
                return {"error": f"Market data for {market_id} not available at present."}
                
            # Calculate opportunity timeline
            opportunity_timeline = self._calculate_opportunity_timeline(market_data)
            
            # Extract the key data points needed for the dashboard
            result = {
                "market_overview": market_data.get("market_overview", {}),
                "market_size": {
                    "value": market_data.get("market_size", {}).get("value", "Unknown"),
                    "confidence": market_data.get("market_size", {}).get("confidence", 0.7)
                },
                "growth_rate": {
                    "value": market_data.get("growth_rate", {}).get("value", "Unknown"),
                    "confidence": market_data.get("growth_rate", {}).get("confidence", 0.7)
                },
                "entry_barriers": market_data.get("entry_barriers", {}).get("rating", "Medium"),
                "regulatory_complexity": market_data.get("regulatory_complexity", {}).get("rating", "Medium"),
                "match_score": market_data.get("match_score", {}).get("value", 75),
                "regulations": {
                    "items": [reg.get("name") for reg in market_data.get("regulatory_complexity", {}).get("key_regulations", [])],
                    "confidence": market_data.get("regulatory_complexity", {}).get("confidence", 0.7)
                },
                "opportunity_timeline": {
                    "months": opportunity_timeline if opportunity_timeline is not None else "Not available",
                    "confidence": 0.75 if opportunity_timeline is not None else 0.0
                },
                "distribution_channels": market_data.get("distribution_channels", {}).get("primary_channels", []),
                "consumer_trends": self._extract_consumer_trends(market_data),
                "competitor_landscape": market_data.get("competitor_landscape", {})
            }
            
            return result
            
        except Exception as e:
            print(f"Error getting market intelligence for {market_id}: {e}")
            return {"error": "Market intelligence data not available at present."}
    
    def _calculate_opportunity_timeline(self, market_data: Dict[str, Any]) -> Optional[int]:
        """
        Calculate the opportunity timeline in months based on market data
        """
        try:
            # Check if we have enough data
            if not market_data or not market_data.get("market_entry_pathways") and not market_data.get("entry_barriers"):
                return None
            
            # Default timeline
            timeline = None
            
            # Check if we have direct entry pathways data
            pathways = market_data.get("market_entry_pathways", {})
            if pathways:
                # Get the fastest entry pathway
                entry_times = []
                
                for pathway, details in pathways.items():
                    if "timeframe" in details:
                        # Parse timeframe like "6-10 months"
                        timeframe = details["timeframe"]
                        if "month" in timeframe.lower():
                            # Extract numeric values
                            nums = [int(s) for s in timeframe.split() if s.isdigit()]
                            if nums:
                                entry_times.append(min(nums))
                
                if entry_times:
                    timeline = min(entry_times)
            
            # If we still don't have a timeline but have entry barriers, make an estimate
            if timeline is None and "entry_barriers" in market_data:
                barriers = market_data.get("entry_barriers", {}).get("rating")
                if barriers == "Low":
                    timeline = 6
                elif barriers == "Medium":
                    timeline = 9
                elif barriers == "High":
                    timeline = 12
                
            return timeline
            
        except Exception as e:
            print(f"Error calculating opportunity timeline: {e}")
            return None  # Return None instead of default
    
    def _extract_consumer_trends(self, market_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract consumer trends from market data
        """
        trends = []
        
        try:
            # Check if we have enough data
            if not market_data or (not market_data.get("market_trends") and not market_data.get("consumer_preferences")):
                return []
            
            # Get market trends
            market_trends = market_data.get("market_trends", {}).get("emerging_trends", [])
            for trend in market_trends:
                if "trend_name" in trend and "description" in trend:
                    trends.append({
                        "name": trend.get("trend_name", ""),
                        "description": trend.get("description", ""),
                        "growth_rate": trend.get("growth_rate", ""),
                        "impact": trend.get("impact_level", "Medium")
                    })
                
            # Get dietary trends
            dietary_trends = market_data.get("consumer_preferences", {}).get("dietary_trends", [])
            for trend in dietary_trends:
                if "trend_name" in trend:
                    trends.append({
                        "name": trend.get("trend_name", ""),
                        "description": trend.get("adoption_rate", ""),
                        "growth_rate": trend.get("growth_trajectory", ""),
                        "impact": "Medium"
                    })
                
        except Exception as e:
            print(f"Error extracting consumer trends: {e}")
            
        return trends
    
    def get_market_options(self, product_categories: List[str], user_data: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Get market options based on product categories and user data
        """
        # Check if data is available
        if "data_available" in self.market_data["market_intelligence"] and self.market_data["market_intelligence"]["data_available"] is False:
            return [{"id": "unavailable", "name": "Data Unavailable", "description": "Market intelligence data not available at present.", "confidence": 0.0}]
        
        # Get all available markets
        markets = self.get_available_markets()
        
        # In a real implementation, we would filter and sort markets based on:
        # 1. Product category fit
        # 2. Company size and experience
        # 3. Export readiness
        # For now, we'll just return all markets
        
        # Add business context to market descriptions if available
        if user_data and "business_name" in user_data:
            business_name = user_data["business_name"]
            if isinstance(business_name, dict) and "text" in business_name:
                business_name = business_name["text"]
                
            for market in markets:
                if market["id"] != "unavailable":  # Only add business context to real markets
                    market["description"] = f"{market['description']} {business_name}'s products align well with this market's demand."
        
        return markets
    
    def get_sector_intelligence(self, sector_id: str) -> Dict[str, Any]:
        """
        Get detailed intelligence for a specific food sector
        """
        try:
            # Check if data is available
            if "data_available" in self.market_data["market_intelligence"] and self.market_data["market_intelligence"]["data_available"] is False:
                return {"error": "Sector intelligence data not available at present."}
            
            # Get the sector data
            sector_data = self.market_data["market_intelligence"]["food_sectors"].get(sector_id.lower(), {})
            
            if not sector_data:
                print(f"Sector data not found for: {sector_id}")
                return {"error": f"Sector data for {sector_id} not available at present."}
            
            return sector_data
            
        except Exception as e:
            print(f"Error getting sector intelligence for {sector_id}: {e}")
            return {"error": "Sector intelligence data not available at present."}
    
    def get_cross_market_insights(self) -> Dict[str, Any]:
        """
        Get cross-market insights
        """
        try:
            # Check if data is available
            if "data_available" in self.market_data["market_intelligence"] and self.market_data["market_intelligence"]["data_available"] is False:
                return {"error": "Cross-market insights not available at present."}
            
            insights = self.market_data["market_intelligence"].get("cross_market_insights", {})
            
            if not insights:
                return {"error": "Cross-market insights not available at present."}
            
            return insights
            
        except Exception as e:
            print(f"Error getting cross-market insights: {e}")
            return {"error": "Cross-market insights not available at present."} 