"""
MCP Client module for communicating with the Mission Control Panel server.
This module provides a Python wrapper around the AI Agent's MCPClient.
"""

import logging
import json
from typing import Dict, Any, Optional, List
from pathlib import Path
import subprocess

logger = logging.getLogger(__name__)

class MCPClient:
    """Client for interacting with the MCP server through the AI Agent's MCPClient."""
    
    def __init__(self, base_url: str = "http://localhost:3001"):
        """Initialize MCP client.
        
        Args:
            base_url: Base URL of the MCP server
        """
        self.base_url = base_url
        
    def _call_mcp_tool(self, tool: str, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Call an MCP tool through the AI Agent's MCPClient.
        
        Args:
            tool: The name of the MCP tool to call
            action: The action to perform with the tool
            params: The parameters for the action
            
        Returns:
            The response from the MCP tool
        """
        try:
            # In a production environment, this would use a proper IPC mechanism
            # For now, we'll use the proxy endpoint in the Flask backend
            import requests
            response = requests.post(
                f"{self.base_url}/api/proxy/mcp/tools",
                json={
                    "tool": tool,
                    "action": action,
                    "params": params
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error calling MCP tool {tool}.{action}: {e}")
            raise
            
    def get_market_intelligence(self) -> Dict[str, Any]:
        """Get market intelligence data from MCP server."""
        return self._call_mcp_tool('marketIntelligence', 'getMarketData', {})
            
    def get_regulatory_requirements(self, country: str, product_category: str, 
                                  hs_code: Optional[str] = None) -> Dict[str, Any]:
        """Get regulatory requirements from MCP server."""
        params = {
            "country": country,
            "productCategory": product_category
        }
        if hs_code:
            params["hsCode"] = hs_code
            
        return self._call_mcp_tool('regulatory', 'getRequirements', params)
            
    def get_market_options(self, product_categories: List[str]) -> Dict[str, Any]:
        """Get market options from MCP server."""
        return self._call_mcp_tool('marketIntelligence', 'getMarketOptions', {
            "product_categories": product_categories
        })
            
    def analyze_market_fit(self, product_categories: List[str], target_market: str) -> Dict[str, Any]:
        """Analyze market fit using MCP server."""
        return self._call_mcp_tool('marketIntelligence', 'analyzeMarketFit', {
            "productCategories": product_categories,
            "targetMarket": target_market
        })
            
    def generate_export_readiness_report(self, business_id: str) -> Dict[str, Any]:
        """Generate an export readiness report."""
        return self._call_mcp_tool('assessment', 'generateExportReadinessReport', {
            "businessId": business_id
        })
            
    def analyze_website(self, url: str) -> Dict[str, Any]:
        """Analyze a website using the MCP."""
        return self._call_mcp_tool('businessAnalysis', 'analyzeWebsite', {
            "url": url
        })
            
    def map_to_hs_codes(self, products: List[str]) -> Dict[str, Any]:
        """Map products to HS codes."""
        return self._call_mcp_tool('businessAnalysis', 'mapToHsCodes', {
            "products": products
        })
            
    def get_compliance_requirements(self, business_id: str, target_market: str) -> Dict[str, Any]:
        """Get compliance requirements."""
        return self._call_mcp_tool('compliance', 'getRequirements', {
            "businessId": business_id,
            "targetMarket": target_market
        }) 