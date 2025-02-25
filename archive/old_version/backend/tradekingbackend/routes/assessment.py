"""Assessment API routes for business validation process."""

from flask import Blueprint, request, jsonify, session
from typing import Dict, Any
import logging
from ..services.assessment_flow import AssessmentContext, ValidationError
from ..services.validation_service import ValidationService
from ...questions import QUESTIONS, format_question  # Import questions from the correct location
from ..services.llm_service import LLMService

# Configure logger
logger = logging.getLogger(__name__)

# Create blueprint
assessment_bp = Blueprint('assessment', __name__, url_prefix='/api/assessment')

# Initialize services
validation_service = ValidationService()
llm_service = LLMService()  # Add LLM service initialization

def get_or_create_context() -> AssessmentContext:
    """Get existing assessment context or create new one."""
    if 'assessment_context' not in session:
        # Create new context using session ID from session
        context = AssessmentContext(
            session.get('session_id'),
            validation_service=validation_service
        )
        # Store in session
        session['assessment_context'] = context.to_dict()
        return context
    
    # Load existing context
    return AssessmentContext.from_dict(
        session['assessment_context'],
        validation_service=validation_service
    )

def save_context(context: AssessmentContext) -> None:
    """Save assessment context to session."""
    session['assessment_context'] = context.to_dict()
    session.modified = True

@assessment_bp.route('/start', methods=['POST'])
def start_assessment() -> Dict[str, Any]:
    """Start new assessment session.
    
    Returns:
        Dict containing session info and first step
    """
    try:
        if 'session_id' not in session:
            logger.error("No session ID found in request")
            return jsonify({
                'error': 'No session ID provided',
                'message': 'Please provide a session ID in X-Session-ID header'
            }), 400
            
        # Create new context
        context = get_or_create_context()
        
        response = {
            'session_id': session['session_id'],
            'current_step': context.current_step,
            'progress': context.progress
        }
        
        save_context(context)
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error starting assessment: {str(e)}")
        return jsonify({
            'error': 'Failed to start assessment',
            'message': str(e)
        }), 500

@assessment_bp.route('/validate', methods=['POST'])
async def validate_field() -> Dict[str, Any]:
    """Validate a single field.
    
    Returns:
        Dict containing validation result
    """
    try:
        data = request.get_json()
        if not data or 'field' not in data or 'value' not in data:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'Request must include field and value'
            }), 400
        
        context = get_or_create_context()
        
        # Validate field
        result = await context.update_business_info(
            data['field'],
            data['value']
        )
        
        save_context(context)
        return jsonify(result), 200
        
    except ValidationError as e:
        return jsonify({
            'error': 'Validation failed',
            'message': str(e),
            'field': e.field,
            'details': e.details
        }), 400
    except Exception as e:
        logger.error(f"Error validating field: {str(e)}")
        return jsonify({
            'error': 'Validation failed',
            'message': str(e)
        }), 500

@assessment_bp.route('/step/validate', methods=['POST'])
async def validate_step() -> Dict[str, Any]:
    """Validate all fields in current step.
    
    Returns:
        Dict containing validation results
    """
    try:
        context = get_or_create_context()
        
        # Validate current step
        results = await context.validate_current_step()
        
        save_context(context)
        return jsonify(results), 200
        
    except Exception as e:
        logger.error(f"Error validating step: {str(e)}")
        return jsonify({
            'error': 'Step validation failed',
            'message': str(e)
        }), 500

@assessment_bp.route('/step/next', methods=['POST'])
async def next_step() -> Dict[str, Any]:
    """Advance to next assessment step.
    
    Returns:
        Dict containing next step info
    """
    try:
        context = get_or_create_context()
        
        # Try to advance
        result = await context.advance_step()
        
        if not result['success']:
            return jsonify({
                'error': 'Cannot advance step',
                'message': result['error'],
                'validation_results': result['validation_results']
            }), 400
        
        response = {
            'success': True,
            'current_step': context.current_step,
            'progress': context.progress,
            'is_complete': context.is_complete
        }
        
        save_context(context)
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error advancing step: {str(e)}")
        return jsonify({
            'error': 'Failed to advance step',
            'message': str(e)
        }), 500

