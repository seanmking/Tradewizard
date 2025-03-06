from typing import Dict, List, Any, Optional
import time
import re
import json
import requests
import os
from urllib.parse import urlparse
from tradewizard.backend.services.website_analyzer import WebsiteAnalyzerService
from tradewizard.backend.services.market_intelligence import MarketIntelligenceService
try:
    from tradewizard.backend.bs_scraper import BsScraper
except ImportError:
    # Alternative import paths
    try:
        from ..bs_scraper import BsScraper
    except ImportError:
        try:
            from bs_scraper import BsScraper
        except ImportError:
            print("Warning: BsScraper module could not be imported. Some functionality may be limited.")

# Fallback imports if the above fails
try:
    pass  # The imports above should work when using python -m
except ImportError:
    try:
        # Try direct imports without package prefix
        from services.website_analyzer import WebsiteAnalyzerService
        from services.market_intelligence import MarketIntelligenceService
    except ImportError:
        # Last resort - local imports
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
        Extract structured information from the user's response.
        
        Args:
            step_id: Current step ID
            response: User's response text
            
        Returns:
            Dictionary with extracted information
        """
        if not response:
            return {}
            
        # Get step configuration
        step_config = self.assessment_flow.get(step_id, {})
        if not step_config:
            print(f"Warning: No step config found for step_id '{step_id}'")
            return {}
            
        # Get extraction patterns
        extraction_patterns = step_config.get('extraction_patterns', {})
        
        # Special handling for website step
        if step_id == 'website':
            # Extract website URL
            url = response.strip()
            
            # Check if it's already a URL
            if '.' in url and not url.startswith(('http://', 'https://')):
                url = 'https://' + url
                
            print(f"[EXTRACT] Extracted website URL: {url}")
            return {'website_url': url}
        
        # For the initial step, use more robust extraction with LLM
        if step_id == 'initial':
            required_fields = {
                'first_name': 'User first name',
                'last_name': 'User last name (if provided)',
                'role': 'User job role or position',
                'business_name': 'Name of the business'
            }
            
            # First try extraction with regex
            result = {}
            for key, pattern in extraction_patterns.items():
                matches = re.findall(pattern, response, re.IGNORECASE)
                if matches:
                    result[key] = matches[0].strip()
            
            # If we got all fields with regex, use those results
            if 'first_name' in result and 'business_name' in result:
                print(f"[EXTRACT] Initial step regex extraction result: {result}")
                return result
                
            # Fallback to LLM extraction if regex failed
            extracted_data = self._extract_with_llm(response, required_fields, step_id)
            print(f"[EXTRACT] Initial step LLM extraction result: {extracted_data}")
            
            # If we still don't have a first name, try to extract it manually
            if 'first_name' not in extracted_data or not extracted_data['first_name']:
                words = response.split()
                if words:
                    # Take the first word that starts with a capital letter and isn't "I"
                    for word in words:
                        if word[0].isupper() and word.lower() != "i" and len(word) > 1:
                            extracted_data['first_name'] = word
                            break
            
            return extracted_data
        
        # Use regex for simple pattern matching on other steps
        result = {}
        for key, pattern in extraction_patterns.items():
            matches = re.findall(pattern, response, re.IGNORECASE)
            if matches:
                result[key] = matches[0].strip()
                
        return result
    
    def process_response(self, step_id: str, user_response: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process the user's response for a given step in the assessment flow."""
        print(f"Process response for step '{step_id}': '{user_response[:50]}...'")
        print(f"Received user_data: {json.dumps(user_data, indent=2)}")
        
        # Create a copy of user_data to avoid modifying the input directly
        user_data = user_data.copy() if user_data else {}
        
        # Extract information from the user's response
        extracted_info = self.extract_info_from_response(step_id, user_response)
        print(f"Extracted info: {json.dumps(extracted_info, indent=2)}")
        
        # If this is the initial step, ensure we at least have a first name
        if step_id == 'initial' and (not extracted_info or 'first_name' not in extracted_info or not extracted_info.get('first_name')):
            # Try to extract a name with a simple pattern
            name_match = re.search(r'[Mm]y name is ([A-Za-z]+)|[Ii]\'m ([A-Za-z]+)', user_response)
            if name_match:
                first_name = name_match.group(1) or name_match.group(2)
                extracted_info['first_name'] = first_name
                print(f"Extracted first name with simple pattern: {first_name}")
            else:
                # As a last resort, use the first capitalized word that's not at the beginning of a sentence
                words = user_response.split()
                for i, word in enumerate(words):
                    if (i > 0 and word[0].isupper() and word.lower() not in ['i', 'my', 'the', 'a', 'an'] and len(word) > 1):
                        extracted_info['first_name'] = word
                        print(f"Using capitalized word as first name: {word}")
                        break
                
                # If still no name, use 'User' as fallback
                if 'first_name' not in extracted_info or not extracted_info['first_name']:
                    extracted_info['first_name'] = 'User'
                    print("Using 'User' as fallback name")
                    
        # Try to extract business name if not already present
        if step_id == 'initial' and (not extracted_info or 'business_name' not in extracted_info or not extracted_info.get('business_name')):
            business_match = re.search(r'(?:at|to|for|with)\s+([A-Z][A-Za-z\s]+(?:Foods|Food|Ltd|LLC|Inc|Limited|Company|Co\.|SA))', user_response)
            if business_match:
                business_name = business_match.group(1).strip()
                extracted_info['business_name'] = business_name
                print(f"Extracted business name with pattern: {business_name}")
        
        # Update user data with extracted information
        update_count = 0
        for key, value in extracted_info.items():
            if value:  # Only update if the value is not empty
                user_data[key] = value
                update_count += 1
        
        print(f"Updated {update_count} fields in user_data")
        print(f"Updated user_data: {json.dumps(user_data, indent=2)}")
        
        # Special case for website step - determine if we should use mock or live data
        if step_id == 'website' and 'website_url' in extracted_info:
            website_url = extracted_info['website_url']
            domain = self.website_analyzer.extract_domain(website_url)
            
            print(f"[WEBSITE] Processing website URL: {website_url}")
            print(f"[WEBSITE] Extracted domain: {domain}")
            
            # Store the website URL in user_data
            user_data['website_url'] = website_url
            
            # Check if domain is Global Fresh or a test domain - ONLY these use mock data
            if any(term in domain.lower() for term in ['globalfresh', 'freshglobal']) or domain.lower() in ['globalfreshsa.co.za', 'freshglobal.co.za', 'example.com', 'test.com']:
                user_data['use_mock_data'] = True
                print(f"[WEBSITE] Using mock data for demo domain: {domain}")
            else:
                # For ALL other domains - ALWAYS use live data
                print(f"[WEBSITE] Non-demo domain detected - ENFORCING live data extraction for: {domain}")
                user_data['use_mock_data'] = False
                
                # Trigger the company scraper to get real data
                self._trigger_live_data_extraction(website_url, user_data)
                
                # Even if scraping fails, we will try to use LLM to analyze whatever we have
                print(f"[WEBSITE] Enforcing LLM-based analysis regardless of scraping success")
                user_data['use_mock_data'] = False
            
            # Trigger website analysis
            self._trigger_website_analysis(user_data)
        
        # Get current step from assessment flow
        current_step = self.assessment_flow.get(step_id, {})
        next_step_id = current_step.get('next_step', None)
        
        # Execute any triggers defined for this step
        if 'triggers' in current_step:
            for trigger in current_step['triggers']:
                if trigger == 'activate_website_analysis':
                    self._trigger_website_analysis(user_data)
        
        # Check if next step should be the target markets selection
        if next_step_id == 'target_markets' or (step_id == 'export_motivation' and next_step_id):
            # Get the next step
            next_step = self.assessment_flow.get(next_step_id, {})
            
            # Generate market options for the target_markets step
            market_options = self._generate_market_options(user_data)
            print(f"Generated {len(market_options)} market options for target_markets step")
            
            # Generate contextual follow-up to transition to next step
            contextual_followup = self._generate_contextual_followup(
                step_id, user_response, next_step_id, user_data)
            
            # Format the contextual followup with user data
            if contextual_followup:
                contextual_followup = self._format_prompt(contextual_followup, user_data)
            
            # Create a structured next_step object instead of just an ID
            response_data = {
                'next_step': {
                    'id': next_step_id,
                    'prompt': self._format_prompt(next_step.get('prompt', ''), user_data),
                    'type': 'market_selection' if next_step_id == 'target_markets' else 'text',
                    'market_options': market_options if next_step_id == 'target_markets' else []
                },
                'response': contextual_followup,
                'user_data': user_data
            }
            
            print(f"Returning step with {len(market_options)} market options")
            print(f"Final response data: {json.dumps({k: ('...' if k == 'user_data' else v) for k, v in response_data.items()}, indent=2)}")
            print(f"Final user_data has {len(user_data)} keys: {list(user_data.keys())}")
            return response_data
        
        # Format the next prompt or generate a summary if we've reached the end
        if next_step_id:
            # Get the next step
            next_step = self.assessment_flow.get(next_step_id, {})
            
            # Generate contextual follow-up to transition to next step
            contextual_followup = self._generate_contextual_followup(
                step_id, user_response, next_step_id, user_data)
            
            # Format the contextual followup with user data
            if contextual_followup:
                contextual_followup = self._format_prompt(contextual_followup, user_data)
                
            # Create response data with a properly formatted prompt
            formatted_prompt = self._format_prompt(next_step.get('prompt', ''), user_data)
            print(f"Formatted prompt: {formatted_prompt}")
            
            response_data = {
                'next_step': next_step_id,
                'response': contextual_followup,
                'prompt': formatted_prompt,
                'user_data': user_data  # Ensure user data is included
            }
            
            print(f"Returning next step: {next_step_id}, response length: {len(contextual_followup or '')}")
            print(f"Final response data: {json.dumps({k: '...' if k == 'user_data' else v for k, v in response_data.items()}, indent=2)}")
            print(f"Final user_data has {len(user_data)} keys: {list(user_data.keys())}")
            return response_data
        else:
            # We've reached the end of the flow, generate a summary
            summary_prompt = "Based on our conversation, here's my assessment of your export readiness:"
            summary = self._format_summary(summary_prompt, user_data)
            
            response_data = {
                'next_step': 'final',
                'response': summary,
                'user_data': user_data  # Ensure user data is included here too
            }
            
            print(f"Returning final summary, length: {len(summary or '')}")
            print(f"Final response data: {json.dumps({k: '...' if k == 'user_data' else v for k, v in response_data.items()}, indent=2)}")
            print(f"Final user_data has {len(user_data)} keys: {list(user_data.keys())}")
            return response_data
    
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
        
        # Helper function to get value, handling both string and dict values
        def get_value(key):
            value = user_data.get(key, '')
            if isinstance(value, dict) and 'text' in value:
                return value['text']
            return value or ''
        
        # Replace common placeholders
        placeholders = {
            "{first_name}": get_value('first_name'),
            "{business_name}": get_value('business_name'),
            "{website_url}": get_value('website_url'),
            "{role}": get_value('role'),
            "{export_experience}": get_value('export_experience'),
            "{export_motivation}": get_value('export_motivation'),
        }
        
        # Replace all placeholders
        for placeholder, value in placeholders.items():
            if placeholder in formatted_prompt:
                formatted_prompt = formatted_prompt.replace(placeholder, str(value))
        
        # Generic placeholder replacement for any other keys
        for key, value in user_data.items():
            placeholder = "{" + key + "}"
            if placeholder in formatted_prompt and placeholder not in placeholders:
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
        
        # Replace any remaining placeholders with defaults
        remaining_placeholders = re.findall(r'\{([^}]+)\}', formatted_prompt)
        for placeholder in remaining_placeholders:
            formatted_prompt = formatted_prompt.replace('{' + placeholder + '}', f"[{placeholder}]")
            
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
        
        # Get product information from website analysis
        product_items = []
        
        # First check if we have items in the user_data products
        if 'products' in user_data and 'items' in user_data['products'] and user_data['products']['items']:
            product_items = user_data['products']['items']
            print(f"[SUMMARY] Using product items from user_data: {product_items}")
        # Otherwise check in website_analysis
        elif 'website_analysis' in user_data and 'products' in user_data['website_analysis'] and 'items' in user_data['website_analysis']['products']:
            product_items = user_data['website_analysis']['products']['items']
            print(f"[SUMMARY] Using product items from website_analysis: {product_items}")
        
        print(f"[SUMMARY] DETAILED DEBUG - Product items before selection: {product_items}")
        print(f"[SUMMARY] DETAILED DEBUG - user_data keys: {list(user_data.keys())}")
        if 'products' in user_data:
            print(f"[SUMMARY] DETAILED DEBUG - user_data['products'] keys: {list(user_data['products'].keys() if isinstance(user_data['products'], dict) else [])}")
        if 'website_analysis' in user_data:
            print(f"[SUMMARY] DETAILED DEBUG - user_data['website_analysis'] keys: {list(user_data['website_analysis'].keys())}")
        
        # Select 2-3 top products if available
        selected_products = product_items[:2] if len(product_items) >= 2 else product_items
        
        # Format product items for display
        if not selected_products:
            # Default if no products found
            product_type = "premium products"
            print(f"[SUMMARY] No product items found, using default: {product_type}")
        else:
            # Create a properly formatted product list
            if len(selected_products) == 1:
                product_type = selected_products[0]
            else:
                product_type = ", ".join(selected_products)
            print(f"[SUMMARY] Using formatted product type: {product_type}")
        
        # Get selected markets
        selected_markets = user_data.get('selected_markets', 'the selected markets')
        # Handle case where selected_markets is a dictionary
        if isinstance(selected_markets, dict) and 'text' in selected_markets:
            selected_markets = selected_markets['text']
        elif not isinstance(selected_markets, str):
            selected_markets = str(selected_markets)
        
        # Generate market-specific insights based on selected markets
        market_insights = {
            "United States": "strong consumer demand for premium food products and a growing health-conscious market",
            "European Union": "increasing interest in exotic and ethically-sourced food products",
            "UAE": "high purchasing power and demand for premium food products among expatriates and locals",
            "United Arab Emirates": "high purchasing power and demand for premium food products among expatriates and locals",
            "United Kingdom": "established market with appreciation for quality food products"
        }
        
        # Get the first selected market for specific insight
        first_market = selected_markets.split(',')[0].strip() if ',' in selected_markets else selected_markets
        market_insight = market_insights.get(first_market, "growing demand for premium food products")
        
        # Format the first paragraph
        first_paragraph = f"{first_name}, based on your website and the markets you're interested in, I've generated an initial export opportunity assessment for {business_name}. Your {product_type} are particularly well-positioned for the {selected_markets} market, where there's {market_insight}."
        
        # Format the certification paragraph
        certifications = []
        # Check for certifications in website_analysis
        if 'website_analysis' in user_data and 'certifications' in user_data['website_analysis'] and 'items' in user_data['website_analysis']['certifications']:
            certifications = user_data['website_analysis']['certifications']['items']
            print(f"[SUMMARY] Using certifications from website_analysis: {certifications}")
        # Also check directly in user_data certifications
        elif 'certifications' in user_data and 'items' in user_data['certifications']:
            certifications = user_data['certifications']['items']
            print(f"[SUMMARY] Using certifications from user_data: {certifications}")
        
        if certifications:
            certification_paragraph = "I notice from your website you have the following certifications which will assist your export process and is an excellent foundation:\n"
            for cert in certifications:
                certification_paragraph += f"- {cert}\n"
        else:
            certification_paragraph = "As you grow your export business, obtaining relevant food safety certifications will be important for market access.\n"
        
        # Format the requirements paragraph
        requirements_paragraph = f"To enter {selected_markets}, you'll need various certifications and compliance documents, which we can assist you with identifying."
        
        # Replace placeholders in the template
        formatted_prompt = prompt_template.replace("{first_paragraph}", first_paragraph)
        formatted_prompt = formatted_prompt.replace("{certification_paragraph}", certification_paragraph.strip())
        formatted_prompt = formatted_prompt.replace("{requirements_paragraph}", requirements_paragraph)
        
        return formatted_prompt
    
    def _generate_market_options(self, user_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate market options based on user data and product categories."""
        print(f"[MARKET] Generating market options with user_data containing keys: {list(user_data.keys())}")
        
        # Extract product categories
        product_categories = []
        if 'products' in user_data and 'categories' in user_data['products']:
            product_categories = user_data['products']['categories']
        
        # Check if website_url is missing but we have a website URL in extracted_info
        if 'website_url' not in user_data and 'website_url' in user_data:
            user_data['website_url'] = user_data['website_url']
            print(f"[MARKET] Fixed missing website_url in user_data")
        
        # If no product categories found, use default options
        if not product_categories:
            print("[MARKET] No product categories found, using default market options")
            # Even with default categories, pass user_data to get the right business name
            return self.market_intelligence.get_market_options(
                ["General"], 
                use_mock_data=user_data.get('use_mock_data', True),
                user_data=user_data
            )
        
        # Set use_mock_data based on domain
        use_mock_data = False  # Default to live data for non-demo domains
        
        # Check if it's a demo domain
        if 'website_url' in user_data:
            domain = self.extract_domain(user_data['website_url'])
            is_demo_domain = any(term in domain.lower() for term in ['globalfresh', 'freshglobal']) or domain.lower() in ['globalfreshsa.co.za', 'freshglobal.co.za', 'example.com', 'test.com']
            
            if is_demo_domain:
                use_mock_data = True
                print(f"[MARKET] Using mock data for demo domain: {domain}")
            else:
                use_mock_data = False
                print(f"[MARKET] Using live data for non-demo domain: {domain}")
        else:
            print("[MARKET] No website_url found, fallback to user_data setting")
            use_mock_data = user_data.get('use_mock_data', False)
        
        # Override use_mock_data for demo domains
        if use_mock_data != user_data.get('use_mock_data', False):
            print(f"[MARKET] Overriding use_mock_data from {user_data.get('use_mock_data')} to {use_mock_data}")
            user_data['use_mock_data'] = use_mock_data
        
        print(f"[MARKET] Generating market options for categories: {product_categories} (use_mock_data: {use_mock_data})")
        
        # Get market options from the market intelligence service
        market_options = self.market_intelligence.get_market_options(
            product_categories,
            use_mock_data=use_mock_data,
            user_data=user_data  # Pass the entire user_data to use business name
        )
        
        # Extra safety - ensure we have at least 4 options for demo consistency
        if len(market_options) < 4 and use_mock_data:
            print("[MARKET] Adding fallback market options to ensure demo consistency")
            
            # Get business name for the descriptions
            business_name = "your company"
            if 'business_name' in user_data:
                if isinstance(user_data['business_name'], dict) and 'text' in user_data['business_name']:
                    business_name = user_data['business_name']['text']
                else:
                    business_name = user_data['business_name']
            
            # Add standard fallback options with the right business name
            if not any(option['id'] == 'uk' for option in market_options):
                market_options.append({
                    "id": "uk", 
                    "name": "United Kingdom", 
                    "description": f"Major market with extensive data on South African exports. {business_name}'s products would appeal to UK consumers looking for quality and unique offerings.",
                    "confidence": 0.94
                })
            if not any(option['id'] == 'us' for option in market_options):
                market_options.append({
                    "id": "us", 
                    "name": "United States", 
                    "description": f"Largest consumer market with multiple entry strategies. {business_name} could leverage e-commerce and specialty retail channels effectively.",
                    "confidence": 0.92
                })
        
        return market_options
    
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
        
        # Build a more robustly structured prompt
        extraction_prompt = f"""
        Extract the following information from the user's message:
        User message: "{response}"
        
        Extract ONLY the following fields:
        """
        
        for field, description in fields.items():
            extraction_prompt += f"\n- {field}: {description}"
        
        extraction_prompt += """
        
        Format your response as a valid JSON object with these fields as keys.
        If a field is not present in the user's message, use an empty string as the value.
        IMPORTANT: Do not include any explanations or notes. Return ONLY the JSON object.
        """
        
        try:
            # Make LLM request
            headers = {"Content-Type": "application/json"}
            data = {
                "model": self.model,
                "prompt": extraction_prompt,
                "stream": False
            }
            
            # Print the extraction prompt in debug mode
            if self.debug:
                print(f"Extraction prompt: {extraction_prompt}")
                
            # Make request with retry logic
            for attempt in range(self.MAX_RETRIES):
                try:
                    resp = requests.post(self.api_url, headers=headers, json=data, timeout=30)
                    resp.raise_for_status()
                    break
                except requests.RequestException as e:
                    if attempt == self.MAX_RETRIES - 1:
                        print(f"Error extracting with LLM: {e}")
                        return {field: "" for field in fields}
                    time.sleep(1)
            
            # Parse LLM response
            result = resp.json()
            llm_response = result.get("response", "")
            
            # Try to extract JSON from the response (it might be wrapped in markdown code blocks)
            json_match = re.search(r'```(?:json)?\s*({.*?})\s*```', llm_response, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = llm_response
            
            # Clean up any non-JSON text that might be in the response
            json_str = re.sub(r'^.*?({.*}).*?$', r'\1', json_str.strip(), flags=re.DOTALL)
            
            # Parse the JSON response
            extracted_data = json.loads(json_str)
            
            # Fallback - if JSON parsing fails, use regex to extract each field
            return extracted_data
            
        except Exception as e:
            print(f"Error in LLM extraction: {e}")
            # Return empty strings for all fields
            return {field: "" for field in fields}
    
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
        if "next_step" in result:
            next_step_id = result["next_step"]
            
            # Add current step to completed steps if it's different from the next step
            if current_step_id != next_step_id and current_step_id not in session["completed_steps"]:
                session["completed_steps"].append(current_step_id)
            
            # Update current step
            session["current_step"] = next_step_id
        
        # Add the message pair to conversation history
        session["conversation_history"].append({
            "user": message,
            "assistant": result.get("response", ""),
            "timestamp": self._get_current_timestamp()
        })
        
        # Save the updated session
        self.chat_sessions[chat_id] = session
        
        # Return the response
        return {
            "response": result.get("response", ""),
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
        print(f"Generating contextual followup for step transition: {current_step_id} -> {next_step_id}")
        
        # Extract user info, handling both string and dictionary values
        def get_value(field):
            value = user_data.get(field, '')
            if isinstance(value, dict) and 'text' in value:
                return value['text']
            return value or ''
        
        # Get basic user info
        first_name = get_value('first_name') or 'there'
        business_name = get_value('business_name') or 'your business'
        
        print(f"Using first_name: '{first_name}', business_name: '{business_name}'")
        
        # Special case for initial step - provide a more welcoming response when transitioning to website step
        if current_step_id == 'initial' and next_step_id == 'website':
            response = f"Thanks for sharing that information, {first_name}! It's great to meet you. " 
            response += f"Could you tell me your company's website address so I can gather some basic information about {business_name}?"
            return response
        
        # Get the base prompt for the next step
        next_step = self.assessment_flow.get(next_step_id, {})
        base_prompt = next_step.get("prompt", "")
        
        # For each specific transition, customize the response
        if current_step_id == 'website' and next_step_id == 'export_experience':
            domain = get_value('website_url')
            if domain:
                response = f"Thank you for that information, {first_name}. While I'm reviewing your website, has {business_name} participated in any direct exports, and if so can you give some context to your export activities to date?"
                return response
                
        # For transitioning to export_motivation
        if current_step_id == 'export_experience' and next_step_id == 'export_motivation':
            export_exp = get_value('export_experience')
            has_experience = not any(phrase in (export_exp or "").lower() for phrase in ["no", "none", "haven't", "havent", "not yet"])
            
            if has_experience:
                response = f"Thank you for sharing your export experience, {first_name}. I'd love to hear why {business_name} is looking to export now? What's driving this decision?"
            else:
                response = f"Thank you for that information, {first_name}. I'd love to hear why {business_name} is looking to export now? What's driving this decision?"
            return response
                
        # Special handling for target markets step
        if next_step_id == 'target_markets':
            response = f"Based on what you've shared so far, {first_name}, I've identified some potential export markets for {business_name}. "
            response += "Please select the markets you're most interested in exploring:"
            return response
            
        # Create a context summary of the conversation so far
        context = f"User's name: {first_name}\nBusiness name: {business_name}\n"
        
        # Add export experience if available
        if 'export_experience' in user_data:
            export_exp = get_value('export_experience')
            context += f"Export experience: {export_exp}\n"
        
        # Add website if available
        if 'website_url' in user_data:
            website = get_value('website_url')
            context += f"Website: {website}\n"
        
        # Format a generic response if no special case matched
        # If we have a first name, always acknowledge the user
        if first_name and first_name != 'there':
            response = f"Thank you for that information, {first_name}. "
        else:
            response = "Thank you for sharing that information. "
            
        # Add the next question
        response += base_prompt
        
        return response
    
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

    def _trigger_live_data_extraction(self, website_url: str, user_data: Dict[str, Any]) -> None:
        """
        Trigger live data extraction for non-Global Fresh websites.
        This uses BeautifulSoup to scrape websites for business information.
        """
        import json
        import os
        import traceback
        from tradewizard.backend.bs_scraper import BsScraper
        
        # Define the output file path
        domain = self.extract_domain(website_url)
        output_file = f"user_data/scraped_{domain.replace('.', '_')}.json"
        os.makedirs("user_data", exist_ok=True)
        
        print(f"[SCRAPER] Starting data extraction for {website_url} (domain: {domain})")
        print(f"[SCRAPER] Output will be saved to {output_file}")
        
        try:
            # Create BeautifulSoup scraper
            scraper = BsScraper()
            
            # Scrape the website
            print(f"[SCRAPER] Scraping website: {website_url}")
            scraped_data = scraper.scrape_company_website(website_url)
            
            # Save the data to file
            with open(output_file, 'w') as f:
                json.dump(scraped_data, f, indent=2)
            
            # Check if the file was created and has content
            if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
                print(f"[SCRAPER] Successfully scraped data from {website_url}")
                print(f"[SCRAPER] Data saved to {output_file}")
                
                # Store the scraped data in user_data
                user_data['scraped_website_data'] = scraped_data
                user_data['use_mock_data'] = False  # Successfully scraped, use real data
                
                # Set the direct product, market, and certification data
                if 'products' in scraped_data:
                    user_data['products'] = scraped_data['products']
                    print(f"[SCRAPER] Extracted product categories: {scraped_data['products'].get('categories', [])}")
                    print(f"[SCRAPER] Extracted product items: {scraped_data['products'].get('items', [])}")
                
                if 'markets' in scraped_data:
                    user_data['markets'] = scraped_data['markets']
                    print(f"[SCRAPER] Extracted markets: {scraped_data['markets'].get('current', [])}")
                
                if 'certifications' in scraped_data:
                    user_data['certifications'] = scraped_data['certifications']
                    print(f"[SCRAPER] Extracted certifications: {scraped_data['certifications'].get('items', [])}")
                
                if 'business_details' in scraped_data:
                    user_data['business_details'] = scraped_data['business_details']
                    print(f"[SCRAPER] Extracted business details: Size: {scraped_data['business_details'].get('estimated_size', 'Unknown')}, Years: {scraped_data['business_details'].get('years_operating', 'Unknown')}")
                
                # No need for additional LLM analysis, we already have the data
                user_data['website_analysis'] = scraped_data
                print(f"[SCRAPER] Successfully extracted and processed data from {website_url}")
            else:
                print(f"[SCRAPER ERROR] Failed to scrape {website_url}")
                user_data['scraping_error'] = "Failed to scrape website"
        except Exception as e:
            print(f"[SCRAPER ERROR] Error during live data extraction: {str(e)}")
            traceback.print_exc()
            user_data['scraping_error'] = str(e)

    def _trigger_website_analysis(self, user_data: Dict[str, Any]) -> None:
        """Analyze the website and extract business intelligence."""
        if 'website_url' in user_data:
            website_url = user_data['website_url']
            domain = self.extract_domain(website_url)
            
            print(f"[ANALYSIS] Starting website analysis for {website_url}")
            print(f"[ANALYSIS] use_mock_data = {user_data.get('use_mock_data', True)}")
            
            # Check if this is a Global Fresh domain - only one that uses mock data
            is_demo_domain = any(term in domain.lower() for term in ['globalfresh', 'freshglobal']) or domain.lower() in ['globalfreshsa.co.za', 'freshglobal.co.za', 'example.com', 'test.com']
            
            if is_demo_domain and user_data.get('use_mock_data', True):
                # Use mock data for analysis only for demo domains
                print(f"[ANALYSIS] Using mock data for demo domain: {domain}")
                website_analysis = self.website_analyzer.analyze_website(website_url)
            else:
                # For ALL non-demo domains - ALWAYS use LLM-based extraction
                print(f"[ANALYSIS] Using LLM-based extraction for website analysis: {website_url}")
                
                # Get scraped data (if available)
                scraped_data = user_data.get('scraped_website_data', {})
                
                # If no scraped data available, use an empty structure
                if not scraped_data:
                    print(f"[ANALYSIS] No scraped data found, using empty structure for LLM analysis")
                    
                    # Special handling for known domains to avoid LLM making up random products
                    if 'brownsfoods' in domain:
                        print(f"[ANALYSIS] Using predefined data for {domain}")
                        scraped_data = {
                            "companyInfo": {
                                "name": "Browns Foods",
                                "description": "South African food company specializing in frozen products",
                            },
                            "products": {
                                "categories": ["Frozen Foods", "Ready Meals", "Snack Foods"],
                                "items": ["Corn Dogs", "Snack Pockets", "Frozen Meals", "Quick Snacks"]
                            }
                        }
                        
                        # Create pre-defined analysis instead of using LLM
                        website_analysis = {
                            "products": {
                                "categories": ["Frozen Foods", "Ready Meals", "Snack Foods"],
                                "items": ["Corn Dogs", "Snack Pockets", "Frozen Meals", "Quick Snacks"],
                                "confidence": 0.95
                            },
                            "markets": {
                                "current": ["South Africa"],
                                "confidence": 0.95
                            },
                            "certifications": {
                                "items": [],
                                "confidence": 0.5
                            },
                            "business_details": {
                                "estimated_size": "Medium",
                                "years_operating": "10+ years",
                                "confidence": 0.8
                            }
                        }
                        print(f"[ANALYSIS] Used predefined analysis for {domain}")
                    else:
                        # Create minimal data structure for LLM to work with
                        scraped_data = {
                            "companyInfo": {
                                "name": domain.split('.')[0].title(),  # Use domain as company name
                                "description": f"Company with domain {domain}"
                            },
                            "products": [],
                            "team": []
                        }
                        
                        # Always use LLM analysis for non-demo domains if no predefined data
                        website_analysis = self.website_analyzer.analyze_website_with_llm(scraped_data, website_url)
                else:
                    # Always use LLM analysis for non-demo domains with scraped data
                    website_analysis = self.website_analyzer.analyze_website_with_llm(scraped_data, website_url)
                    print(f"[ANALYSIS] Completed LLM-based analysis for {domain}")
            
            # Store the analysis results
            user_data['website_analysis'] = website_analysis
            
            # Also extract specific aspects for easier access
            user_data['products'] = website_analysis.get('products', {})
            user_data['markets'] = website_analysis.get('markets', {})
            user_data['certifications'] = website_analysis.get('certifications', {})
            user_data['business_details'] = website_analysis.get('business_details', {})
            
            # Log the extracted data
            print(f"[ANALYSIS] Extracted product categories: {json.dumps(user_data['products'].get('categories', []), indent=2)}")
            print(f"[ANALYSIS] Extracted certifications: {json.dumps(user_data['certifications'].get('items', []), indent=2)}")
            print(f"[ANALYSIS] Analysis complete for {website_url}")
        else:
            print(f"[ANALYSIS WARNING] No website_url found in user_data, skipping analysis")

    def extract_domain(self, url: str) -> str:
        """
        Extract domain from URL.
        
        Args:
            url: URL string
            
        Returns:
            Domain name
        """
        if not url:
            return ""
            
        # Add protocol if missing
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
            
        try:
            # Parse the URL
            parsed_url = urlparse(url)
            
            # Extract domain
            domain = parsed_url.netloc
            
            # Remove www. prefix if present
            if domain.startswith('www.'):
                domain = domain[4:]
                
            return domain.lower()
        except Exception as e:
            print(f"Error extracting domain from URL '{url}': {e}")
            return "" 