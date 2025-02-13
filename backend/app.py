"""
Simple Flask application for handling the assessment flow.
Manages sessions and routes requests to appropriate handlers.
"""
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from llm_service import get_llm_response, check_llm_health
from assessment_questions import get_question, QUESTIONS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Simple in-memory session storage
sessions = {}

def check_llm_on_startup():
    """Check LLM health when the app starts"""
    is_healthy, message = check_llm_health()
    if not is_healthy:
        app.logger.error(f"LLM Health Check Failed: {message}")
        # We'll continue running but log the error

# Run health check when app starts
with app.app_context():
    check_llm_on_startup()

@app.route('/')
def index():
    """Serve the main application page"""
    try:
        return render_template('index.html')
    except Exception as e:
        print(f"Error serving index.html: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/health')
def health_check():
    """Check if the LLM service is healthy"""
    is_healthy, message = check_llm_health()
    return jsonify({
        'status': 'healthy' if is_healthy else 'unhealthy',
        'message': message
    }), 200 if is_healthy else 503

@app.route('/api/start', methods=['POST'])
def start_assessment():
    """Start a new assessment session"""
    try:
        # Check LLM health before starting
        is_healthy, message = check_llm_health()
        if not is_healthy:
            return jsonify({
                'error': 'LLM service is not available',
                'details': message
            }), 503
        
        session_id = request.headers.get('X-Session-ID')
        if not session_id:
            return jsonify({'error': 'No session ID provided'}), 400
        
        # Initialize new session
        sessions[session_id] = {
            'current_index': 0,
            'context': {}
        }
        
        # Return first question
        first_q = get_question(0)
        return jsonify({
            'question': first_q['text'],
            'question_id': first_q['id']
        })
    except Exception as e:
        print(f"Error starting assessment: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/respond', methods=['POST'])
def handle_response():
    """Process a user's response and return the next question"""
    try:
        # Check LLM health before processing response
        is_healthy, message = check_llm_health()
        if not is_healthy:
            return jsonify({
                'error': 'LLM service is not available',
                'details': message
            }), 503
        
        # Validate session
        session_id = request.headers.get('X-Session-ID')
        if not session_id or session_id not in sessions:
            return jsonify({'error': 'Invalid session'}), 400
        
        # Get message from request
        message = request.json.get('message', '').strip()
        if not message:
            return jsonify({'error': 'Empty message'}), 400
        
        # Get current session state
        session = sessions[session_id]
        
        # Process response
        result = get_llm_response(
            message=message,
            current_index=session['current_index'],
            context=session['context']
        )
        
        # Update session if response was valid
        if result['complete']:
            session['context'].update(result['context_updates'])
            session['current_index'] += 1
        
        return jsonify({
            'message': result['response'],
            'progress': (session['current_index'] / len(QUESTIONS)) * 100
        })
    except Exception as e:
        print(f"Error handling response: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)  # Changed host to 0.0.0.0 