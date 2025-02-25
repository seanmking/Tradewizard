"""Business validation service for handling field-specific validations."""

from typing import Dict, List, Optional, TypedDict, Union
from datetime import datetime
import re
import logging
from .llm_service import LLMService

# Configure logger
logger = logging.getLogger(__name__)

class ValidationResult(TypedDict):
    """Type definition for validation results."""
    is_valid: bool
    suggestions: List[str]
    confidence: float
    field_type: str
    value: str
    metadata: Dict[str, Union[str, bool, float]]

class ValidationError(Exception):
    """Custom exception for validation errors."""
    def __init__(self, message: str, field: str, details: Optional[Dict] = None):
        self.message = message
        self.field = field
        self.details = details or {}
        super().__init__(self.message)

class ValidationService:
    """Service for handling business field validations."""
    
    def __init__(self, llm_service: Optional[LLMService] = None):
        self.llm_service = llm_service or LLMService()
        self._setup_validators()
    
    def _setup_validators(self) -> None:
        """Initialize field-specific validators."""
        self.validators = {
            'company_name': self._validate_company_name,
            'registration_number': self._validate_registration_number,
            'tax_number': self._validate_tax_number,
            'contact_details': self._validate_contact_details,
            'sector': self._validate_sector,
            'subcategory': self._validate_subcategory
        }
    
    async def validate_field(self, field: str, value: str) -> ValidationResult:
        """Validate a specific field with proper error handling.
        
        Args:
            field: The field to validate
            value: The value to validate
            
        Returns:
            ValidationResult containing validation status and details
            
        Raises:
            ValidationError: If validation fails with specific reason
        """
        try:
            logger.info(f"Validating field '{field}' with value '{value}'")
            
            if field not in self.validators:
                raise ValidationError(f"Unknown field: {field}", field)
            
            # Get field-specific validator
            validator = self.validators[field]
            
            # Perform validation
            result = await validator(value)
            
            # Log validation result
            logger.info(f"Validation result for {field}: {result['is_valid']}")
            
            return result
            
        except ValidationError as e:
            logger.error(f"Validation error for {field}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error validating {field}: {str(e)}")
            raise ValidationError(
                f"Validation failed: {str(e)}", 
                field,
                {'error_type': type(e).__name__}
            )
    
    async def _validate_company_name(self, value: str) -> ValidationResult:
        """Validate company name using rules and LLM."""
        # Basic validation
        if not value or len(value.strip()) < 2:
            return {
                'is_valid': False,
                'suggestions': ['Company name must be at least 2 characters'],
                'confidence': 1.0,
                'field_type': 'company_name',
                'value': value,
                'metadata': {'validation_type': 'length'}
            }
        
        # Use LLM for advanced validation
        try:
            llm_result = await self.llm_service.process_business_validation(
                'company_name', 
                value
            )
            
            return {
                'is_valid': llm_result['is_valid'],
                'suggestions': llm_result['suggestions'],
                'confidence': llm_result['confidence'],
                'field_type': 'company_name',
                'value': value,
                'metadata': {
                    'validation_type': 'llm',
                    'llm_confidence': llm_result['confidence']
                }
            }
        except Exception as e:
            logger.warning(f"LLM validation failed, falling back to basic: {str(e)}")
            # Fallback to basic validation
            return {
                'is_valid': True,
                'suggestions': ['Basic validation passed'],
                'confidence': 0.7,
                'field_type': 'company_name',
                'value': value,
                'metadata': {'validation_type': 'basic_fallback'}
            }
    
    async def _validate_registration_number(self, value: str) -> ValidationResult:
        """Validate registration number format and rules."""
        pattern = r'^\d{4}/\d{6}/\d{2}$'
        
        if not re.match(pattern, value):
            return {
                'is_valid': False,
                'suggestions': [
                    'Registration number must be in format YYYY/XXXXXX/XX',
                    'All parts must be numeric'
                ],
                'confidence': 1.0,
                'field_type': 'registration_number',
                'value': value,
                'metadata': {'validation_type': 'format'}
            }
        
        # Extract year
        year = int(value.split('/')[0])
        current_year = datetime.now().year
        
        if not (1900 <= year <= current_year):
            return {
                'is_valid': False,
                'suggestions': [
                    f'Year must be between 1900 and {current_year}'
                ],
                'confidence': 1.0,
                'field_type': 'registration_number',
                'value': value,
                'metadata': {'validation_type': 'year'}
            }
        
        # Use LLM for advanced validation
        try:
            llm_result = await self.llm_service.process_business_validation(
                'registration_number',
                value
            )
            
            return {
                'is_valid': llm_result['is_valid'],
                'suggestions': llm_result['suggestions'],
                'confidence': llm_result['confidence'],
                'field_type': 'registration_number',
                'value': value,
                'metadata': {
                    'validation_type': 'llm',
                    'llm_confidence': llm_result['confidence']
                }
            }
        except Exception as e:
            logger.warning(f"LLM validation failed, using basic result: {str(e)}")
            return {
                'is_valid': True,
                'suggestions': ['Format validation passed'],
                'confidence': 0.9,
                'field_type': 'registration_number',
                'value': value,
                'metadata': {'validation_type': 'basic'}
            }
    
    async def _validate_tax_number(self, value: str) -> ValidationResult:
        """Validate tax number format and rules."""
        if not value.isdigit() or len(value) != 10:
            return {
                'is_valid': False,
                'suggestions': [
                    'Tax number must be exactly 10 digits',
                    'Must contain only numbers'
                ],
                'confidence': 1.0,
                'field_type': 'tax_number',
                'value': value,
                'metadata': {'validation_type': 'format'}
            }
        
        # Use LLM for advanced validation
        try:
            llm_result = await self.llm_service.process_business_validation(
                'tax_number',
                value
            )
            
            return {
                'is_valid': llm_result['is_valid'],
                'suggestions': llm_result['suggestions'],
                'confidence': llm_result['confidence'],
                'field_type': 'tax_number',
                'value': value,
                'metadata': {
                    'validation_type': 'llm',
                    'llm_confidence': llm_result['confidence']
                }
            }
        except Exception as e:
            logger.warning(f"LLM validation failed, using basic result: {str(e)}")
            return {
                'is_valid': True,
                'suggestions': ['Format validation passed'],
                'confidence': 0.9,
                'field_type': 'tax_number',
                'value': value,
                'metadata': {'validation_type': 'basic'}
            }
    
    async def _validate_contact_details(self, value: str) -> ValidationResult:
        """Validate contact details structure and format."""
        try:
            # Expect JSON string
            import json
            details = json.loads(value)
            
            required_fields = ['email']
            missing_fields = [f for f in required_fields if f not in details]
            
            if missing_fields:
                return {
                    'is_valid': False,
                    'suggestions': [
                        f'Missing required fields: {", ".join(missing_fields)}'
                    ],
                    'confidence': 1.0,
                    'field_type': 'contact_details',
                    'value': value,
                    'metadata': {'validation_type': 'structure'}
                }
            
            # Validate email format
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, details['email']):
                return {
                    'is_valid': False,
                    'suggestions': ['Invalid email format'],
                    'confidence': 1.0,
                    'field_type': 'contact_details',
                    'value': value,
                    'metadata': {'validation_type': 'email'}
                }
            
            return {
                'is_valid': True,
                'suggestions': ['Contact details are valid'],
                'confidence': 1.0,
                'field_type': 'contact_details',
                'value': value,
                'metadata': {'validation_type': 'complete'}
            }
            
        except json.JSONDecodeError:
            return {
                'is_valid': False,
                'suggestions': ['Contact details must be valid JSON'],
                'confidence': 1.0,
                'field_type': 'contact_details',
                'value': value,
                'metadata': {'validation_type': 'format'}
            }
    
    async def _validate_sector(self, value: str) -> ValidationResult:
        """Validate business sector."""
        # Basic validation
        if not value or len(value.strip()) < 2:
            return {
                'is_valid': False,
                'suggestions': ['Sector must be at least 2 characters'],
                'confidence': 1.0,
                'field_type': 'sector',
                'value': value,
                'metadata': {'validation_type': 'length'}
            }
        
        # Use LLM for sector validation
        try:
            llm_result = await self.llm_service.process_business_validation(
                'sector',
                value
            )
            
            return {
                'is_valid': llm_result['is_valid'],
                'suggestions': llm_result['suggestions'],
                'confidence': llm_result['confidence'],
                'field_type': 'sector',
                'value': value,
                'metadata': {
                    'validation_type': 'llm',
                    'llm_confidence': llm_result['confidence']
                }
            }
        except Exception as e:
            logger.warning(f"LLM validation failed, using basic result: {str(e)}")
            return {
                'is_valid': True,
                'suggestions': ['Basic validation passed'],
                'confidence': 0.7,
                'field_type': 'sector',
                'value': value,
                'metadata': {'validation_type': 'basic'}
            }
    
    async def _validate_subcategory(self, value: str) -> ValidationResult:
        """Validate business subcategory."""
        # Basic validation
        if not value or len(value.strip()) < 2:
            return {
                'is_valid': False,
                'suggestions': ['Subcategory must be at least 2 characters'],
                'confidence': 1.0,
                'field_type': 'subcategory',
                'value': value,
                'metadata': {'validation_type': 'length'}
            }
        
        # Use LLM for subcategory validation
        try:
            llm_result = await self.llm_service.process_business_validation(
                'subcategory',
                value
            )
            
            return {
                'is_valid': llm_result['is_valid'],
                'suggestions': llm_result['suggestions'],
                'confidence': llm_result['confidence'],
                'field_type': 'subcategory',
                'value': value,
                'metadata': {
                    'validation_type': 'llm',
                    'llm_confidence': llm_result['confidence']
                }
            }
        except Exception as e:
            logger.warning(f"LLM validation failed, using basic result: {str(e)}")
            return {
                'is_valid': True,
                'suggestions': ['Basic validation passed'],
                'confidence': 0.7,
                'field_type': 'subcategory',
                'value': value,
                'metadata': {'validation_type': 'basic'}
            } 