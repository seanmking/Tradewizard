from flask import Blueprint, request, jsonify, session
from services.assessment_service import AssessmentService

assessment_bp = Blueprint('assessment', __name__, url_prefix='/api/assessment')
assessment_service = AssessmentService()

@assessment_bp.route('/start', methods=['POST'])
def start_assessment():
    """Start a new assessment session."""
    try:
        # Generate session ID if not exists
        if 'session_id' not in session:
            session['session_id'] = f"session_{hash(request.remote_addr)}"
        
        # Start assessment session
        session_data = assessment_service.start_session()
        return jsonify(session_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@assessment_bp.route('/validate', methods=['POST'])
def validate_field():
    """Validate user input and provide next steps."""
    data = request.json
    field = data.get('field')
    value = data.get('value')
    
    if not field or value is None:
        return jsonify({
            'is_valid': False,
            'message': 'Missing field or value',
            'errors': ['Required fields are missing']
        }), 400
        
    try:
        # Validate field and get response
        result = assessment_service.validate_field(field, value)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'is_valid': False,
            'message': 'An error occurred during validation',
            'errors': [str(e)]
        }), 500

@assessment_bp.route('/next', methods=['POST'])
def next_step():
    """Advance to next assessment step."""
    try:
        # Get next step data
        result = assessment_service.next_step()
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'An error occurred while advancing to next step',
            'errors': [str(e)]
        }), 500

@assessment_bp.route('/progress', methods=['GET'])
def get_progress():
    """Get current assessment progress."""
    try:
        # Get current progress from service
        progress = {
            'current_step': assessment_service.current_step,
            'business_info': assessment_service.business_info,
            'validation_errors': assessment_service.validation_errors
        }
        return jsonify(progress)
    except Exception as e:
        return jsonify({'error': str(e)}), 500 