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
        "origins": ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "X-Session-ID"]
    }
})

# Initialize assessment flow
assessment = AssessmentFlow()

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
    is_healthy, message = assessment.llm_service.health_check()
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

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    llm_healthy, llm_message = assessment.llm_service.health_check()
    
    if not llm_healthy:
        return jsonify({
            'status': 'error',
            'message': llm_message
        }), 503
    
    return jsonify({
        'status': 'healthy',
        'message': 'Service is running'
    })

@app.route('/api/start', methods=['POST'])
def start_assessment():
    session_id = request.headers.get('X-Session-ID')
    if not session_id:
        return jsonify({'error': 'No session ID provided'}), 400
    
    # Initialize new session with context
    sessions[session_id] = AssessmentContext(
        current_question_index=0,
        extracted_info={},
        conversation_history=[]
    )
    
    # Return first question
    first_q = assessment.questions[0]
    return jsonify({
        'question': first_q['text'],
        'question_id': first_q['id']
    })

@app.route('/api/respond', methods=['POST'])
def handle_response():
    try:
        session_id = request.headers.get('X-Session-ID')
        if not session_id or session_id not in sessions:
            return jsonify({'error': 'Invalid session'}), 400
        
        message = request.json.get('message', '').strip()
        if not message:
            return jsonify({'error': 'Empty message'}), 400
        
        context = sessions[session_id]
        
        # Process response using assessment flow
        result = assessment.process_response(message, context)
        
        # Return response with proper format
        return jsonify({
            'message': result['message'],  # Use the message directly from the LLM response
            'progress': (context.current_question_index / len(assessment.questions)) * 100,
            'complete': result['complete']
        })
        
    except Exception as e:
        logger.error(f"Error processing response: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': "I apologize, but I'm having trouble processing that response. Could you please try again?"
        }), 500

if __name__ == '__main__':
    check_llm_on_startup()
    app.run(host='0.0.0.0', port=5001, debug=True)