"""Assessment flow service for managing business validation process."""

from typing import Dict, List, Optional, TypedDict, Any
from datetime import datetime
import logging
import json
from .validation_service import ValidationService, ValidationError

# Configure logger
logger = logging.getLogger(__name__)

class AssessmentStep(TypedDict):
    """Type definition for assessment steps."""
    id: str
    name: str
    description: str
    required_fields: List[str]
    validation_rules: Dict[str, Any]

class AssessmentContext:
    """Manages the state and flow of business assessments."""
    
    # Define assessment steps
    STEPS = [
        {
            'id': 'business_info',
            'name': 'Business Information',
            'description': 'Basic business details',
            'required_fields': ['company_name', 'registration_number'],
            'validation_rules': {
                'company_name': {'min_length': 2},
                'registration_number': {'pattern': r'^\d{4}/\d{6}/\d{2}$'}
            }
        },
        {
            'id': 'tax_info',
            'name': 'Tax Information',
            'description': 'Tax registration details',
            'required_fields': ['tax_number'],
            'validation_rules': {
                'tax_number': {'length': 10, 'type': 'numeric'}
            }
        },
        {
            'id': 'contact_info',
            'name': 'Contact Information',
            'description': 'Business contact details',
            'required_fields': ['contact_details'],
            'validation_rules': {
                'contact_details': {'required_subfields': ['email']}
            }
        },
        {
            'id': 'business_category',
            'name': 'Business Category',
            'description': 'Industry sector and subcategory',
            'required_fields': ['sector', 'subcategory'],
            'validation_rules': {
                'sector': {'min_length': 2},
                'subcategory': {'min_length': 2}
            }
        }
    ]
    
    def __init__(self, session_id: str, validation_service: Optional[ValidationService] = None):
        """Initialize assessment context with session management.
        
        Args:
            session_id: Unique identifier for the assessment session
            validation_service: Optional validation service instance
        """
        self.session_id = session_id
        self.started_at = datetime.now()
        self.completed_at: Optional[datetime] = None
        self.current_step_index = 0
        self.validation_service = validation_service or ValidationService()
        
        # Initialize state
        self.business_info: Dict[str, Any] = {}
        self.validation_status: Dict[str, Any] = {
            'is_valid': False,
            'errors': [],
            'warnings': [],
            'suggestions': []
        }
        
        logger.info(f"Created new assessment context for session {session_id}")
    
    @property
    def current_step(self) -> AssessmentStep:
        """Get the current assessment step."""
        return self.STEPS[self.current_step_index]
    
    @property
    def is_complete(self) -> bool:
        """Check if assessment is complete."""
        return self.completed_at is not None
    
    @property
    def progress(self) -> Dict[str, Any]:
        """Get assessment progress information."""
        return {
            'current_step': self.current_step['id'],
            'total_steps': len(self.STEPS),
            'current_step_index': self.current_step_index + 1,
            'is_complete': self.is_complete,
            'started_at': self.started_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
    
    async def validate_current_step(self) -> Dict[str, Any]:
        """Validate all fields in the current step.
        
        Returns:
            Dict containing validation results
            
        Raises:
            ValidationError: If validation fails
        """
        step = self.current_step
        results = {
            'is_valid': True,
            'field_results': {},
            'missing_fields': []
        }
        
        # Check for missing required fields
        for field in step['required_fields']:
            if field not in self.business_info:
                results['missing_fields'].append(field)
                results['is_valid'] = False
        
        if results['missing_fields']:
            return results
        
        # Validate each field
        for field in step['required_fields']:
            try:
                value = self.business_info[field]
                if isinstance(value, dict):
                    value = json.dumps(value)
                
                validation_result = await self.validation_service.validate_field(
                    field,
                    str(value)
                )
                
                results['field_results'][field] = validation_result
                if not validation_result['is_valid']:
                    results['is_valid'] = False
                
            except ValidationError as e:
                results['field_results'][field] = {
                    'is_valid': False,
                    'error': str(e),
                    'field': field
                }
                results['is_valid'] = False
            except Exception as e:
                logger.error(f"Unexpected error validating {field}: {str(e)}")
                results['field_results'][field] = {
                    'is_valid': False,
                    'error': f"Unexpected error: {str(e)}",
                    'field': field
                }
                results['is_valid'] = False
        
        return results
    
    async def update_business_info(self, field: str, value: Any) -> Dict[str, Any]:
        """Update business information and validate the field.
        
        Args:
            field: Field name to update
            value: New value for the field
            
        Returns:
            Dict containing validation result for the field
            
        Raises:
            ValidationError: If field validation fails
        """
        try:
            # Store the value
            self.business_info[field] = value
            
            # Validate the field
            if isinstance(value, dict):
                value = json.dumps(value)
            
            validation_result = await self.validation_service.validate_field(
                field,
                str(value)
            )
            
            logger.info(f"Updated {field} for session {self.session_id}")
            return validation_result
            
        except Exception as e:
            logger.error(f"Error updating {field}: {str(e)}")
            raise ValidationError(f"Failed to update {field}: {str(e)}", field)
    
    async def advance_step(self) -> Dict[str, Any]:
        """Attempt to advance to the next assessment step.
        
        Returns:
            Dict containing step transition result
            
        Raises:
            ValidationError: If current step validation fails
        """
        # Validate current step
        validation_results = await self.validate_current_step()
        
        if not validation_results['is_valid']:
            return {
                'success': False,
                'current_step': self.current_step['id'],
                'validation_results': validation_results,
                'error': 'Current step validation failed'
            }
        
        # Check if we're at the last step
        if self.current_step_index >= len(self.STEPS) - 1:
            self.completed_at = datetime.now()
            return {
                'success': True,
                'is_complete': True,
                'validation_results': validation_results
            }
        
        # Advance to next step
        self.current_step_index += 1
        
        return {
            'success': True,
            'current_step': self.current_step['id'],
            'validation_results': validation_results
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert assessment context to dictionary for serialization."""
        return {
            'session_id': self.session_id,
            'started_at': self.started_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'current_step_index': self.current_step_index,
            'business_info': self.business_info,
            'validation_status': self.validation_status
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any], validation_service: Optional[ValidationService] = None) -> 'AssessmentContext':
        """Create assessment context from dictionary.
        
        Args:
            data: Dictionary containing assessment context data
            validation_service: Optional validation service instance
            
        Returns:
            New AssessmentContext instance
        """
        context = cls(data['session_id'], validation_service)
        context.started_at = datetime.fromisoformat(data['started_at'])
        if data['completed_at']:
            context.completed_at = datetime.fromisoformat(data['completed_at'])
        context.current_step_index = data['current_step_index']
        context.business_info = data['business_info']
        context.validation_status = data['validation_status']
        
        return context 