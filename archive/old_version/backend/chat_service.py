"""LLM service for handling chat interactions and business validation."""

import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import requests
import json
from datetime import datetime
from mock_data.company_data import COMPANY_DATA, TAX_DATA, CONTACT_DATA
from mock_data.requirements import EXPORT_REQUIREMENTS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class BusinessInfo:
    """Stores validated business information."""
    company_name: Optional[str] = None
    registration_number: Optional[str] = None
    tax_number: Optional[str] = None
    validation_status: Dict[str, bool] = None
    validation_errors: Dict[str, List[str]] = None

    def __post_init__(self):
        self.validation_status = {}
        self.validation_errors = {}

class LLMService:
    """Service for handling LLM interactions and business validation."""
    
    def __init__(self, api_url: Optional[str] = None):
        self.api_url = api_url or "http://localhost:11434/api/generate"
        self.is_healthy = True
        self.last_error = None
        
    def get_response(self, prompt: str, system_prompt: str, timeout: int = 10) -> Optional[str]:
        """Get response from LLM with error handling."""
        try:
            response = requests.post(
                self.api_url,
                json={
                    "model": "mistral",
                    "prompt": prompt,
                    "system": system_prompt,
                    "stream": False
                },
                timeout=timeout
            )
            
            if response.status_code != 200:
                logger.error(f"LLM service error: HTTP {response.status_code}")
                return None
                
            result = response.json()
            return result.get('response')
            
        except Exception as e:
            logger.error(f"LLM service error: {str(e)}")
            return None

    def validate_business_info(self, field: str, value: str) -> Dict:
        """Validate business information fields."""
        validation_funcs = {
            'company_name': self._validate_company_name,
            'registration_number': self._validate_registration_number,
            'tax_number': self._validate_tax_number
        }
        
        if field not in validation_funcs:
            return {
                'is_valid': False,
                'suggestions': ['Invalid field type'],
                'confidence': 0.0
            }
            
        return validation_funcs[field](value)

    def _validate_company_name(self, value: str) -> Dict:
        """Validate company name format and structure."""
        value = value.strip()
        
        if len(value) < 2:
            return {
                'is_valid': False,
                'suggestions': ['Company name must be at least 2 characters long'],
                'confidence': 0.5
            }
            
        if len(value) > 100:
            return {
                'is_valid': False,
                'suggestions': ['Company name is too long (max 100 characters)'],
                'confidence': 0.5
            }
            
        # Check for entity type
        entity_types = ['pty', 'ltd', 'inc', 'cc', 'npc']
        has_entity_type = any(et in value.lower() for et in entity_types)
        
        return {
            'is_valid': True,
            'suggestions': [] if has_entity_type else ['Consider adding a legal entity type (e.g., PTY LTD)'],
            'confidence': 0.9 if has_entity_type else 0.7
        }

    def _validate_registration_number(self, value: str) -> Dict:
        """Validate registration number format (YYYY/XXXXXX/XX)."""
        parts = value.split('/')
        
        if len(parts) != 3:
            return {
                'is_valid': False,
                'suggestions': ['Use format: YYYY/XXXXXX/XX'],
                'confidence': 0.9
            }
            
        try:
            year = int(parts[0])
            if not (1900 <= year <= datetime.now().year):
                return {
                    'is_valid': False,
                    'suggestions': [f'Year must be between 1900 and {datetime.now().year}'],
                    'confidence': 0.9
                }
                
            if not (len(parts[1]) == 6 and parts[1].isdigit()):
                return {
                    'is_valid': False,
                    'suggestions': ['Middle section must be 6 digits'],
                    'confidence': 0.9
                }
                
            if not (len(parts[2]) == 2 and parts[2].isdigit()):
                return {
                    'is_valid': False,
                    'suggestions': ['Last section must be 2 digits'],
                    'confidence': 0.9
                }
                
            return {
                'is_valid': True,
                'suggestions': [],
                'confidence': 0.95
            }
            
        except ValueError:
            return {
                'is_valid': False,
                'suggestions': ['Invalid format'],
                'confidence': 0.9
            }

    def _validate_tax_number(self, value: str) -> Dict:
        """Validate tax number format (10 digits)."""
        if not value.isdigit():
            return {
                'is_valid': False,
                'suggestions': ['Tax number must contain only digits'],
                'confidence': 0.9
            }
            
        if len(value) != 10:
            return {
                'is_valid': False,
                'suggestions': ['Tax number must be exactly 10 digits'],
                'confidence': 0.9
            }
            
        return {
            'is_valid': True,
            'suggestions': [],
            'confidence': 0.95
        }

    def enhance_export_goals(self, goals: str, business_info: Optional[Dict] = None) -> str:
        """Enhance export goals with structured guidance."""
        prompt = f"""
        Original export goals: {goals}

        Please enhance these goals by:
        1. Adding specific target markets
        2. Including timeline estimates
        3. Suggesting concrete steps
        4. Maintaining realistic expectations
        """
        
        if business_info:
            prompt += f"\nBusiness Context:\n{json.dumps(business_info, indent=2)}"
            
        system_prompt = """You are an export strategy advisor. 
        Provide practical, achievable export goals with specific steps and timelines."""
        
        enhanced = self.get_response(prompt, system_prompt)
        return enhanced if enhanced else goals

    def get_business_context(self, business_info: BusinessInfo) -> str:
        """Generate business context for LLM prompts."""
        context = []
        if business_info.company_name:
            context.append(f"Company: {business_info.company_name}")
        if business_info.validation_status:
            context.append("Validation Status:")
            for field, status in business_info.validation_status.items():
                context.append(f"- {field}: {'✓' if status else '✗'}")
        return "\n".join(context)

    def health_check(self) -> Tuple[bool, str]:
        """Check LLM service health."""
        try:
            response = self.get_response("health check", "Respond with 'ok'")
            return bool(response), "Service is healthy"
        except Exception as e:
            return False, str(e)

