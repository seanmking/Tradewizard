from typing import Dict, List, Optional
from datetime import datetime
import uuid
import requests
import json
import re
import os
import difflib

class TradeAssessmentService:
    def __init__(self):
        """Initialize the unified trade assessment service"""
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
        
        # 1. Assessment Flow Definition - The core conversation sequence
        self.assessment_flow = {
            # Step 1: Introduction and Basic Information
            'introduction': {
                'id': 'introduction',
                'question': {
                    'text': "Hi there! I'm Sarah, your export readiness consultant. To help your business explore international opportunities, could you please tell me your name, your role, and the full name of the business you're representing?",
                    'extract_fields': ['first_name', 'last_name', 'role', 'business_name', 'business_entity_type'],
                    'system_displayed': True
                },
                'extraction_rules': {
                    'first_name': 'The person\'s first name',
                    'last_name': 'The person\'s last name',
                    'role': 'Their role in the business',
                    'business_name': 'The complete business name',
                    'business_entity_type': 'The type of business entity if mentioned'
                },
                'response_format': [
                    'For incomplete information only:',
                    '"I see that [state what you understood]. Could you please provide [specific missing field]?"'
                ],
                'llm_role': {
                    'personality': 'Friendly, analytical export advisor',
                    'goal': 'Extract and validate user information from their response',
                    'tone': 'Warm and professional',
                    'instructions': [
                        '1. Extract these required fields from the response:',
                        '   - First name',
                        '   - Last name',
                        '   - Role in the business',
                        '   - Complete business name',
                        '2. Return empty response if all fields are provided',
                        '3. Follow response_format if any field is missing'
                    ]
                },
                'next_step': 'website'
            },
            
            # Step 2: Website Information
            'website': {
                'id': 'website',
                'question': {
                    'text': "Great to meet you {first_name}! Could you share your business website URL? This will help me understand your products and current markets.",
                    'extract_fields': ['website_url'],
                    'system_displayed': True
                },
                'extraction_rules': {
                    'website_url': 'Any text that could be a website domain (e.g., example.com, www.example.co.za, http://example.com)'
                },
                'response_format': [
                    'For invalid domain only:',
                    '"I need at least a domain name with an extension (like example.com). Could you please provide your website domain?"'
                ],
                'llm_role': {
                    'personality': 'Friendly, analytical export advisor',
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
                        '5. Follow response_format if no valid domain found'
                    ]
                },
                'next_step': 'export_motivation'
            },
            
            # Step 3: Export Motivation
            'export_motivation': {
                'id': 'export_motivation',
                'question': {
                    'text': "Awesome! And while I look through your website, could you please tell me what's motivating you to explore export opportunities for {business_name}?",
                    'extract_fields': ['export_motivation'],
                    'system_displayed': True
                },
                'extraction_rules': {
                    'export_motivation': 'Any stated reason or motivation for wanting to export'
                },
                'response_format': [
                    'For unclear or no motivation only:',
                    '"Could you tell me, in your own words, why you\'re interested in exporting? Any reason is fine."'
                ],
                'llm_role': {
                    'personality': 'Friendly, analytical export advisor',
                    'goal': 'Extract any motivation for exporting',
                    'tone': 'Warm and professional',
                    'instructions': [
                        '1. Extract any stated reason for wanting to export',
                        '2. Accept any motivation as valid (business growth, personal ambition, market testing, etc.)',
                        '3. Return empty response if any motivation is provided',
                        '4. Follow response_format only if no clear motivation is given'
                    ]
                },
                'next_step': 'business_verification_intro'
            },
            
            # Step 4: Transition to Business Verification
            'business_verification_intro': {
                'id': 'business_verification_intro',
                'llm_role': {
                    'personality': 'Professional verifier',
                    'goal': 'Explain the need for business verification clearly and professionally',
                    'tone': 'Direct and reassuring'
                },
                'question': {
                    'text': "Thank you for sharing those details. Before we proceed with your export readiness assessment, we need to verify your business credentials and your authority to represent {business_name}. This security step helps us protect legitimate businesses from unauthorized access and ensures the confidentiality of your business information. Please click the 'Proceed to Business Verification' button below to continue with the verification process.",
                    'extract_fields': [],
                    'system_displayed': True,
                    'show_verification_button': True
                },
                'next_step': None  # End of chat flow, transition to verification form
            }
        }

        # 2. Business Verification Form - The next step after chat
        self.verification_fields = [
            # Business Identity Section
            {
                'section': 'Business Identity',
                'fields': [
                    {
                        'id': 'legal_business_name',
                        'label': 'Full Legal Business Name',
                        'type': 'text',
                        'prefill': 'business_name',
                        'required': True
                    },
                    {
                        'id': 'entity_type',
                        'label': 'Business Entity Type',
                        'type': 'dropdown',
                        'options': ['Pty Ltd', 'CC', 'Sole Proprietor', 'Partnership', 'Other'],
                        'prefill': 'business_entity_type',
                        'required': True
                    },
                    {
                        'id': 'registration_number',
                        'label': 'Business Registration Number',
                        'type': 'text',
                        'required': True
                    },
                    {
                        'id': 'tax_number',
                        'label': 'Tax Number',
                        'type': 'text',
                        'required': True
                    }
                ]
            },
            # Business Details Section
            {
                'section': 'Business Details',
                'fields': [
                    {
                        'id': 'year_established',
                        'label': 'Year Established',
                        'type': 'number',
                        'prefill': 'website_extract.year_founded',
                        'required': True
                    },
                    {
                        'id': 'physical_address',
                        'label': 'Physical Address',
                        'type': 'textarea',
                        'prefill': 'website_extract.location',
                        'required': True
                    },
                    {
                        'id': 'business_email',
                        'label': 'Business Email',
                        'type': 'email',
                        'prefill': 'website_extract.contact_email',
                        'required': True
                    },
                    {
                        'id': 'business_phone',
                        'label': 'Business Phone',
                        'type': 'tel',
                        'prefill': 'website_extract.contact_phone',
                        'required': True
                    }
                ]
            },
            # Industry and Export Section
            {
                'section': 'Industry and Export',
                'fields': [
                    {
                        'id': 'industry_subsector',
                        'label': 'Industry Subsector',
                        'type': 'dropdown',
                        'dependent_on': 'industry_sector',
                        'prefill': 'website_extract.subsector',
                        'required': True
                    },
                    {
                        'id': 'target_markets',
                        'label': 'Target Export Markets',
                        'type': 'multi_select',
                        'options': 'countries_list',
                        'prefill': 'llm_extract.target_markets',
                        'required': True
                    },
                    {
                        'id': 'export_products',
                        'label': 'Products/Services for Export',
                        'type': 'multi_select',
                        'options': 'website_extract.products',
                        'prefill': 'website_extract.main_products',
                        'required': True
                    },
                    {
                        'id': 'export_vision',
                        'label': 'Export Vision',
                        'type': 'textarea',
                        'prefill': 'llm_extract.enhanced_vision',
                        'required': True,
                        'editable': True
                    }
                ]
            }
        ]

        # 3. Industry Categories - Reference data for the verification form
        self.industry_sectors = {
            'FOOD_PRODUCTS': {
                'label': 'Food Products',
                'subcategories': {
                    'PROCESSED_FOODS': 'Processed Foods',
                    'FRESH_PRODUCE': 'Fresh Produce'
                }
            },
            'BEVERAGES': {
                'label': 'Beverages',
                'subcategories': {
                    'ALCOHOLIC': 'Alcoholic Beverages',
                    'NON_ALCOHOLIC': 'Non-alcoholic Beverages'
                }
            },
            'READY_TO_WEAR': {
                'label': 'Ready-to-Wear',
                'subcategories': {
                    'APPAREL': 'Apparel',
                    'JEWELLERY': 'Jewellery'
                }
            },
            'HOME_GOODS': {
                'label': 'Home Goods',
                'subcategories': {
                    'LEATHER_GOODS': 'Leather Goods',
                    'GIFTING': 'Gifting',
                    'DECOR': 'Decor'
                }
            },
            'NON_PRESCRIPTION_HEALTH': {
                'label': 'Non-Prescription Health',
                'subcategories': {
                    'BEAUTY': 'Beauty Products',
                    'OTC_HEALTH': 'Over-the-counter Health',
                    'WELLNESS': 'Wellness Products',
                    'VITAMINS': 'Vitamin Products'
                }
            }
        }

    def create_chat_session(self, user_id: str) -> str:
        """Create a new chat session"""
        chat_id = str(uuid.uuid4())
        
        # Initialize chat session
        self.chat_sessions[chat_id] = {
            'user_id': user_id,
            'created_at': datetime.utcnow().isoformat(),
            'status': 'active',
            'current_step': 'introduction',
            'extracted_info': {},
            'messages': []
        }
        
        return chat_id

    def _make_llm_request(self, prompt: str, max_retries: int = 3) -> str:
        """Make a request to the LLM with retry logic."""
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
                        return self._clean_response(result['response'])
                
                retry_count += 1
                if retry_count < max_retries:
                    print(f"Retrying due to HTTP {response.status_code}")
                    continue
                
                raise Exception(f"LLM service error: HTTP {response.status_code}")
                
            except (requests.exceptions.Timeout, requests.exceptions.RequestException) as e:
                if retry_count < max_retries:
                    print(f"Request failed: {str(e)}, retrying...")
                    retry_count += 1
                    continue
                raise Exception(f"LLM service error: {str(e)}")
        
        raise Exception("Failed to get valid response after all retries")

    def check_for_repetition(self, new_response: str, chat_id: str) -> bool:
        """Check if the new response is too similar to previous responses."""
        if chat_id not in self.chat_sessions:
            return False
            
        previous_responses = [
            msg['content'] for msg in self.chat_sessions[chat_id]['messages'][-3:]
            if msg['role'] == 'assistant'
        ]
        
        for prev in previous_responses:
            similarity = difflib.SequenceMatcher(None, new_response, prev).ratio()
            if similarity > self.SIMILARITY_THRESHOLD:
                return True
        return False

    def force_extraction_if_missing(self, message: str, required_fields: List[str], existing_info: Dict) -> Dict:
        """Force extraction of missing required fields."""
        missing_fields = [f for f in required_fields if f not in existing_info or not existing_info[f]]
        
        if not missing_fields:
            return {}
            
        extraction_prompt = f"""
Extract ONLY the following fields from the message if explicitly stated:
{', '.join(missing_fields)}

Message: {message}

Respond with ONLY a valid JSON object containing the extracted information.
Example format: {{"field1": "value1", "field2": "value2"}}
Do not include any text before or after the JSON object.
"""
        
        try:
            response = self._make_llm_request(extraction_prompt)
            # Try to find a JSON object in the response
            json_start = response.find('{')
            json_end = response.rfind('}')
            if json_start >= 0 and json_end > json_start:
                json_str = response[json_start:json_end + 1]
                extracted_data = json.loads(json_str)
                return {k: v for k, v in extracted_data.items() if v and v.strip()}
        except Exception as e:
            print(f"Forced extraction failed: {str(e)}")
            return {}

    def process_message(self, chat_id: str, message: str) -> Dict:
        """Process a user message in the assessment flow"""
        if chat_id not in self.chat_sessions:
            raise Exception("Chat session not found")

        session = self.chat_sessions[chat_id]
        current_step = session['current_step']
        step_config = self.assessment_flow[current_step]

        try:
            # Extract information from the message
            extracted_info = self._extract_information(
                message, 
                step_config['question']['extract_fields'],
                step_config['extraction_rules'] if 'extraction_rules' in step_config else {}
            )
            
            # Try forced extraction if regular extraction misses required fields
            if step_config['question']['extract_fields']:
                forced_info = self.force_extraction_if_missing(
                    message,
                    step_config['question']['extract_fields'],
                    extracted_info
                )
                extracted_info.update(forced_info)

            # Update session with extracted information
            session['extracted_info'].update(extracted_info)

            # Check if we should advance to next step
            should_advance = self._should_advance_step(session, extracted_info)
            
            # Generate response based on the situation
            response = None
            if not should_advance:
                # If missing information, generate clarifying response
                response = self._generate_response(message, session)
                if response and self.check_for_repetition(response, chat_id):
                    response = self._generate_response(message, session, avoid_repetition=True)
            elif current_step == session['current_step']:
                # If this is the first complete answer for this step, acknowledge it
                next_step = step_config['next_step']
                if next_step:
                    next_config = self.assessment_flow[next_step]
                    response = next_config['question']['text'].format(**session['extracted_info'])
                    session['current_step'] = next_step

            # Add message pair to history if we have a response
            if response:
                self._add_message_pair(chat_id, message, response)

            # Track completed steps
            completed_steps = []
            for step_id, step in self.assessment_flow.items():
                if step_id == current_step:
                    if should_advance:
                        completed_steps.append(step_id)
                    break
                completed_steps.append(step_id)

            return {
                'response': response,
                'extracted_info': extracted_info,
                'current_step': session['current_step'],
                'completed_steps': completed_steps,
                'should_show_verification_form': session['current_step'] == 'business_verification_intro'
            }

        except Exception as e:
            print(f"Error processing message: {str(e)}")
            return {
                'error': str(e),
                'current_step': session['current_step']
            }

    def _extract_information(self, message: str, extract_fields: List[str], extraction_rules: Dict) -> Dict:
        """Extract information from user message using LLM"""
        if not extract_fields:
            return {}

        # Build extraction prompt
        extraction_prompt = f"""
<instruction>
Extract ONLY the specified information from the user message below.
Do NOT infer or generate information - only extract what is explicitly stated.
</instruction>

<user_message>
{message}
</user_message>

<extraction_rules>
1. Only extract information that is explicitly stated
2. Leave fields empty if information is not clearly provided
3. Do not infer or guess missing information
4. Extract exactly as written in the message
</extraction_rules>

<fields_to_extract>
"""
        # Add field descriptions
        for field in extract_fields:
            if field in extraction_rules:
                extraction_prompt += f"- {field}: {extraction_rules[field]}\n"

        extraction_prompt += """
</fields_to_extract>

Respond with ONLY a valid JSON object containing the extracted information.
Leave out any fields where information was not explicitly provided.
"""

        try:
            response = requests.post(
                self.api_url,
                json={
                    "model": self.model,
                    "prompt": extraction_prompt,
                    "system": "You are an information extraction tool that only returns valid JSON.",
                    "stream": False
                },
                timeout=15
            )

            if response.status_code == 200:
                result = response.json()
                if 'response' in result:
                    extracted_data = json.loads(result['response'])
                    return {k: v for k, v in extracted_data.items() if v and v.strip()}

        except Exception as e:
            print(f"Extraction error: {str(e)}")

        return {}

    def _generate_response(self, message: str, session: Dict, avoid_repetition: bool = False) -> Optional[str]:
        """Generate LLM response based on current context"""
        current_step = session['current_step']
        step_config = self.assessment_flow[current_step]
        
        # Format the conversation context
        context = self._format_conversation_context(session)
        
        # Build the prompt
        prompt = f"""
<conversation_context>
{context}
</conversation_context>

<current_question>
{self._format_question(step_config['question']['text'], session['extracted_info'])}
</current_question>

<user_message>
{message}
</user_message>

<llm_role>
{json.dumps(step_config['llm_role'], indent=2)}
</llm_role>

<response_format>
{json.dumps(step_config.get('response_format', []), indent=2)}
</response_format>

Generate an appropriate response following the role and format above.
{"Please provide a different response than previous ones." if avoid_repetition else ""}
"""

        try:
            return self._make_llm_request(prompt)
        except Exception as e:
            print(f"Response generation error: {str(e)}")
            return None

    def _should_advance_step(self, session: Dict, extracted_info: Dict) -> bool:
        """Determine if we should advance to the next step"""
        current_step = session['current_step']
        step_config = self.assessment_flow[current_step]
        
        # If no fields to extract, always advance
        if not step_config['question']['extract_fields']:
            return True
            
        # Check if we have all required fields
        required_fields = step_config['question']['extract_fields']
        return all(
            field in session['extracted_info'] or field in extracted_info
            for field in required_fields
        )

    def _format_question(self, question_text: str, extracted_info: Dict) -> str:
        """Format question text with extracted information"""
        try:
            return question_text.format(**extracted_info)
        except KeyError:
            return question_text

    def _format_conversation_context(self, session: Dict) -> str:
        """Format the conversation context for the LLM"""
        return f"""
Current Step: {session['current_step']}
Extracted Information:
{json.dumps(session['extracted_info'], indent=2)}
"""

    def _add_message_pair(self, chat_id: str, user_message: str, assistant_response: str) -> None:
        """Add a message pair to the chat history"""
        timestamp = datetime.utcnow().isoformat()
        
        self.chat_sessions[chat_id]['messages'].extend([
            {
                'timestamp': timestamp,
                'role': 'user',
                'content': user_message
            },
            {
                'timestamp': timestamp,
                'role': 'assistant',
                'content': assistant_response
            }
        ])

    def _clean_response(self, response: str) -> str:
        """Clean the LLM response"""
        clean = re.sub(r'<[^>]+>', '', response)
        clean = re.sub(r'^Assistant:\s*', '', clean, flags=re.IGNORECASE)
        return clean.strip()

    def get_chat_history(self, chat_id: str) -> List[Dict]:
        """Get the chat history for a session"""
        if chat_id not in self.chat_sessions:
            raise Exception("Chat session not found")
        return self.chat_sessions[chat_id]['messages']

    def get_extracted_info(self, chat_id: str) -> Dict:
        """Get all extracted information for a session"""
        if chat_id not in self.chat_sessions:
            raise Exception("Chat session not found")
        return self.chat_sessions[chat_id]['extracted_info'] 