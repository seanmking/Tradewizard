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
    contact_details: Dict[str, str] = field(default_factory=dict)
    validation_status: Dict[str, bool] = field(default_factory=dict)
    validation_errors: Dict[str, List[str]] = field(default_factory=dict)

    def validate_field(self, field_name: str, value: str) -> bool:
        """Validate a single field and update validation status."""
        # Basic validation rules - to be enhanced with actual API calls
        validation_rules = {
            'company_name': lambda x: x and len(x) >= 2,
            'registration_number': lambda x: x and len(x) >= 5,
            'tax_number': lambda x: x and len(x) >= 8,
            'contact_details': lambda x: isinstance(x, dict) and 'email' in x
        }
        
        is_valid = validation_rules.get(field_name, lambda x: True)(value)
        self.validation_status[field_name] = is_valid
        return is_valid

    def update_field(self, field_name: str, value: str) -> None:
        """Update a field and its validation status."""
        setattr(self, field_name, value)
        self.validate_field(field_name, value)

@dataclass
class AssessmentContext:
    """Stores the state of an assessment session."""
    current_question_index: int
    extracted_info: Dict[str, str]
    conversation_history: List[Dict]
    business_info: BusinessInfo = field(default_factory=BusinessInfo)

    def update_business_info(self, field_name: str, value: str) -> bool:
        """Update business information and validate it."""
        if hasattr(self.business_info, field_name):
            self.business_info.update_field(field_name, value)
            return self.business_info.validation_status.get(field_name, False)
        return False

    def get_validation_status(self) -> Dict[str, bool]:
        """Get the current validation status of all business fields."""
        return self.business_info.validation_status

    def get_validation_errors(self) -> Dict[str, List[str]]:
        """Get any validation errors for business fields."""
        return self.business_info.validation_errors

class AssessmentFlow:
    """Manages the simplified assessment flow and LLM interactions."""
    
    def __init__(self):
        self.llm_service = LLMService()
        self.questions = QUESTIONS
        
    def _build_prompt(self, message: str, context: AssessmentContext) -> str:
        """Build the prompt for LLM with conversation context."""
        current_q = self.questions[context.current_question_index]
        next_q = self.questions[context.current_question_index + 1] if context.current_question_index < len(self.questions) - 1 else None
        
        # Build conversation history
        history = "\n".join([
            f"Q: {h['question']['text']}\nA: {h['response']}"
            for h in context.conversation_history
        ])
        
        # Format next question with context if available
        next_question_text = "No more questions."
        if next_q:
            try:
                next_question_text = format_question(next_q, context.extracted_info)
            except KeyError:
                next_question_text = next_q['text']
        
        # Create the prompt
        prompt = f"""Previous conversation:
{history}

Current question: {current_q['text']}
User response: {message}

Extract the following information if present: {current_q.get('extract', [])}
Then provide a natural response and use EXACTLY the following question next: {next_question_text}

Format your response as JSON:
{{
    "extracted_info": {{extracted key-value pairs}},
    "message": "your response here"
}}"""
        
        return prompt

    def _get_system_prompt(self) -> str:
        """Get the system prompt for LLM."""
        return """You are a friendly export advisor helping businesses expand globally.
Keep responses concise and natural. Extract information accurately.
When extracting names, make sure to separate first_name and last_name correctly.
For example, from 'John Smith', first_name would be 'John' and last_name would be 'Smith'.
Always respond in valid JSON format with extracted_info and message fields.
The extracted_info should contain all requested fields, even if some are empty."""

    def process_response(self, message: str, context: AssessmentContext) -> Dict:
        """Process user response and return next interaction details."""
        # Build and send prompt to LLM
        prompt = self._build_prompt(message, context)
        response = self.llm_service.get_response(
            prompt=prompt,
            system_prompt=self._get_system_prompt()
        )
        
        if not response:
            return {
                'message': "I apologize, but I'm having trouble processing your response. Could you please try again?",
                'extracted_info': {},
                'complete': False
            }
        
        try:
            # Parse LLM response
            result = eval(response)  # Safe since we control the LLM prompt format
            
            # Update context with extracted info
            if result.get('extracted_info'):
                context.extracted_info.update(result['extracted_info'])
            
            # Add current exchange to conversation history
            current_q = self.questions[context.current_question_index]
            context.conversation_history.append({
                'question': current_q,
                'response': message,
                'extracted': result.get('extracted_info', {})
            })
            
            # Check if assessment is complete
            is_complete = context.current_question_index >= len(self.questions) - 1
            
            # If not complete, prepare for next question
            if not is_complete:
                context.current_question_index += 1
            
            return {
                'message': result['message'],
                'extracted_info': result.get('extracted_info', {}),
                'complete': is_complete
            }
            
        except Exception as e:
            print(f"Error processing LLM response: {str(e)}")
            return {
                'message': "I'm having trouble understanding. Could you please rephrase your response?",
                'extracted_info': {},
                'complete': False
            } 