@assessment_bp.route('/progress', methods=['GET'])
async def get_progress() -> Dict[str, Any]:
    """Get current assessment progress.
    
    Returns:
        Dict containing progress info
    """
    try:
        context = get_or_create_context()
        
        response = {
            'current_step': context.current_step,
            'progress': context.progress,
            'business_info': context.business_info,
            'validation_status': context.validation_status
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error getting progress: {str(e)}")
        return jsonify({
            'error': 'Failed to get progress',
            'message': str(e)
        }), 500

@assessment_bp.route('/start_questions', methods=['POST'])
def start_questions() -> Dict[str, Any]:
    """Start the assessment questions.
    
    Returns:
        Dict containing first question and session info
    """
    try:
        context = get_or_create_context()
        
        # Initialize the question index and clear any previous responses
        context.business_info = {}
        context.business_info['current_question_index'] = 0
        
        # Get the first question from questions.py
        first_question = QUESTIONS[0]
        
        # Format the question with any available context
        message = format_question(first_question, context.business_info)
        
        response = {
            'message': message,
            'current_step': first_question,
            'progress': context.progress,
            'session_id': session.get('session_id')
        }
        
        save_context(context)
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error starting questions: {str(e)}")
        return jsonify({
            'error': 'Failed to start questions',
            'message': str(e)
        }), 500

@assessment_bp.route('/respond', methods=['POST'])
def respond() -> Dict[str, Any]:
    """Handle user response to a question.
    
    Returns:
        Dict containing next question or completion message
    """
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({
                'error': 'Missing message in request',
                'message': 'Please provide a message in your request'
            }), 400
            
        context = get_or_create_context()
        current_question_index = context.business_info.get('current_question_index', 0)
        
        # Get current question
        if current_question_index >= len(QUESTIONS):
            return jsonify({
                'message': "Thank you for providing all that information. Let's proceed with the assessment.",
                'is_complete': True
            }), 200
            
        current_question = QUESTIONS[current_question_index]
        user_message = data['message']
        
        logger.info(f"Processing response for question {current_question['id']}")
        logger.info(f"User message: {user_message}")
        
        # Extract information from the response based on the current question
        if current_question['id'] == 'personal_introduction':
            prompt = f"""
            Extract information from this response: "{user_message}"
            Consider all possible formats:
            - Full response with commas: "Name, Role, Business"
            - Just a name: "John Smith"
            - Natural language: "I'm John Smith, the CEO of Global Corp"
            
            Return JSON with:
            - found: what was found (name/role/business)
            - missing: what's still needed
            - message: natural conversational response asking for missing info
            """
            
            try:
                llm_response = llm_service.get_response(
                    prompt=prompt,
                    system_prompt="You are Sarah, a friendly export consultant. Help extract information and craft natural responses."
                )
                
                import json
                result = json.loads(llm_response)
                
                # Update context with any found information
                if 'name' in result.get('found', []):
                    name_parts = result['name'].split()
                    context.business_info['first_name'] = name_parts[0]
                    if len(name_parts) > 1:
                        context.business_info['last_name'] = name_parts[-1]
                        
                if 'role' in result.get('found', []):
                    context.business_info['role'] = result['role']
                    
                if 'business' in result.get('found', []):
                    context.business_info['full_business_name'] = result['business']
                    # Clean business name for conversation
                    clean_name = result['business']
                    for suffix in [' PTY LTD', ' PTY', ' LTD', ' CC', ' NPC', ' SOC']:
                        if clean_name.upper().endswith(suffix):
                            clean_name = clean_name[:-len(suffix)].strip()
                    context.business_info['business_name'] = clean_name
                
                # If anything is missing, ask for it naturally
                if result.get('missing'):
                    return jsonify({
                        'error': 'Need more information',
                        'message': result['message']
                    }), 400
                    
            except Exception as e:
                logger.error(f"Error processing introduction: {str(e)}")
                # Even if parsing fails, try to give a helpful response
                return jsonify({
                    'error': 'Need more information',
                    'message': f"Hi {user_message.split()[0]}! Could you also tell me your role and the name of your business?"
                }), 400
            
        elif current_question['id'] == 'website_info':
            website_url = user_message.strip().lower()
            if not website_url:
                return jsonify({
                    'error': 'Missing website URL',
                    'message': f"I need your business website URL to proceed. This helps me understand more about {context.business_info.get('business_name', 'your business')}."
                }), 400
            
            # Add http:// if not present
            if not website_url.startswith(('http://', 'https://')):
                website_url = 'https://' + website_url
            
            # Basic URL validation
            try:
                from urllib.parse import urlparse
                parsed = urlparse(website_url)
                if not parsed.netloc:
                    return jsonify({
                        'error': 'Invalid website URL',
                        'message': f"Could you provide the complete website address? For example: www.{context.business_info.get('business_name', 'yourbusiness').lower().replace(' ', '')}.com"
                    }), 400
                    
                # Store the formatted website URL
                context.business_info['business_website'] = website_url
                
            except Exception as e:
                logger.error(f"URL parsing error: {str(e)}")
                return jsonify({
                    'error': 'Invalid website URL',
                    'message': "That doesn't look like a valid website URL. Please provide your complete website address including the domain (like .com, .co.za, .org, etc)."
                }), 400
            
        elif current_question['id'] == 'export_aspirations':
            # Use LLM to enhance export goals
            enhanced_goals = llm_service.enhance_export_goals(
                user_message,
                website_data=context.business_info.get('website_data')
            )
            
            context.business_info['export_goals'] = enhanced_goals
            context.business_info['original_export_goals'] = user_message
            
            # Extract target markets using LLM
            prompt = f"""
            Extract target markets from this export goal: "{user_message}"
            Format: JSON array of market names
            """
            
            markets_response = llm_service.get_response(
                prompt=prompt,
                system_prompt="You are a trade expert. Extract target markets from export goals."
            )
            
            try:
                import json
                target_markets = json.loads(markets_response)
                context.business_info['target_markets'] = target_markets
            except (json.JSONDecodeError, KeyError):
                # Fallback to storing raw response
                context.business_info['target_markets'] = user_message
        
        # Update question index
        next_question_index = current_question_index + 1
        context.business_info['current_question_index'] = next_question_index
        
        # Get next question if available
        if next_question_index < len(QUESTIONS):
            next_question = QUESTIONS[next_question_index]
            
            # Create format context with all necessary fields
            format_context = {
                'first_name': context.business_info.get('first_name', ''),  # Default to empty string instead of None
                'business_name': context.business_info.get('business_name', '')  # Default to empty string instead of None
            }
            logger.info(f"Format context: {format_context}")
            
            # Format the question
            message = format_question(next_question, format_context)
            logger.info(f"Formatted message: {message}")
            
            response = {
                'message': message,
                'current_step': next_question,
                'progress': context.progress,
                'is_complete': False
            }
        else:
            message = "Thank you for providing all that information. Let's proceed with the assessment."
            response = {
                'message': message,
                'is_complete': True,
                'progress': context.progress
            }
            
        # Log the final context state
        logger.info(f"Final business info: {context.business_info}")
        
        save_context(context)
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error processing response: {str(e)}")
        
        try:
            # Use LLM to handle the error gracefully
            error_prompt = f"""
            The user said: "{data.get('message', '')}"
            We encountered this error: {str(e)}
            Current question: {current_question['id'] if 'current_question' in locals() else 'unknown'}
            
            Craft a helpful, friendly response that:
            1. Acknowledges what they said
            2. Explains what we need in natural language
            3. Never mentions refreshing or technical errors
            4. Maintains Sarah's friendly consultant tone
            """
            
            error_response = llm_service.get_response(
                prompt=error_prompt,
                system_prompt="You are Sarah, a friendly export consultant. Help users when something goes wrong."
            )
            
            return jsonify({
                'error': 'Need more information',
                'message': error_response
            }), 400
            
        except Exception as llm_error:
            # Absolute worst case, fall back to a friendly default
            logger.error(f"Failed to get LLM error response: {llm_error}")
            first_name = data.get('message', '').split()[0] if data.get('message') else ''
            return jsonify({
                'error': 'Need more information',
                'message': f"Hi{f' {first_name}' if first_name else ''}! Could you please tell me your name, role, and business name?"
            }), 400 