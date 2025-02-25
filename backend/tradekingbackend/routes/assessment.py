"""Assessment API routes for business validation process."""

from flask import Blueprint, request, jsonify, session
from typing import Dict, Any
import logging
from ..services.assessment_flow import AssessmentContext, ValidationError
from ..services.validation_service import ValidationService

# Configure logger
logger = logging.getLogger(__name__)

# Create blueprint
assessment_bp = Blueprint('assessment', __name__, url_prefix='/api/assessment')

# Initialize services
validation_service = ValidationService()

def get_or_create_context() -> AssessmentContext:
    """Get existing assessment context or create new one."""
    if 'assessment_context' not in session:
        # Create new context
        context = AssessmentContext(
            session.id,
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
async def start_assessment() -> Dict[str, Any]:
    """Start new assessment session.
    
    Returns:
        Dict containing session info and first step
    """
    try:
        # Create new context
        context = get_or_create_context()
        
        response = {
            'session_id': context.session_id,
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