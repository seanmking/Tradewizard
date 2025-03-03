from typing import Dict, List, Any, Optional
import time
import re
import json
import requests
import os
from urllib.parse import urlparse
from .website_analyzer import WebsiteAnalyzerService
from .market_intelligence import MarketIntelligenceService

class AssessmentFlowService:
    """
    Service for handling the assessment flow logic.
    This is the single source of truth for the conversation flow with Sarah.
    """
    
    def __init__(self):
        self.website_analyzer = WebsiteAnalyzerService()
        self.market_intelligence = MarketIntelligenceService()
        self.api_url = "http://localhost:11434/api/generate"
        self.model = "mistral"
        self.MAX_RETRIES = 3
        self.MAX_HISTORY_LENGTH = 8
        self.SIMILARITY_THRESHOLD = 0.7
        self.debug = False
        
        # Chat session storage
        self.chat_sessions: Dict[str, Dict] = {}
        
        # Create chat data directory for persistence
        os.makedirs("chat_data", exist_ok=True)
        
        # Define the assessment flow - consolidated from both files
        self.assessment_flow = {
            # Sarah Introduction Flow - The 4-question sequence
            'initial': {
                'id': 'initial',
                'prompt': "Hi there! I'm Sarah, your export readiness consultant at TradeWizard. To start your export journey, could you tell me your name, your role, and your business name?",
                'next_step': "website",
                'extraction_patterns': {
                    'first_name': r"(?:my name is|I'm|I am) ([A-Za-z]+)",
                    'last_name': r"(?:my last name is|surname is) ([A-Za-z]+)",
                    'role': r"(?:I am|I'm) (?:the|a|an)? ([A-Za-z\s]+) (?:at|of|for)",
                    'business_name': r"(?:business|company|organisation|organization) (?:is|called) ([A-Za-z0-9\s]+)"
                },
                'extraction_rules': {
                    'first_name': 'The person\'s first name',
                    'last_name': 'The person\'s last name if mentioned',
                    'role': 'Their role in the business',
                    'business_name': 'The complete business name'
                },
                'llm_role': {
                    'personality': 'Friendly, analytical export advisor named Sarah',
                    'goal': 'Extract and validate user information from their response',
                    'tone': 'Warm and professional',
                    'instructions': [
                        '1. Extract these required fields from the response:',
                        '   - First name',
                        '   - Last name',
                        '   - Role in the business',
                        '   - Complete business name',
                        '2. Return empty response if all fields are provided',
                        '3. Ask for missing information if any field is missing'
                    ]
                }
            },
            'website': {
                'id': 'website',
                'prompt': "Great to meet you, {first_name}! Could you share your website so I can learn more about {business_name} while we chat?",
                'next_step': "export_experience",
                'extraction_patterns': {
                    'website_url': r"https?://[^\s]+"
                },
                'extraction_rules': {
                    'website_url': 'Any text that could be a website domain (e.g., example.com, www.example.co.za, http://example.com)'
                },
                'triggers': ["activate_website_analysis"],
                'llm_role': {
                    'personality': 'Friendly, analytical export advisor named Sarah',
                    'goal': 'Extract and normalize website URL from response',
                    'tone': 'Warm and professional',
                    'instructions': [
                        '1. Extract any text that could be a website domain',
                        '2. Accept as valid if it contains at least one dot and a domain extension',
                        '3. Normalize the URL:',
                        '   - Add https:// if no protocol specified',
                        '   - Add www. if no subdomain specified',
                        '   - Convert to lowercase',
                        '4. Return empty response if valid domain is provided',
                        '5. Ask for a valid domain if none found'
                    ]
                }
            },
            'export_experience': {
                'id': 'export_experience',
                'prompt': "While I'm reviewing your website, {first_name}, has {business_name} participated in any direct exports, and if so can you give some context to your export activities to date?",
                'next_step': "export_motivation",
                'extraction_patterns': {
                    'export_experience': r".*"  # Capture everything as the export experience
                },
                'extraction_rules': {
                    'export_experience': 'Any information about previous export activities or lack thereof'
                },
                'llm_role': {
                    'personality': 'Friendly, analytical export advisor named Sarah',
                    'goal': 'Extract information about previous export experience',
                    'tone': 'Warm and professional',
                    'instructions': [
                        '1. Extract any information about previous export activities',
                        '2. Note whether they have export experience or not',
                        '3. Return empty response if any information is provided',
                        '4. Ask for clarification only if no clear response is given'
                    ]
                }
            },
            'export_motivation': {
                'id': 'export_motivation',
                'prompt': "While I'm reviewing your website, {first_name}, I'd love to hear why {business_name} is looking to export now? What's driving this decision?",
                'next_step': "target_markets",
                'extraction_patterns': {
                    'export_motivation': r".*"  # Capture everything as the motivation
                },
                'extraction_rules': {
                    'export_motivation': 'Any stated reason or motivation for wanting to export'
                },
                'llm_role': {
                    'personality': 'Friendly, analytical export advisor named Sarah',
                    'goal': 'Extract any motivation for exporting',
                    'tone': 'Warm and professional',
                    'instructions': [
                        '1. Extract any stated reason for wanting to export',
                        '2. Accept any motivation as valid (business growth, personal ambition, market testing, etc.)',
                        '3. Return empty response if any motivation is provided',
                        '4. Ask for clarification only if no clear motivation is given'
                    ]
                }
            },
            'target_markets': {
                'id': 'target_markets',
                'prompt': "Based on your business profile, I've identified several potential markets for {business_name}. Which markets are you most interested in exploring?",
                'next_step': "summary",
                'type': 'market_selection',
                'extraction_patterns': {
                    'selected_markets': r"([\w\s,]+)"
                },
                'extraction_rules': {
                    'selected_markets': 'The markets the user is interested in, as a comma-separated list'
                },
                'llm_role': {
                    'personality': 'Friendly, analytical export advisor named Sarah',
                    'goal': 'Extract the markets the user is interested in',
                    'tone': 'Warm and professional',
                    'instructions': [
                        '1. Extract the markets mentioned by the user',
                        '2. If no specific markets are mentioned, ask for clarification',
                        '3. Format the markets as a comma-separated list'
                    ]
                }
            },
            'summary': {
                'id': 'summary',
                'prompt': "{first_paragraph}\n\n{certification_paragraph}\n\n{requirements_paragraph}\n\nWould you like to create an account to see your full export readiness report and get a step-by-step roadmap to your first international shipment?",
                'type': "final",
                'extraction_patterns': {},
                'llm_role': {
                    'personality': 'Friendly, analytical export advisor named Sarah',
                    'goal': 'Summarize findings and encourage account creation',
                    'tone': 'Warm, professional, and enthusiastic',
                    'instructions': [
                        '1. Use the detected product information, certifications, and selected market',
                        '2. Personalize the message with the user\'s name and business name',
                        '3. Present a compelling summary of the initial assessment',
                    ]
                },
                'next_step': None  # End of the initial assessment flow
            }
        }
    
    def get_initial_question(self) -> Dict[str, Any]:
        """
        Get the initial question to start the assessment flow.
        
        Returns:
            Dictionary with step_id and question text
        """
        initial_step = self.assessment_flow.get("initial")
        if not initial_step:
            raise ValueError("Initial step not found in assessment flow")
        
        return {
            "step_id": "initial",
            "question": initial_step.get("prompt", "Welcome to the export assessment. Could you tell me about your business?")
        }
    
    def extract_info_from_response(self, step_id: str, response: str) -> Dict[str, Any]:
        """
        Extract information from user response based on the current step.
        Uses LLM for primary extraction with regex as fallback.
        
        Args:
            step_id: Current step ID
            response: User response text
            
        Returns:
            Dictionary with extracted information
        """
        step_config = self.assessment_flow.get(step_id)
        if not step_config:
            return {}
        
        extracted_info = {}
        
        # First attempt: LLM-based extraction
        try:
            extraction_fields = {info_key: "" for info_key in step_config.get("extraction_patterns", {})}
            if extraction_fields:
                llm_extracted = self._extract_with_llm(response, extraction_fields, step_id)
                if llm_extracted:
                    extracted_info.update(llm_extracted)
        except Exception as e:
            print(f"LLM extraction error: {str(e)}")
            # Continue to regex fallback
        
        # Second attempt: Apply regex extraction patterns as fallback
        for info_key, pattern in step_config.get("extraction_patterns", {}).items():
            # Skip if already extracted by LLM with high confidence
            if info_key in extracted_info and extracted_info.get(f"{info_key}_confidence", 0) > 0.7:
                continue
                
            if pattern:
                matches = re.search(pattern, response, re.IGNORECASE)
                if matches and matches.groups():
                    extracted_info[info_key] = matches.group(1).strip()
                elif info_key == "export_motivation" or info_key == "selected_markets":
                    # For free-form fields, just use the whole response
                    extracted_info[info_key] = response.strip()
        
        # Validate and clean extracted information
        self._validate_extracted_info(extracted_info, step_id)
        
        return extracted_info
    
    def process_response(self, step_id: str, user_response: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a user response in the assessment flow.
        
        Args:
            step_id: Current step ID
            user_response: User's response text
            user_data: Current user data
            
        Returns:
            Dictionary with next step and updated user data
        """
        # Get the current step
        current_step = self.assessment_flow.get(step_id)
        if not current_step:
            raise ValueError(f"Step {step_id} not found in assessment flow")
        
        # Extract information from the response
        extracted_info = self.extract_info_from_response(step_id, user_response)
        
        # Validate and clean extracted information
        self._validate_extracted_info(extracted_info, step_id)
        
        # Update user data with extracted information
        updated_user_data = {**user_data, **extracted_info}
        
        # For certain steps, have the LLM analyze the current response before moving on
        if step_id in ["export_experience"]:
            # Generate a response to the current answer before moving to the next question
            current_response = self._analyze_current_response(step_id, user_response, updated_user_data)
            if current_response:
                # Return the current response with the same step ID to continue the conversation
                return {
                    "next_step": {
                        "id": "export_motivation",  # Move to export_motivation after this
                        "prompt": current_response,
                        "type": "text"
                    },
                    "user_data": updated_user_data,
                    "dashboard_updates": {}
                }
        
        # Get the next step
        next_step_id = current_step.get("next_step")
        if not next_step_id:
            # End of flow
            return {
                "next_step": {
                    "id": "end",
                    "prompt": "Thank you for completing the assessment!",
                    "type": "final"
                },
                "user_data": updated_user_data
            }
        
        next_step = self.assessment_flow.get(next_step_id)
        if not next_step:
            raise ValueError(f"Next step {next_step_id} not found in assessment flow")
        
        # Format the prompt with user data
        base_prompt = next_step.get("prompt", "")
        prompt = self._format_prompt(base_prompt, updated_user_data)
        
        # For certain steps, generate a more contextual follow-up using the LLM
        if next_step_id in ["export_motivation", "target_markets", "export_experience"]:
            # Generate contextual follow-up based on previous responses
            contextual_prompt = self._generate_contextual_followup(step_id, user_response, next_step_id, updated_user_data)
            if contextual_prompt:
                prompt = contextual_prompt
        
        # Prepare the response
        response = {
            "next_step": {
                "id": next_step_id,
                "prompt": prompt,
                "type": next_step.get("type", "text")
            },
            "user_data": updated_user_data,
            "dashboard_updates": {}  # Placeholder for dashboard updates
        }
        
        # Add market options if this is a market selection step
        if next_step.get("type") == "market_selection":
            market_options = self._generate_market_options(updated_user_data)
            print(f"Generated market options: {len(market_options)} options")
            response["next_step"]["market_options"] = market_options
        
        return response
    
    def _format_prompt(self, prompt_template: str, user_data: Dict[str, Any]) -> str:
        """
        Format a prompt template with user data.
        
        Args:
            prompt_template: Template string with placeholders
            user_data: User data dictionary
            
        Returns:
            Formatted prompt
        """
        # If this is the summary step, use enhanced formatting
        if "{first_paragraph}" in prompt_template:
            return self._format_summary(prompt_template, user_data)
            
        # Extract values from user data
        formatted_prompt = prompt_template
        
        for key, value in user_data.items():
            placeholder = "{" + key + "}"
            if placeholder in formatted_prompt:
                # Handle both string and dict values
                if isinstance(value, dict) and 'text' in value:
                    formatted_prompt = formatted_prompt.replace(placeholder, value['text'])
                elif isinstance(value, str):
                    formatted_prompt = formatted_prompt.replace(placeholder, value)
                else:
                    # Convert other types to string
                    formatted_prompt = formatted_prompt.replace(placeholder, str(value))
        
        # Get selected markets
        selected_markets = user_data.get('selected_markets', 'the selected markets')
        # Handle case where selected_markets is a dictionary
        if isinstance(selected_markets, dict) and 'text' in selected_markets:
            selected_markets = selected_markets['text']
        elif not isinstance(selected_markets, str):
            selected_markets = str(selected_markets)
            
        formatted_prompt = formatted_prompt.replace("{selected_markets}", selected_markets)
        
        return formatted_prompt
    
    def _format_summary(self, prompt_template: str, user_data: Dict[str, Any]) -> str:
        """
        Format the summary with enhanced market intelligence.
        
        Args:
            prompt_template: Template string with placeholders
            user_data: User data dictionary
            
        Returns:
            Formatted summary with market intelligence
        """
        # Extract basic user information
        first_name = user_data.get('first_name', {}).get('text', 'there') if isinstance(user_data.get('first_name'), dict) else user_data.get('first_name', 'there')
        business_name = user_data.get('business_name', {}).get('text', 'your business') if isinstance(user_data.get('business_name'), dict) else user_data.get('business_name', 'your business')
        
        # Get product information from website data
        product_types = []
        try:
            import os
            import json
            mock_data_path = os.path.join("..", "..", "mock-data", "synthetic", "global-fresh-website.json")
            if os.path.exists(mock_data_path):
                with open(mock_data_path, "r") as f:
                    website_data = json.load(f)
                    
                # Extract product information
                if "products" in website_data and "categories" in website_data["products"]:
                    for category in website_data["products"]["categories"]:
                        if "items" in category:
                            for item in category["items"]:
                                product_types.append(item["name"])
        except Exception as e:
            print(f"Error loading Global Fresh website data: {str(e)}")
        
        # Default product type if extraction fails
        product_type = ", ".join(product_types[:2]) if product_types else "premium dried fruits and nuts"
        
        # Get selected markets
        selected_markets = user_data.get('selected_markets', 'the selected markets')
        # Handle case where selected_markets is a dictionary
        if isinstance(selected_markets, dict) and 'text' in selected_markets:
            selected_markets = selected_markets['text']
        elif not isinstance(selected_markets, str):
            selected_markets = str(selected_markets)
        
        # Generate market-specific insights based on selected markets
        market_insights = {
            "United States": "strong consumer demand for premium dried fruits and a growing health-conscious market",
            "European Union": "increasing interest in exotic and ethically-sourced food products",
            "UAE": "high purchasing power and demand for premium food products among expatriates and locals",
            "United Arab Emirates": "high purchasing power and demand for premium food products among expatriates and locals"
        }
        
        # Get the first selected market for specific insight
        first_market = selected_markets.split(',')[0].strip() if ',' in selected_markets else selected_markets
        market_insight = market_insights.get(first_market, "growing demand for premium food products")
        
        # Format the first paragraph
        first_paragraph = f"{first_name}, based on your website and the markets you're interested in, I've generated an initial export opportunity assessment for {business_name}. Your {product_type} are particularly well-positioned for the {selected_markets} market, where there's {market_insight}."
        
        # Format the certification paragraph
        certifications = ["HACCP Level 1"]
        if certifications:
            certification_paragraph = "I notice from your website you have the following certifications which will assist your export process and is an excellent foundation:\n"
            for cert in certifications:
                certification_paragraph += f"- {cert}\n"
        else:
            certification_paragraph = ""
        
        # Format the requirements paragraph
        requirements_paragraph = f"To enter {selected_markets}, you'll need various certifications and compliance documents, which we can assist you with identifying."
        
        # Replace placeholders in the template
        formatted_prompt = prompt_template.replace("{first_paragraph}", first_paragraph)
        formatted_prompt = formatted_prompt.replace("{certification_paragraph}", certification_paragraph.strip())
        formatted_prompt = formatted_prompt.replace("{requirements_paragraph}", requirements_paragraph)
        
        return formatted_prompt
    
    def _generate_market_options(self, user_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate market options based on user data.
        
        Args:
            user_data: User data dictionary
            
        Returns:
            List of market options with detailed descriptions
        """
        # Extract business information from user data
        business_name = user_data.get('business_name', {}).get('text', '') if isinstance(user_data.get('business_name'), dict) else user_data.get('business_name', '')
        website_url = user_data.get('website_url', {}).get('text', '') if isinstance(user_data.get('website_url'), dict) else user_data.get('website_url', '')
        export_motivation = user_data.get('export_motivation', {}).get('text', '') if isinstance(user_data.get('export_motivation'), dict) else user_data.get('export_motivation', '')
        
        # Try to load Global Fresh website data to get product information
        product_types = []
        product_categories = []
        try:
            import os
            import json
            mock_data_path = os.path.join("..", "..", "mock-data", "synthetic", "global-fresh-website.json")
            if os.path.exists(mock_data_path):
                with open(mock_data_path, "r") as f:
                    website_data = json.load(f)
                    
                # Extract product information
                if "products" in website_data and "categories" in website_data["products"]:
                    for category in website_data["products"]["categories"]:
                        product_categories.append(category["name"])
                        if "items" in category:
                            for item in category["items"]:
                                product_types.append(item["name"])
                
                print(f"Extracted product types: {product_types}")
                print(f"Extracted product categories: {product_categories}")
        except Exception as e:
            print(f"Error loading Global Fresh website data: {str(e)}")
        
        # Default values if extraction fails
        if not product_types:
            product_types = ["Premium Dried Fruits", "Nut Selections"]
        if not product_categories:
            product_categories = ["Cape Harvest Dried Fruit Line", "Safari Blend Nut Selections"]
        
        # Get product type and category
        product_type = ", ".join(product_types[:3])
        product_category = ", ".join(product_categories)
        
        # Limited market options as requested - only UAE, EU, and USA
        limited_markets = [
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
        
        print(f"Generated limited market options for {business_name}: {len(limited_markets)} options")
        return limited_markets
    
    def _extract_with_llm(self, response: str, fields: Dict[str, str], step_id: str) -> Dict[str, Any]:
        """
        Extract information using LLM.
        
        Args:
            response: User response text
            fields: Dictionary of fields to extract
            step_id: Current step ID
            
        Returns:
            Dictionary with extracted information and confidence scores
        """
        # Create extraction prompt based on step
        step_config = self.assessment_flow.get(step_id, {})
        field_descriptions = step_config.get("extraction_rules", {})
        
        # Build the extraction prompt
        fields_json = {field: field_descriptions.get(field, field) for field in fields}
        fields_json_str = json.dumps(fields_json, indent=2)
        
        prompt = f"""
        You are an expert at interpreting user responses and extracting structured information.
        
        The user responded: "{response}"
        
        Please extract the following information in JSON format:
        {fields_json_str}
        
        For each field, include a "confidence" value between 0 and 1.
        
        Return ONLY the JSON object, no introduction, explanation or extra text.
        """
        
        # Make LLM request
        try:
            llm_response = self._make_llm_request(prompt)
            
            # Parse JSON response
            extracted_data = json.loads(llm_response)
            
            # Add confidence scores
            result = {}
            for field, value in extracted_data.items():
                if isinstance(value, dict) and "text" in value and "confidence" in value:
                    # Store the entire structure for internal use
                    result[field] = {
                        "text": value["text"],
                        "confidence": value["confidence"]
                    }
                    # Also store the plain text value for easy access
                    result[f"{field}_text"] = value["text"]
                    result[f"{field}_confidence"] = value["confidence"]
                elif isinstance(value, dict) and "value" in value and "confidence" in value:
                    # Store the entire structure for internal use
                    result[field] = {
                        "text": value["value"],
                        "confidence": value["confidence"]
                    }
                    # Also store the plain text value for easy access
                    result[f"{field}_text"] = value["value"]
                    result[f"{field}_confidence"] = value["confidence"]
                else:
                    # For simple values, create a structured format
                    result[field] = {
                        "text": value,
                        "confidence": 0.8  # Default confidence
                    }
                    result[f"{field}_text"] = value
                    result[f"{field}_confidence"] = 0.8
            
            return result
        except Exception as e:
            print(f"LLM extraction error: {str(e)}")
            return {}
    
    def _make_llm_request(self, prompt: str, max_retries: int = 3) -> str:
        """
        Make a request to the LLM with retry logic.
        
        Args:
            prompt: The prompt to send to the LLM
            max_retries: Maximum number of retries
            
        Returns:
            LLM response text
        """
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                response = requests.post(
                    self.api_url,
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False
                    },
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if 'response' in result:
                        return self._clean_llm_response(result['response'])
                
                print(f"LLM request failed with status code {response.status_code}")
                retry_count += 1
                if retry_count < max_retries:
                    time.sleep(1)  # Wait before retrying
                    continue
                
                raise Exception(f"LLM service error: HTTP {response.status_code}")
                
            except Exception as e:
                print(f"Request failed: {str(e)}")
                retry_count += 1
                if retry_count < max_retries:
                    time.sleep(2)  # Wait longer before retrying
                    continue
                raise
        
        return "{}"  # Return empty JSON object if all retries fail
    
    def _clean_llm_response(self, response: str) -> str:
        """
        Clean the LLM response to extract just the JSON part.
        
        Args:
            response: Raw LLM response
            
        Returns:
            Cleaned response with just the JSON part
        """
        # Try to find JSON in the response
        try:
            # Look for content between triple backticks
            json_match = re.search(r"```(?:json)?(.*?)```", response, re.DOTALL)
            if json_match:
                return json_match.group(1).strip()
            
            # Look for content between curly braces
            json_match = re.search(r"(\{.*\})", response, re.DOTALL)
            if json_match:
                return json_match.group(1).strip()
            
            # If no JSON found, return the raw response
            return response.strip()
        except Exception as e:
            print(f"Error cleaning LLM response: {str(e)}")
            return response.strip()
    
    def _validate_extracted_info(self, extracted_info: Dict[str, Any], step_id: str) -> None:
        """
        Validate and clean extracted information.
        
        Args:
            extracted_info: Dictionary with extracted information
            step_id: Current step ID
        """
        # Validate website URL
        if step_id == "website" and "website_url" in extracted_info:
            url_data = extracted_info["website_url"]
            
            # Handle different data structures
            if isinstance(url_data, dict) and "text" in url_data:
                url = url_data["text"]
            else:
                url = str(url_data)
            
            # Add https:// if no protocol
            if not url.startswith(("http://", "https://")):
                url = "https://" + url
            
            # Parse the URL
            parsed_url = urlparse(url)
            
            # Validate domain
            if not parsed_url.netloc:
                # Invalid URL, remove it
                extracted_info.pop("website_url", None)
            else:
                # Update with normalized URL
                if isinstance(url_data, dict) and "text" in url_data:
                    extracted_info["website_url"] = {
                        "text": url,
                        "confidence": url_data.get("confidence", 0.8)
                    }
                    # Also update the text version
                    extracted_info["website_url_text"] = url
                else:
                    extracted_info["website_url"] = {
                        "text": url,
                        "confidence": 0.8
                    }
                    extracted_info["website_url_text"] = url
    
    def create_chat_session(self, user_id: str) -> str:
        """
        Create a new chat session.
        
        Args:
            user_id: User ID
            
        Returns:
            Chat session ID
        """
        import uuid
        
        # Generate a unique chat ID
        chat_id = str(uuid.uuid4())
        
        # Initialize the chat session
        self.chat_sessions[chat_id] = {
            "user_id": user_id,
            "created_at": self._get_current_timestamp(),
            "current_step": "initial",
            "completed_steps": [],
            "extracted_info": {},
            "conversation_history": []
        }
        
        return chat_id
    
    def process_message(self, chat_id: str, message: str) -> Dict[str, Any]:
        """
        Process a user message in a chat session.
        
        Args:
            chat_id: Chat session ID
            message: User message
            
        Returns:
            Dictionary with response and updated session information
        """
        # Check if chat session exists
        if chat_id not in self.chat_sessions:
            raise ValueError(f"Chat session {chat_id} not found")
        
        # Get the current session
        session = self.chat_sessions[chat_id]
        
        # Get the current step
        current_step_id = session.get("current_step", "initial")
        
        # Process the response
        result = self.process_response(
            step_id=current_step_id,
            user_response=message,
            user_data=session.get("extracted_info", {})
        )
        
        # Update the session with extracted information
        if "user_data" in result:
            session["extracted_info"] = result["user_data"]
        
        # Update the current step
        if "next_step" in result and "id" in result["next_step"]:
            next_step_id = result["next_step"]["id"]
            
            # Add current step to completed steps if it's different from the next step
            if current_step_id != next_step_id and current_step_id not in session["completed_steps"]:
                session["completed_steps"].append(current_step_id)
            
            # Update current step
            session["current_step"] = next_step_id
        
        # Add the message pair to conversation history
        session["conversation_history"].append({
            "user": message,
            "assistant": result.get("next_step", {}).get("prompt", ""),
            "timestamp": self._get_current_timestamp()
        })
        
        # Save the updated session
        self.chat_sessions[chat_id] = session
        
        # Return the response
        return {
            "response": result.get("next_step", {}).get("prompt", ""),
            "current_step": session["current_step"],
            "completed_steps": session["completed_steps"],
            "extracted_info": session["extracted_info"]
        }
    
    def get_chat_history(self, chat_id: str) -> List[Dict[str, Any]]:
        """
        Get the conversation history for a chat session.
        
        Args:
            chat_id: Chat session ID
            
        Returns:
            List of message pairs
        """
        # Check if chat session exists
        if chat_id not in self.chat_sessions:
            raise ValueError(f"Chat session {chat_id} not found")
        
        # Return the conversation history
        return self.chat_sessions[chat_id].get("conversation_history", [])
        
    def _get_current_timestamp(self) -> str:
        """
        Get the current timestamp in ISO format.
        
        Returns:
            ISO formatted timestamp
        """
        from datetime import datetime
        return datetime.utcnow().isoformat()
    
    def _generate_contextual_followup(self, current_step_id: str, user_response: str, next_step_id: str, user_data: Dict[str, Any]) -> str:
        """
        Generate a contextual follow-up question based on the user's response and the next step.
        
        Args:
            current_step_id: Current step ID
            user_response: User's response text
            next_step_id: Next step ID
            user_data: Current user data
            
        Returns:
            Contextual follow-up question or None if generation fails
        """
        # Get basic user info
        first_name = user_data.get('first_name', {}).get('text', 'there') if isinstance(user_data.get('first_name'), dict) else user_data.get('first_name', 'there')
        business_name = user_data.get('business_name', {}).get('text', 'your business') if isinstance(user_data.get('business_name'), dict) else user_data.get('business_name', 'your business')
        
        # Get the base prompt for the next step
        next_step = self.assessment_flow.get(next_step_id, {})
        base_prompt = next_step.get("prompt", "")
        
        # Create a context summary of the conversation so far
        context = f"User's name: {first_name}\nBusiness name: {business_name}\n"
        
        # Add export experience if available
        if 'export_experience' in user_data:
            export_exp = user_data['export_experience']['text'] if isinstance(user_data['export_experience'], dict) else user_data['export_experience']
            context += f"Export experience: {export_exp}\n"
        
        # Add website if available
        if 'website_url' in user_data:
            website = user_data['website_url']['text'] if isinstance(user_data['website_url'], dict) else user_data['website_url']
            context += f"Website: {website}\n"
        
        # Common instructions for natural conversation
        natural_conversation_instructions = """
        Important guidelines for a natural conversation:
        - Use contractions (don't, you're, we're, etc.)
        - Keep your tone warm and casual, like chatting with a colleague
        - Include some natural enthusiasm or curiosity
        - Avoid formal business language or consultant-speak
        - Don't use formal closings like "Best regards" or "Sincerely"
        - Keep it brief (1-2 short sentences is ideal)
        - Use natural transitions and conversational phrases
        """
        
        # Determine what kind of follow-up to generate based on the next step
        if next_step_id == "export_experience":
            # Generate a personalized question about export experience based on their business
            prompt = f"""
            You are Sarah, a friendly and conversational export consultant at TradeWizard. You speak naturally like a real person having a chat.
            
            Conversation context:
            {context}
            
            The user just shared their website: "{user_response}"
            
            Ask if {business_name} has participated in any direct exports before in a casual, conversational way. 
            Make it sound natural, like you're genuinely curious about their experience.
            
            {natural_conversation_instructions}
            
            Example of a good response: "While I'm checking out your website, {first_name}, I'm curious - has {business_name} done any direct exporting before? If so, I'd love to hear about those experiences!"
            """
        elif next_step_id == "export_motivation":
            # Check if they have export experience to tailor the question
            export_exp = ""
            has_experience = False
            if 'export_experience' in user_data:
                export_exp = user_data['export_experience']['text'] if isinstance(user_data['export_experience'], dict) else user_data['export_experience']
                # Simple heuristic to detect if they have experience
                negative_phrases = ["no", "none", "haven't", "havent", "not yet", "not exported", "no experience"]
                has_experience = not any(phrase in export_exp.lower() for phrase in negative_phrases)
            
            if has_experience:
                prompt = f"""
                You are Sarah, a friendly and conversational export consultant at TradeWizard. You speak naturally like a real person having a chat.
                
                Conversation context:
                {context}
                
                The user has indicated they have some export experience: "{export_exp}"
                
                Ask about their ambitions to expand their exports in a casual, conversational way that shows genuine interest.
                
                {natural_conversation_instructions}
                
                Example of a good response: "That's interesting experience with [mention specific market if they shared one]! What's driving your interest in expanding to new markets now? Any particular opportunities you've spotted?"
                """
            else:
                prompt = f"""
                You are Sarah, a friendly and conversational export consultant at TradeWizard. You speak naturally like a real person having a chat.
                
                Conversation context:
                {context}
                
                The user has indicated they don't have export experience yet.
                
                Ask why they're interested in exporting now in a casual, conversational way that shows genuine curiosity.
                
                {natural_conversation_instructions}
                
                Example of a good response: "So this would be your first export venture - exciting! What's sparked your interest in taking {business_name} international right now?"
                """
        elif next_step_id == "target_markets":
            # Generate a more personalized question about target markets based on their motivation
            export_motivation = user_data.get('export_motivation', {}).get('text', '') if isinstance(user_data.get('export_motivation'), dict) else user_data.get('export_motivation', '')
            
            prompt = f"""
            You are Sarah, a friendly and conversational export consultant at TradeWizard. You speak naturally like a real person having a chat.
            
            Conversation context:
            {context}
            Export motivation: {export_motivation}
            
            The user just responded about their export motivation with: "{user_response}"
            
            Ask which markets they're interested in exploring in a casual, conversational way.
            Reference something specific from their motivation if possible.
            
            {natural_conversation_instructions}
            
            Example of a good response: "Based on what you've shared, I've got some market ideas that might be a good fit for {business_name}. Which regions are you most curious about exploring?"
            """
        else:
            # For other steps, use the default prompt
            return None
        
        try:
            # Make LLM request
            contextual_followup = self._make_llm_request(prompt)
            
            # Clean up the response
            contextual_followup = contextual_followup.strip()
            
            # If the response is too long or empty, fall back to the default
            if len(contextual_followup) > 300 or len(contextual_followup) < 10:
                return None
                
            return contextual_followup
        except Exception as e:
            print(f"Error generating contextual follow-up: {str(e)}")
            return None
    
    def _analyze_current_response(self, step_id: str, user_response: str, user_data: Dict[str, Any]) -> str:
        """
        Analyze the current response and provide feedback before moving to the next question.
        
        Args:
            step_id: Current step ID
            user_response: User's response text
            user_data: Current user data
            
        Returns:
            Response to the current answer or None if generation fails
        """
        # Get basic user info
        first_name = user_data.get('first_name', {}).get('text', 'there') if isinstance(user_data.get('first_name'), dict) else user_data.get('first_name', 'there')
        business_name = user_data.get('business_name', {}).get('text', 'your business') if isinstance(user_data.get('business_name'), dict) else user_data.get('business_name', 'your business')
        
        if step_id == "export_experience":
            prompt = f"""
            You are Sarah, a friendly and conversational export readiness consultant at TradeWizard. You speak in a natural, warm, and engaging way - like a real person having a chat, not like a formal business consultant.

            The user, {first_name} from {business_name}, just responded to a question about their export experience with: "{user_response}"
            
            If they have NO export experience (they said "none", "no", etc.):
            - Respond in a casual, encouraging way like: "Thanks for sharing that, {first_name}! Starting an export journey is exciting new territory for many businesses."
            - Then ask about their motivation in a conversational way, like you're genuinely curious: "What's got you thinking about international markets now? Is there something specific that's sparked this interest?"
            
            If they DO have export experience:
            - Acknowledge their experience in a friendly, impressed tone
            - Reference specific details they mentioned (regions, methods, etc.)
            - Ask about their future plans in a casual, interested way like: "That's great experience! What's next on your export roadmap? Any new markets or expansion plans you're considering?"
            
            Important:
            - Use contractions (don't instead of do not, you're instead of you are)
            - Include a bit of enthusiasm with natural expressions
            - Keep it brief and conversational (2-3 short sentences)
            - Avoid formal business language or consultant-speak
            - Don't sign off with "Best regards" or similar formal closings
            """
            
            try:
                # Make LLM request
                response = self._make_llm_request(prompt)
                
                # Clean up the response
                response = response.strip()
                
                # If the response is too long or empty, fall back to the default
                if len(response) > 300 or len(response) < 10:
                    return None
                    
                return response
            except Exception as e:
                print(f"Error analyzing current response: {str(e)}")
                return None
        
        return None 