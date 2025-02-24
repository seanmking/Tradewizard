"""Simplified LLM service for assessment system."""

import requests
from typing import Optional, Tuple, Dict, List
from dataclasses import dataclass
from datetime import datetime

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
    def __init__(self, api_url: str = "http://localhost:11434/api/generate"):
        self.api_url = api_url
    
    def get_response(
        self, 
        prompt: str, 
        system_prompt: str,
        timeout: int = 10
    ) -> Optional[str]:
        """Get response from LLM"""
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
            return response.json()['response']
        except Exception as e:
            print(f"LLM Error: {str(e)}")
            return None

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
                    # Parse the response string as a Python dictionary
                    result = eval(response)
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
                'suggestions': ['Error parsing validation response'],
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
        """Validate company name with specific rules."""
        value = value.strip()
        
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
            
        return {
            'is_valid': True,
            'suggestions': ['Valid company name'],
            'confidence': confidence
        }

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