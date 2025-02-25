"""Simplified LLM service for assessment system."""

import requests
import json
import logging
from typing import Optional, Tuple, Dict, List
from dataclasses import dataclass
from datetime import datetime
from flask import current_app

# Configure service logger
logger = logging.getLogger(__name__)

if not logger.handlers:
    # Create handler
    handler = logging.FileHandler('logs/llm_service.log')
    handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

class BusinessValidationError(Exception):
    """Exception raised for business validation errors."""
    pass

class ServiceError(Exception):
    """Exception raised for service-level errors."""
    pass

@dataclass
class BusinessInfo:
    """Stores and validates business information."""
    company_name: Optional[str] = None
    registration_number: Optional[str] = None
    tax_number: Optional[str] = None
    contact_details: Dict[str, str] = None
    validation_status: Dict[str, bool] = None
    validation_errors: Dict[str, List[str]] = None

    def __post_init__(self):
        self.validation_status = {}
        self.validation_errors = {}
        self.contact_details = {}
        
    def validate_field(self, field: str, value: any) -> bool:
        """Validate a field value according to business rules."""
        if field == 'company_name':
            if not isinstance(value, str) or len(value) < 2:
                self.validation_errors[field] = ['Company name must be at least 2 characters long']
                return False
        elif field == 'registration_number':
            if not isinstance(value, str) or not value.count('/') == 2:
                self.validation_errors[field] = ['Registration number must be in format YYYY/XXXXXX/XX']
                return False
            parts = value.split('/')
            if not all(p.isdigit() for p in parts):
                self.validation_errors[field] = ['All parts must be numeric']
                return False
        elif field == 'tax_number':
            if not isinstance(value, str) or not value.isdigit() or len(value) != 10:
                self.validation_errors[field] = ['Tax number must be exactly 10 digits']
                return False
        elif field == 'contact_details':
            if not isinstance(value, dict) or 'email' not in value:
                self.validation_errors[field] = ['Contact details must include an email address']
                return False
        
        if field in self.validation_errors:
            del self.validation_errors[field]
        return True
        
    def update_field(self, field: str, value: any) -> None:
        """Update a field value and validate it."""
        if not hasattr(self, field):
            raise ValueError(f"Invalid field: {field}")
            
        # Validate the field
        is_valid = self.validate_field(field, value)
        
        # Update the field value and validation status
        setattr(self, field, value)
        self.validation_status[field] = is_valid