class ChatService:
    def __init__(self):
        """Initialize chat service with conversation context."""
        self.conversation_history = []
        self.verified_business = None
        self.current_assessment_stage = None

    def process_message(self, message: str) -> Dict[str, Any]:
        """
        Process user message and return response.
        The LLM handles:
        1. Understanding user intent
        2. Business verification
        3. Export assessment
        4. Guidance and recommendations
        """
        # Add user message to history
        self.conversation_history.append({
            "role": "user",
            "content": message
        })

        # Get business context if available
        business_context = self._get_business_context()
        
        # Prepare LLM prompt
        prompt = self._prepare_prompt(message, business_context)
        
        # Get LLM response
        response = self._get_llm_response(prompt)
        
        # Process any actions from LLM (e.g., business verification)
        processed_response = self._process_llm_actions(response)
        
        # Add response to history
        self.conversation_history.append({
            "role": "assistant",
            "content": processed_response['message']
        })
        
        return processed_response

    def _get_business_context(self) -> Optional[Dict[str, Any]]:
        """Get current business context for LLM."""
        if not self.verified_business:
            return None
            
        return {
            "company_data": COMPANY_DATA.get(self.verified_business),
            "tax_data": TAX_DATA.get(self.verified_business),
            "contact_data": CONTACT_DATA.get(self.verified_business),
            "requirements": EXPORT_REQUIREMENTS
        }

    def _prepare_prompt(self, message: str, context: Optional[Dict[str, Any]]) -> str:
        """
        Prepare prompt for LLM with:
        1. Conversation history
        2. Business context if verified
        3. Current assessment stage
        4. User message
        """
        prompt = f"""You are an export readiness consultant helping assess businesses.
        
Previous conversation:
{self._format_conversation_history()}

Current assessment stage: {self.current_assessment_stage or 'Initial contact'}

"""
        
        if context:
            prompt += f"""
Business Context:
{self._format_business_context(context)}
"""
            
        prompt += f"""
User message: {message}

Provide a response that:
1. Maintains a professional, consultative tone
2. Validates business information when provided
3. Guides the assessment process naturally
4. Provides specific, actionable advice based on the business context
"""
        
        return prompt

    def _get_llm_response(self, prompt: str) -> Dict[str, Any]:
        """
        Get response from LLM.
        In production, this would call the actual LLM.
        For POC, we'll simulate responses.
        """
        # TODO: Integrate with actual LLM
        # For now, return mock response
        return {
            "message": "I understand you're interested in export assessment. Could you tell me about your business?",
            "actions": []
        }

    def _process_llm_actions(self, llm_response: Dict[str, Any]) -> Dict[str, Any]:
        """Process any actions recommended by the LLM."""
        actions = llm_response.get('actions', [])
        response = {'message': llm_response['message']}
        
        for action in actions:
            if action['type'] == 'verify_business':
                business_id = action['business_id']
                if business_id in COMPANY_DATA:
                    self.verified_business = business_id
                    response['business_verified'] = True
            elif action['type'] == 'set_stage':
                self.current_assessment_stage = action['stage']
                response['stage_updated'] = True
        
        return response

    def _format_conversation_history(self) -> str:
        """Format conversation history for LLM prompt."""
        return "\n".join([
            f"{msg['role']}: {msg['content']}"
            for msg in self.conversation_history[-5:]  # Last 5 messages for context
        ])

    def _format_business_context(self, context: Dict[str, Any]) -> str:
        """Format business context for LLM prompt."""
        return f"""
Company: {context['company_data']['companyName']}
Status: {context['company_data']['status']}
Tax Compliance: {context['tax_data']['compliant']}
Export Experience: {context['company_data']['exportReadiness']['experience']}
Target Markets: {', '.join(context['company_data']['exportReadiness']['targetMarkets']['primary'])}
""" 