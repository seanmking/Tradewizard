"""
from dataclasses import dataclass
from typing import List, Callable, Any, Optional
from enum import Enum

class ValidationResult(Enum):
    VALID = "valid"
    INVALID = "invalid"
    NEEDS_CLARIFICATION = "needs_clarification"

@dataclass
class PipelineContext:
    """Contains all necessary data for pipeline processing"""
    message: str  # Original user message
    current_question: dict  # Current question being processed
    extracted_info: Any  # Information extracted from user message
    llm_response: str  # Response from LLM
    validation_result: ValidationResult = ValidationResult.VALID
    error_message: Optional[str] = None

class Pipeline:
    """Main pipeline class that processes responses through validation stages"""
    
    def __init__(self):
        self.stages: List[Callable[[PipelineContext], PipelineContext]] = []
    
    def add_stage(self, stage: Callable[[PipelineContext], PipelineContext]) -> None:
        """Add a new stage to the pipeline"""
        self.stages.append(stage)
    
    def process(self, context: PipelineContext) -> PipelineContext:
        """Process the context through all pipeline stages"""
        try:
            for stage in self.stages:
                context = stage(context)
                # If any stage marks the response as invalid, stop processing
                if context.validation_result != ValidationResult.VALID:
                    break
            return context
        except Exception as e:
            context.validation_result = ValidationResult.INVALID
            context.error_message = f"Pipeline error: {str(e)}"
            return context

# Validation Stages

def validate_single_question(context: PipelineContext) -> PipelineContext:
    """Ensure response contains only one question"""
    response = context.llm_response
    question_marks = response.count('?')
    
    # If multiple questions found, reformulate response
    if question_marks > 1:
        # Keep only the acknowledgment and the next question
        sentences = response.split('.')
        filtered_response = []
        question_found = False
        
        for sentence in sentences:
            if '?' in sentence:
                if not question_found:
                    filtered_response.append(sentence.strip())
                    question_found = True
            elif not question_found:
                filtered_response.append(sentence.strip())
        
        context.llm_response = '. '.join(filtered_response)
    
    return context

def remove_advice(context: PipelineContext) -> PipelineContext:
    """Remove any advice or suggestions from the response"""
    advice_patterns = [
        r"you might want to",
        r"you should",
        r"I recommend",
        r"consider",
        r"it would be good to",
        r"let's discuss",
        r"we can help",
        r"I can help"
    ]
    
    response = context.llm_response
    sentences = response.split('.')
    filtered_sentences = []
    
    for sentence in sentences:
        contains_advice = any(pattern in sentence.lower() for pattern in advice_patterns)
        if not contains_advice:
            filtered_sentences.append(sentence)
    
    context.llm_response = '. '.join(filtered_sentences)
    return context

def validate_response_format(context: PipelineContext) -> PipelineContext:
    """Ensure response follows required format"""
    response = context.llm_response
    
    # Response should acknowledge user's answer and ask next question
    if not response.strip():
        context.validation_result = ValidationResult.INVALID
        context.error_message = "Empty response"
        return context
    
    # Ensure response ends with a question (if not the final question)
    if context.current_question.get('is_final') is not True and '?' not in response:
        context.validation_result = ValidationResult.INVALID
        context.error_message = "Response missing next question"
    
    return context
""" 