class LLMService:
    def __init__(self, api_url: Optional[str] = None):
        """Initialize LLM service.
        
        Args:
            api_url: Optional API URL. If not provided, will use the one from config.
        """
        self.api_url = api_url or "http://localhost:11434/api/generate"
        self.is_healthy = True
        self.last_error = None
        logger.info(f"LLM Service initialized with API URL: {self.api_url}")
    
    def get_response(
        self, 
        prompt: str, 
        system_prompt: str,
        timeout: int = 10
    ) -> Optional[str]:
        """Get response from LLM.
        
        Args:
            prompt: The user prompt to send to the LLM.
            system_prompt: The system prompt to guide the LLM.
            timeout: Request timeout in seconds.
            
        Returns:
            Optional[str]: The LLM response or None if an error occurs.
            
        Raises:
            ServiceError: If there's an error communicating with the LLM service.
        """
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
                logger.error(f"LLM service returned status code {response.status_code}")
                self.is_healthy = False
                self.last_error = f"HTTP {response.status_code}"
                raise ServiceError(f"LLM service error: HTTP {response.status_code}")
            
            result = response.json()
            if 'response' not in result:
                logger.error("Invalid response format from LLM service")
                raise ServiceError("Invalid response format from LLM service")
                
            return result['response']
            
        except requests.exceptions.Timeout:
            logger.error(f"LLM service timeout after {timeout} seconds")
            self.is_healthy = False
            self.last_error = "Timeout"
            raise ServiceError(f"LLM service timeout after {timeout} seconds")
            
        except requests.exceptions.RequestException as e:
            logger.error(f"LLM service request error: {str(e)}")
            self.is_healthy = False
            self.last_error = str(e)
            raise ServiceError(f"LLM service request error: {str(e)}")
            
        except Exception as e:
            logger.error(f"Unexpected error in LLM service: {str(e)}")
            self.is_healthy = False
            self.last_error = str(e)
            raise ServiceError(f"Unexpected error in LLM service: {str(e)}")

    def build_business_validation_prompt(self, field: str, value: str, business_info: BusinessInfo) -> str:
        """Build context-aware prompt for business validation."""
        validation_prompts = {
            'company_name': """
                Verify if this appears to be a valid company name: {value}
                Consider:
                - Name format and length (should be 3-100 characters)
                - Industry-specific conventions
                - Common naming patterns
                - Prohibited terms or characters
                Current validation status: {current_status}
                Previous errors: {errors}
                """,
            'registration_number': """
                Validate if this follows SA registration number format: {value}
                Check:
                - Length (should be exactly 14 characters)
                - Format (YYYY/XXXXXX/XX)
                - Year part should be valid (1900-current)
                Current validation status: {current_status}
                Previous errors: {errors}
                """,
            'tax_number': """
                Verify if this matches SARS tax number format: {value}
                Validate:
                - Number length (should be 10 digits)
                - Format (all numeric)
                - First two digits should be valid region code
                Current validation status: {current_status}
                Previous errors: {errors}
                """
        }
        
        return validation_prompts.get(field, "").format(
            value=value,
            current_status=business_info.validation_status.get(field, "Not validated"),
            errors=", ".join(business_info.validation_errors.get(field, []))
        )

    def parse_validation_response(self, response: str) -> Dict:
        """Parse LLM response into validation result."""
        try:
            # For testing purposes, parse the response string as a dictionary
            if isinstance(response, str):
                if 'is_valid' in response and 'suggestions' in response:
                    # Parse the response string as JSON
                    result = json.loads(response)
                    return {
                        'is_valid': bool(result.get('is_valid', False)),
                        'suggestions': list(result.get('suggestions', [])),
                        'confidence': float(result.get('confidence', 0.0))
                    }
            
            # If response doesn't match expected format, return error
            return {
                'is_valid': False,
                'suggestions': ['Error parsing validation response'],
                'confidence': 0.0
            }
        except Exception as e:
            return {
                'is_valid': False,
                'suggestions': [f'Error parsing validation response: {str(e)}'],
                'confidence': 0.0
            }

    def process_business_validation(
        self,
        field: str,
        value: str,
        business_info: Optional[BusinessInfo] = None
    ) -> Dict:
        """Process business validation request."""
        try:
            # Validate field name
            valid_fields = ['company_name', 'registration_number', 'tax_number']
            if field not in valid_fields:
                return {
                    'is_valid': False,
                    'suggestions': ['Invalid field name'],
                    'confidence': 0.0
                }

            # Get API response
            prompt = self.build_business_validation_prompt(field, value, business_info)
            system_prompt = self.get_business_validation_system_prompt()
            response = self.get_response(prompt, system_prompt)
            
            if response:
                result = self.parse_validation_response(response)
                
                # Update business info if provided
                if business_info:
                    business_info.validation_status[field] = result['is_valid']
                    if result['is_valid']:
                        business_info.validation_errors.pop(field, None)
                        setattr(business_info, field, value)
                    else:
                        business_info.validation_errors[field] = result['suggestions']
                
                return result
            
            # If no response from API, use local validation
            confidence = self._calculate_confidence(field, value)
            
            # Basic validation rules
            if not value or not isinstance(value, str):
                if business_info:
                    business_info.validation_status[field] = False
                    business_info.validation_errors[field] = ['Value must be a non-empty string']
                return {
                    'is_valid': False,
                    'suggestions': ['Value must be a non-empty string'],
                    'confidence': confidence
                }

            # Field-specific validation
            result = None
            if field == 'company_name':
                result = self._validate_company_name(value, confidence)
            elif field == 'registration_number':
                result = self._validate_registration_number(value, confidence)
            elif field == 'tax_number':
                result = self._validate_tax_number(value, confidence)

            # Update business info if provided
            if business_info and result:
                business_info.validation_status[field] = result['is_valid']
                if result['is_valid']:
                    business_info.validation_errors.pop(field, None)
                    setattr(business_info, field, value)
                else:
                    business_info.validation_errors[field] = result['suggestions']

            return result
            
        except ServiceError as e:
            # Re-raise service errors
            raise
        except Exception as e:
            # Convert other exceptions to ServiceError
            raise ServiceError(f"Validation service error: {str(e)}")

    def _calculate_confidence(self, field: str, value: str) -> float:
        """Calculate confidence level based on input characteristics."""
        if not value or len(value.strip()) <= 1:
            return 0.3  # Very low confidence for single character or empty inputs
            
        if field == 'company_name':
            # Higher confidence for well-formed company names
            if len(value) >= 5 and ' ' in value and any(suffix in value.lower() for suffix in ['ltd', 'pty', 'limited', 'corporation', 'inc']):
                return 0.95  # Very high confidence for proper company names
            elif len(value) >= 5 and ' ' in value:
                return 0.9  # High confidence for longer names with spaces
            elif len(value) >= 3:
                return 0.85  # Medium-high confidence for medium length names
            return 0.6  # Medium confidence for other company names
            
        # Higher confidence for other fields with proper format
        if field == 'registration_number':
            if value.count('/') == 2:
                parts = value.split('/')
                if len(parts) == 3 and all(p.isdigit() for p in parts):
                    try:
                        year = int(parts[0])
                        if 1900 <= year <= datetime.now().year:
                            return 0.9  # High confidence for valid registration numbers
                    except ValueError:
                        pass
            return 0.85  # Default for registration numbers
            
        elif field == 'tax_number':
            if value.isdigit() and len(value) == 10:
                return 0.9  # High confidence for valid tax numbers
            return 0.85  # Default for tax numbers
            
        return 0.85  # Default confidence for other cases

    def _validate_company_name(self, value: str, confidence: float) -> Dict:
        """Validate company name with specific rules and extract entity type."""
        value = value.strip()
        
        # Common SA entity types and their variations
        entity_types = {
            'pty': ['pty', 'pty ltd', 'proprietary limited'],
            'ltd': ['ltd', 'limited'],
            'inc': ['inc', 'incorporated'],
            'cc': ['cc', 'close corporation'],
            'npc': ['npc', 'non-profit company'],
            'soc': ['soc', 'state owned company']
        }
        
        # Basic length validation
        if len(value) < 2:
            return {
                'is_valid': False,
                'suggestions': [
                    'Company name is too short',
                    'Should be at least 2 characters'
                ],
                'confidence': confidence
            }
            
        if len(value) > 100:
            return {
                'is_valid': False,
                'suggestions': [
                    'Company name is too long',
                    'Maximum length is 100 characters'
                ],
                'confidence': confidence
            }
            
        if not any(c.isalnum() for c in value):
            return {
                'is_valid': False,
                'suggestions': [
                    'Company name must contain at least one letter or number',
                    'Special characters alone are not allowed'
                ],
                'confidence': confidence
            }

        # Check for invalid characters
        if any(c not in ' ()-@&.,' and not c.isalnum() for c in value):
            return {
                'is_valid': False,
                'suggestions': [
                    'Company name contains invalid characters',
                    'Only letters, numbers, and basic punctuation are allowed'
                ],
                'confidence': confidence
            }
        
        # Extract and validate entity type
        found_entity_type = None
        name_parts = value.lower().split()
        
        # Check for entity type at the end
        for entity, variations in entity_types.items():
            for variation in variations:
                variation_parts = variation.split()
                if len(name_parts) >= len(variation_parts):
                    if all(a == b for a, b in zip(name_parts[-len(variation_parts):], variation_parts)):
                        found_entity_type = entity
                        break
            if found_entity_type:
                break
        
        result = {
            'is_valid': True,
            'suggestions': ['Valid company name'],
            'confidence': confidence,
            'entity_type': found_entity_type
        }
        
        # Add suggestion if no entity type found
        if not found_entity_type:
            result['suggestions'].append('Consider adding a legal entity type (e.g., PTY LTD, CC)')
            result['confidence'] *= 0.9  # Slightly lower confidence
        
        return result

    def _validate_registration_number(self, value: str, confidence: float) -> Dict:
        """Validate registration number with specific rules."""
        parts = value.split('/')
        
        if len(parts) != 3:
            return {
                'is_valid': False,
                'suggestions': [
                    'Invalid format',
                    'Should follow YYYY/XXXXXX/XX pattern'
                ],
                'confidence': confidence
            }
            
        try:
            year = int(parts[0])
            if not (1900 <= year <= datetime.now().year):
                return {
                    'is_valid': False,
                    'suggestions': [
                        f'Year must be between 1900 and {datetime.now().year}',
                        'Invalid registration year'
                    ],
                    'confidence': confidence
                }

            if len(parts[1]) != 6 or not parts[1].isdigit():
                return {
                    'is_valid': False,
                    'suggestions': [
                        'Middle section must be exactly 6 digits',
                        'Example format: YYYY/123456/XX'
                    ],
                    'confidence': confidence
                }

            if len(parts[2]) != 2 or not parts[2].isdigit():
                return {
                    'is_valid': False,
                    'suggestions': [
                        'Check digits must be exactly 2 digits',
                        'Example format: YYYY/XXXXXX/07'
                    ],
                    'confidence': confidence
                }

            return {
                'is_valid': True,
                'suggestions': ['Valid registration number'],
                'confidence': 0.95  # Higher confidence for fully valid registration numbers
            }
        except ValueError:
            return {
                'is_valid': False,
                'suggestions': [
                    'Invalid format',
                    'Should follow YYYY/XXXXXX/XX pattern'
                ],
                'confidence': confidence
            }

    def _validate_tax_number(self, value: str, confidence: float) -> Dict:
        """Validate tax number with specific rules."""
        if not value.isdigit():
            return {
                'is_valid': False,
                'suggestions': [
                    'Invalid format',
                    'Should be 10 digits'
                ],
                'confidence': confidence
            }
            
        if len(value) != 10:
            return {
                'is_valid': False,
                'suggestions': [
                    'Tax number must be exactly 10 digits',
                    f'Current length: {len(value)} digits'
                ],
                'confidence': confidence
            }
            
        return {
            'is_valid': True,
            'suggestions': ['Valid tax number'],
            'confidence': 0.95  # Higher confidence for valid tax numbers
        }

    def get_business_validation_system_prompt(self) -> str:
        """Get system prompt for business validation."""
        return """You are a business validation assistant specialized in South African business regulations.
        Analyze the provided information and respond with:
        1. Validation assessment (true/false)
        2. Specific improvement suggestions if needed
        3. Confidence score (0.0-1.0)
        Format response as JSON with keys: is_valid, suggestions, confidence"""

    def health_check(self) -> Tuple[bool, str]:
        """Check if LLM service is responding"""
        try:
            response = self.get_response("Say OK", "Respond with OK only")
            return response and "ok" in response.lower(), "LLM service is healthy"
        except Exception as e:
            return False, f"LLM service error: {str(e)}"

    def enhance_export_goals(self, original_goals: str, website_data: Dict = None) -> str:
        """
        Enhance the user's export goals using website data and LLM processing.
        Can work with or without website data.
        """
        try:
            # Build a context-rich prompt for the LLM
            prompt = f"""
            Original export goal: {original_goals}

            Task: Create an enhanced, visionary export goal that:
            1. Preserves the core intention of the original goal
            2. Expands on the target markets mentioned
            3. Adds specific value propositions
            4. Sets ambitious but achievable targets
            5. Maintains a professional, confident tone
            """

            # Add website data context if available
            if website_data:
                prompt += f"""
                
                Additional context from website:
                - Products: {website_data.get('product_portfolio', {}).get('categories', [])}
                - Current markets: {website_data.get('market_penetration', {}).get('geographic_coverage', {})}
                - Digital capabilities: {website_data.get('digital_readiness', {})}
                
                Please incorporate this information naturally into the enhanced goals.
                """
            else:
                prompt += """
                
                Note: Create a compelling vision based on the stated goals alone.
                Focus on the target markets and value proposition mentioned.
                """

            prompt += """
            Format: Return a 2-3 paragraph statement that flows naturally and inspires confidence.
            """

            # Get enhanced goals from LLM
            enhanced = self.get_response(
                prompt=prompt,
                system_prompt="You are an expert in international trade and business strategy. Create inspiring yet practical export goals."
            )

            if enhanced:
                return enhanced.strip()

            # Fallback to template-based enhancement
            enhanced_goals = f"{original_goals}\n\nBuilding on your vision, we can expand this goal:\n\n"
            
            if website_data:
                products = website_data.get('product_portfolio', {}).get('categories', [])
                markets = website_data.get('market_penetration', {}).get('geographic_coverage', {})
                capabilities = website_data.get('digital_readiness', {})

                if products:
                    enhanced_goals += f"Leveraging your strong {', '.join(products)} portfolio, "
                    enhanced_goals += "we can establish a commanding presence in targeted international markets. "
                
                if markets.get('international'):
                    current_markets = markets['international']
                    enhanced_goals += f"Your existing success in {len(current_markets)} international markets "
                    enhanced_goals += "provides a solid foundation for further expansion. "
                
                if capabilities:
                    enhanced_goals += "Your robust digital infrastructure positions you well for "
                    enhanced_goals += "efficient market entry and sustainable growth in new territories."
            else:
                # Create enhancement without website data
                enhanced_goals += "Your vision of targeting diaspora markets shows great potential. "
                enhanced_goals += "We can develop a strategic approach to reach these communities effectively, "
                enhanced_goals += "leveraging cultural connections while ensuring product competitiveness "
                enhanced_goals += "and sustainable market growth in each target region."
            
            return enhanced_goals.strip()

        except Exception as e:
            logger.error(f"Error enhancing export goals: {str(e)}")
            return original_goals  # Fallback to original goals if enhancement fails