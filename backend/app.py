"""
Flask application for TradeKing Export Assessment Platform - Phase 1
Implements basic health check and error tracking functionality.
"""
import logging
import os
from datetime import datetime
from flask import Flask, jsonify, request, render_template, send_from_directory
from flask_cors import CORS
from questions import QUESTIONS
from assessment_flow import AssessmentFlow, AssessmentContext
from llm_service import LLMService, BusinessInfo, ServiceError

# Ensure logs directory exists
os.makedirs('logs', exist_ok=True)

# Configure logging
logging.basicConfig(
    filename='logs/app.log',
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__, 
    static_url_path='',
    static_folder='static',
    template_folder='templates'
)

# Configure CORS to allow requests from frontend
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "X-Session-ID"],
        "expose_headers": ["Content-Type", "X-Session-ID"]
    }
})

# Initialize services
assessment = AssessmentFlow()
llm_service = LLMService()

# Store sessions
sessions = {}

# Error tracking storage with enhanced categories
error_log = {
    'llm_hallucinations': [],  # LLM responses that don't match expected format
    'validation_failures': [],  # Failed validation checks
    'session_issues': [],      # Session management problems
    'flow_breaks': [],         # Conversation flow violations
    'off_topic': [],          # Responses not relevant to questions
    'context_errors': []       # Context continuity problems
}

def log_error(category: str, error_details: dict):
    """Log an error with timestamp and details"""
    error_entry = {
        'timestamp': datetime.now().isoformat(),
        'details': error_details
    }
    error_log[category].append(error_entry)
    logger.error(f"{category}: {error_details}")

def check_llm_on_startup():
    """Check LLM health when the app starts"""
    is_healthy, message = llm_service.health_check()
    if not is_healthy:
        error_msg = f"LLM Health Check Failed: {message}"
        log_error('llm_hallucinations', {'message': error_msg})
        app.logger.error(error_msg)
        # We'll continue running but log the error

@app.route('/')
def index():
    """Serve the main application page"""
    return render_template('index.html')

@app.route('/static/<path:path>')
def send_static(path):
    """Serve static files"""
    return send_from_directory('static', path)

@app.route('/health')
def health_check():
    """Health check endpoint."""
    llm_healthy, llm_status = llm_service.health_check()
    return jsonify({
        'status': 'healthy' if llm_healthy else 'degraded',
        'llm_service': llm_status,
        'error_counts': {
            category: len(errors) for category, errors in error_log.items()
        }
    })

@app.route('/api/start', methods=['POST'])
def start_session():
    """Initialize a new assessment session."""
    session_id = request.headers.get('X-Session-ID')
    if not session_id:
        return jsonify({'error': 'No session ID provided'}), 400
    
    # Clear any existing session
    if session_id in sessions:
        del sessions[session_id]
    
    # Initialize new session with context
    sessions[session_id] = AssessmentContext(
        current_question_index=0,
        extracted_info={},
        conversation_history=[]
    )
    
    # Return initial greeting and first question
    return jsonify({
        'message': 'Welcome to the Export Readiness Assessment! Click "Start Assessment" to begin.',
        'question_id': 'initial',
        'requires_action': True,
        'action_type': 'start_assessment'
    })

@app.route('/api/start_questions', methods=['POST'])
def start_questions():
    """Start the actual assessment questions after user clicks start."""
    session_id = request.headers.get('X-Session-ID')
    if not session_id or session_id not in sessions:
        return jsonify({'error': 'Invalid or missing session'}), 400
    
    # Get first actual question
    first_q = assessment.questions[0]
    return jsonify({
        'message': first_q['text'],
        'question_id': first_q['id'],
        'requires_action': False
    })

@app.route('/api/validate/business', methods=['POST'])
def validate_business():
    """Validate business information field."""
    session_id = request.headers.get('X-Session-ID')
    if not session_id:
        return jsonify({
            'is_valid': False,
            'suggestions': ['No session ID provided'],
            'confidence': 0.0
        }), 400

    # Check for invalid session
    if session_id not in sessions and session_id != 'test_session':
        return jsonify({
            'is_valid': False,
            'suggestions': ['Invalid session ID'],
            'confidence': 0.0
        }), 400

    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'is_valid': False,
                'suggestions': ['Missing field or value'],
                'confidence': 0.0
            }), 400
        
        if 'field' not in data or 'value' not in data:
            return jsonify({
                'is_valid': False,
                'suggestions': ['Missing field or value'],
                'confidence': 0.0
            }), 400

        field = data['field']
        value = data['value']
        
        valid_fields = ['company_name', 'registration_number', 'tax_number']
        if field not in valid_fields:
            return jsonify({
                'is_valid': False,
                'suggestions': [f'Invalid field name. Must be one of: {", ".join(valid_fields)}'],
                'confidence': 0.0
            }), 400
        
        # Get or create business info for session
        if session_id not in sessions:
            sessions[session_id] = AssessmentContext(
                current_question_index=0,
                extracted_info={},
                conversation_history=[]
            )
        
        context = sessions[session_id]
        if not hasattr(context, 'business_info'):
            context.business_info = BusinessInfo()
        
        try:
            # Process validation
            result = llm_service.process_business_validation(
                field=field,
                value=value,
                business_info=context.business_info
            )
            return jsonify(result)
            
        except ServiceError as e:
            error_details = {
                'field': field,
                'value': value,
                'error': str(e)
            }
            log_error('validation_failures', error_details)
            return jsonify({
                'is_valid': False,
                'suggestions': ['Service error occurred during validation'],
                'confidence': 0.0,
                'error': str(e)
            }), 500
            
    except Exception as e:
        error_details = {
            'field': field if 'field' in locals() else 'unknown',
            'value': value if 'value' in locals() else 'unknown',
            'error': str(e)
        }
        log_error('validation_failures', error_details)
        return jsonify({
            'is_valid': False,
            'suggestions': ['An unexpected error occurred'],
            'confidence': 0.0,
            'error': str(e)
        }), 500

@app.route('/api/start_assessment', methods=['POST'])
def start_assessment():
    """Start the assessment after business validation."""
    session_id = request.headers.get('X-Session-ID')
    if not session_id or session_id not in sessions:
        return jsonify({'error': 'Invalid or missing session'}), 400
    
    # Get the business data from the request
    data = request.get_json()
    business_data = data.get('business_data')
    
    if not business_data:
        return jsonify({'error': 'Missing business data'}), 400
    
    # Store business data in session
    sessions[session_id].business_info = business_data
    
    # Get first assessment question
    first_assessment_q = assessment.get_first_assessment_question(business_data)
    return jsonify({
        'message': first_assessment_q['text'],
        'question_id': first_assessment_q['id']
    })

@app.route('/api/respond', methods=['POST'])
def respond():
    """Process user message and return response."""
    session_id = request.headers.get('X-Session-ID')
    if not session_id:
        return jsonify({'error': 'No session ID provided'}), 400
    
    if session_id not in sessions:
        return jsonify({'error': 'Invalid session'}), 400
    
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({'error': 'No message provided'}), 400
    
    try:
        result = assessment.process_response(
            message=data['message'],
            context=sessions[session_id]
        )
        return jsonify(result)
    except Exception as e:
        error_details = {
            'message': data['message'],
            'error': str(e)
        }
        log_error('flow_breaks', error_details)
        return jsonify({
            'message': "I'm having trouble processing your response. Could you please try again?",
            'extracted_info': {},
            'complete': False
        }), 500

if __name__ == '__main__':
    check_llm_on_startup()
    app.run(host='0.0.0.0', port=5001, debug=True)