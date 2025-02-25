"""Simplified assessment flow implementation."""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
from llm_service import LLMService
from questions import QUESTIONS, format_question

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

@dataclass
class AssessmentContext:
    """Manages the state and flow of the assessment process."""
    session_id: str
    current_question_index: int = 0
    business_info: BusinessInfo = field(default_factory=BusinessInfo)
    extracted_info: Dict[str, str] = field(default_factory=dict)
    conversation_history: List[Dict[str, str]] = field(default_factory=list)
    llm_service: LLMService = field(default_factory=LLMService)

    def get_current_question(self) -> Dict[str, str]:
        """Get the current question in the assessment flow."""
        if self.current_question_index < len(QUESTIONS):
            return format_question(
                QUESTIONS[self.current_question_index],
                self.extracted_info
            )
        return {"text": "Assessment complete", "field": None}

    def update_business_info(self, field: str, value: str) -> bool:
        """Update business information with validation."""
        if hasattr(self.business_info, field):
            setattr(self.business_info, field, value)
            # Validate the field
            result = self.llm_service.process_business_validation(
                field, value, self.business_info
            )
            return result.get('is_valid', False)
        return False

    def advance_question(self) -> bool:
        """Move to the next question if current one is complete."""
        if self.current_question_index < len(QUESTIONS):
            current_field = QUESTIONS[self.current_question_index].get('field')
            if current_field in self.business_info.validation_status:
                self.current_question_index += 1
                return True
        return False

    def get_validation_status(self) -> Dict[str, bool]:
        """Get the current validation status."""
        return self.business_info.validation_status

    def is_complete(self) -> bool:
        """Check if all required validations are complete."""
        required_fields = {'company_name', 'registration_number', 'tax_number'}
        return all(
            field in self.business_info.validation_status and
            self.business_info.validation_status[field]
            for field in required_fields
        ) 