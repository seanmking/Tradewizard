from typing import Dict, List, Any, Optional
import re
import time
from urllib.parse import urlparse
import json
import requests

class WebsiteAnalyzerService:
    """
    Service for extracting business intelligence from websites.
    In a real implementation, this would use web scraping, LLM-based analysis,
    and integration with business databases.
    """
    
    def __init__(self):
        # This would connect to external APIs or services in production
        self.mock_data = {}
        self._initialize_mock_data()
    
    def _initialize_mock_data(self):
        """Initialize mock data for development purposes"""
        self.mock_data = {
            "globalfreshsa.co.za": {
                "products": {
                    "categories": ["Dried Fruits", "Nuts", "Organic Food"],
                    "items": ["Premium Mango Slices", "Golden Apricot Selection", "Kalahari Salt & Herb Mix"],
                    "confidence": 0.92
                },
                "markets": {
                    "current": ["South Africa", "Namibia", "Botswana"],
                    "confidence": 0.85
                },
                "certifications": {
                    "items": ["HACCP", "ISO 22000", "Organic Certification"],
                    "confidence": 0.78
                },
                "business_details": {
                    "estimated_size": "Medium",
                    "years_operating": "5+",
                    "confidence": 0.82
                }
            },
            "techsolutionssa.co.za": {
                "products": {
                    "categories": ["Software Development", "IT Consulting", "Cloud Services"],
                    "items": ["Enterprise Software", "Mobile Applications", "Cloud Migration"],
                    "confidence": 0.90
                },
                "markets": {
                    "current": ["South Africa", "Kenya", "Nigeria"],
                    "confidence": 0.80
                },
                "certifications": {
                    "items": ["ISO 27001", "CMMI Level 3"],
                    "confidence": 0.75
                },
                "business_details": {
                    "estimated_size": "Small to Medium",
                    "years_operating": "3+",
                    "confidence": 0.78
                }
            }
        }
    
    def extract_domain(self, url: str) -> str:
        """Extract the domain from a URL."""
        try:
            parsed_url = urlparse(url)
            domain = parsed_url.netloc
            
            # Strip www. if present
            if domain.startswith('www.'):
                domain = domain[4:]
                
            return domain
        except Exception as e:
            print(f"Error extracting domain from URL: {str(e)}")
            return url  # Return the original URL if parsing fails
    
    def analyze_website(self, url: str) -> Dict[str, Any]:
        """
        Extract and analyze key business intelligence from a website.
        In a production environment, this would use web scraping and API calls,
        but for this MVP we'll use mock data.
        
        Args:
            url: The website URL to analyze
            
        Returns:
            Dictionary with extracted business intelligence
        """
        domain = self.extract_domain(url)
        print(f"[ANALYZER] Analyzing website: {url} (domain: {domain})")
        
        # Special handling for Global Fresh domain - only domain that uses mock data
        if 'globalfresh' in domain or domain == 'globalfreshsa.co.za':
            print(f"[ANALYZER] Using Global Fresh mock data for {domain}")
            return self.mock_data.get("globalfreshsa.co.za", {})
        
        # For ALL other domains - ALWAYS use live data and LLM extraction
        print(f"[ANALYZER] Non-Global Fresh domain detected - ENFORCING live data extraction for: {domain}")
        
        # Return empty structure to force LLM-based extraction
        # This will be populated by the analyze_website_with_llm method
        return {
            "products": {
                "categories": [],
                "items": [],
                "confidence": 0
            },
            "markets": {
                "current": [],
                "confidence": 0
            },
            "certifications": {
                "items": [],
                "confidence": 0
            },
            "business_details": {
                "estimated_size": "Unknown",
                "years_operating": "Unknown",
                "confidence": 0
            }
        }
    
    def analyze_website_with_llm(self, scraped_data: Dict[str, Any], url: str) -> Dict[str, Any]:
        """
        Analyze scraped website data using LLM.
        This is used for all non-Global Fresh websites to extract business intelligence.
        
        Args:
            scraped_data: Dictionary with scraped website data
            url: The website URL
            
        Returns:
            Dictionary with extracted business intelligence
        """
        domain = self.extract_domain(url)
        print(f"[LLM ANALYSIS] Analyzing website: {url} (domain: {domain}) with LLM")
        
        # Create a formatted prompt for the LLM
        prompt = f"""
        You are a business intelligence analyst specialized in export readiness assessment.
        
        I need you to analyze this website data for {domain} and extract detailed business information.
        
        Website URL: {url}
        
        Scraped website data:
        ```
        {json.dumps(scraped_data, indent=2)[:5000]}  # Truncate if too large
        ```
        
        Based on this data, please extract the following information:
        
        1. Product information:
           - Product categories (provide 2-5 categories that best describe their offerings)
           - Specific product items (list 3-5 key products they offer)
        
        2. Current markets:
           - Which geographic markets do they currently serve?
        
        3. Certifications:
           - What business or product certifications do they have?
        
        4. Business details:
           - Estimated business size (Small, Medium, or Large)
           - How long they've been operating (if detectable)
        
        Format your response as a JSON object with this structure:
        {{
          "products": {{
            "categories": ["category1", "category2", ...],
            "items": ["product1", "product2", ...],
            "confidence": 0.8  // Your confidence in this assessment from 0-1
          }},
          "markets": {{
            "current": ["market1", "market2", ...],
            "confidence": 0.7
          }},
          "certifications": {{
            "items": ["certification1", "certification2", ...],
            "confidence": 0.6
          }},
          "business_details": {{
            "estimated_size": "Medium",
            "years_operating": "5+ years",
            "confidence": 0.5
          }}
        }}
        
        If there's not enough information to determine a particular field, provide your best estimate and lower the confidence score accordingly.
        
        Make your best assessment based on the data. Set confidence scores between 0-1 based on certainty.
        Return ONLY valid JSON, nothing else.
        """
        
        # Call LLM
        try:
            print(f"[LLM ANALYSIS] Sending request to LLM for {domain}")
            # Make headers
            headers = {"Content-Type": "application/json"}
            
            # Make the data payload
            data = {
                "model": "mistral",  # Using Ollama's Mistral model
                "prompt": prompt,
                "stream": False
            }
            
            # Make the request
            api_url = "http://localhost:11434/api/generate"
            response = requests.post(api_url, headers=headers, json=data, timeout=60)
            
            if response.status_code != 200:
                print(f"[LLM ANALYSIS] Error from LLM API: {response.status_code}")
                return self._get_empty_analysis_structure()
                
            # Parse the response
            result = response.json()
            llm_text = result.get("response", "{}")
            
            # Try to find and extract JSON from the response
            json_match = re.search(r'```(?:json)?\s*({.*?})\s*```', llm_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # If not in code block, try to extract JSON directly
                json_str = re.search(r'^(?:.+?)?({[\s\S]*})', llm_text, re.DOTALL)
                json_str = json_str.group(1) if json_str else llm_text
            
            # Parse the JSON
            analysis = json.loads(json_str)
            print(f"[LLM ANALYSIS] Successfully extracted analysis for {domain}")
            
            # Post-process to ensure all required fields are present
            return self._ensure_complete_structure(analysis)
            
        except Exception as e:
            print(f"[LLM ANALYSIS] Error analyzing website with LLM: {str(e)}")
            # Return an empty structure in case of error
            return self._get_empty_analysis_structure()
            
    def _get_empty_analysis_structure(self) -> Dict[str, Any]:
        """Return an empty analysis structure."""
        return {
            "products": {
                "categories": [],
                "items": [],
                "confidence": 0
            },
            "markets": {
                "current": [],
                "confidence": 0
            },
            "certifications": {
                "items": [],
                "confidence": 0
            },
            "business_details": {
                "estimated_size": "Unknown",
                "years_operating": "Unknown",
                "confidence": 0
            }
        }
        
    def _ensure_complete_structure(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure the analysis has all required fields."""
        empty = self._get_empty_analysis_structure()
        
        # Make sure all required sections exist
        if 'products' not in analysis:
            analysis['products'] = empty['products']
        elif not isinstance(analysis['products'], dict):
            analysis['products'] = empty['products']
        else:
            # Ensure sub-fields exist
            for field in ['categories', 'items', 'confidence']:
                if field not in analysis['products']:
                    analysis['products'][field] = empty['products'][field]
        
        # Do the same for other sections
        if 'markets' not in analysis:
            analysis['markets'] = empty['markets']
        elif not isinstance(analysis['markets'], dict):
            analysis['markets'] = empty['markets']
        else:
            for field in ['current', 'confidence']:
                if field not in analysis['markets']:
                    analysis['markets'][field] = empty['markets'][field]
        
        if 'certifications' not in analysis:
            analysis['certifications'] = empty['certifications']
        elif not isinstance(analysis['certifications'], dict):
            analysis['certifications'] = empty['certifications']
        else:
            for field in ['items', 'confidence']:
                if field not in analysis['certifications']:
                    analysis['certifications'][field] = empty['certifications'][field]
        
        if 'business_details' not in analysis:
            analysis['business_details'] = empty['business_details']
        elif not isinstance(analysis['business_details'], dict):
            analysis['business_details'] = empty['business_details']
        else:
            for field in ['estimated_size', 'years_operating', 'confidence']:
                if field not in analysis['business_details']:
                    analysis['business_details'][field] = empty['business_details'][field]
        
        return analysis
    
    def extract_products(self, url: str) -> Dict[str, Any]:
        """Extract product information from website"""
        analysis = self.analyze_website(url)
        return analysis.get("products", {})
    
    def extract_markets(self, url: str) -> Dict[str, Any]:
        """Extract current markets information from website"""
        analysis = self.analyze_website(url)
        return analysis.get("markets", {})
    
    def extract_certifications(self, url: str) -> Dict[str, Any]:
        """Extract certification information from website"""
        analysis = self.analyze_website(url)
        return analysis.get("certifications", {})
    
    def extract_business_details(self, url: str) -> Dict[str, Any]:
        """Extract general business details from website"""
        analysis = self.analyze_website(url)
        return analysis.get("business_details", {}) 