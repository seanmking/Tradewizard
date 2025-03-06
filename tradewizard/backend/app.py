#!/usr/bin/env python
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import sys
import importlib

# Add the project root to the path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))  # Go up two levels to project root
sys.path.insert(0, project_root)

# Try different import methods
try:
    # Method 1: Try direct module import
    from tradewizard.backend.services.assessment_flow import AssessmentFlowService
    from tradewizard.backend.api.user import user_bp
    print("Successfully imported with package prefix")
except ImportError as e:
    print(f"Import with package prefix failed: {e}")
    try:
        # Method 2: Try relative imports
        from services.assessment_flow import AssessmentFlowService
        from api.user import user_bp
        print("Successfully imported with direct imports")
    except ImportError as e:
        print(f"Direct imports failed: {e}")
        
        # Method 3: Manual import
        print("Attempting manual module import...")
        
        # Manually add the backend directory to the path
        backend_dir = current_dir
        sys.path.insert(0, backend_dir)
        
        # Import the modules manually
        spec = importlib.util.find_spec('services.assessment_flow', [backend_dir])
        if not spec:
            raise ImportError(f"Could not find services.assessment_flow in {backend_dir}")
        
        assessment_flow = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(assessment_flow)
        AssessmentFlowService = assessment_flow.AssessmentFlowService
        
        spec = importlib.util.find_spec('api.user', [backend_dir])
        if not spec:
            raise ImportError(f"Could not find api.user in {backend_dir}")
        
        user_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(user_module)
        user_bp = user_module.user_bp
        
        print("Successfully imported with manual import")

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize services
print("Initializing AssessmentFlowService...")
assessment_flow_service = AssessmentFlowService()
print("AssessmentFlowService initialized successfully")

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api/user')

@app.route('/api/assessment/initial-question', methods=['GET'])
def get_initial_question():
    """Get the initial question for the assessment flow"""
    try:
        initial_question = assessment_flow_service.get_initial_question()
        return jsonify(initial_question)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/assessment/process-response', methods=['POST'])
def process_response():
    """Process a response from the user in the assessment flow"""
    try:
        # Get the request data
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        step_id = data.get('step_id')
        user_response = data.get('response')
        user_data = data.get('user_data', {})
        
        if not step_id:
            return jsonify({"error": "Missing step_id parameter"}), 400
        if not user_response:
            return jsonify({"error": "Missing response parameter"}), 400
            
        print(f"Processing response for step {step_id}: {user_response[:50]}...")
        
        # Process the response
        result = assessment_flow_service.process_response(step_id, user_response, user_data)
        
        # Ensure we always have the basic structure to prevent frontend errors
        if 'user_data' not in result:
            result['user_data'] = {}
            
        # Ensure next_step is a string or has required properties
        if 'next_step' in result and isinstance(result['next_step'], dict):
            if 'id' not in result['next_step']:
                result['next_step']['id'] = 'unknown'
            if 'prompt' not in result['next_step']:
                result['next_step']['prompt'] = ''
                
        # Add a response field if missing
        if 'response' not in result:
            if 'next_step' in result and isinstance(result['next_step'], dict):
                result['response'] = result['next_step'].get('prompt', '')
            else:
                result['response'] = ''
        
        print(f"Returning result: {json.dumps(result, indent=2)[:200]}...")
        return jsonify(result)
    except Exception as e:
        import traceback
        print(f"Error processing response: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            "error": str(e),
            "user_data": {},
            "next_step": "error",
            "response": "I'm sorry, I encountered an error processing your request. Please try again."
        }), 500

@app.route('/api/chat/start', methods=['POST'])
def start_chat():
    """Create a new chat session"""
    try:
        user_data = request.json
        chat_id = assessment_flow_service.create_chat_session(user_data.get('user_id', 'anonymous'))
        
        # Get the initial question
        initial_question = assessment_flow_service.get_initial_question()
        
        return jsonify({
            "chat_id": chat_id,
            "message": "Chat session created successfully",
            "current_step": "initial",
            "question": initial_question.get("question")
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat/message', methods=['POST'])
def send_message():
    """Process a message in a chat session"""
    try:
        data = request.json
        chat_id = data.get('chat_id')
        message = data.get('message')
        
        if not chat_id or not message:
            return jsonify({"error": "Missing required fields"}), 400
        
        # Process the message
        result = assessment_flow_service.process_message(chat_id, message)
        
        # Structure the response to match frontend expectations
        response = {
            "chat_id": chat_id,
            "response": {
                "response": result.get('response'),
                "current_step": result.get('current_step'),
                "completed_steps": result.get('completed_steps', []),
                "progress": {
                    "completed": len(result.get('completed_steps', [])),
                    "total": len(assessment_flow_service.assessment_flow)
                },
                "extracted_info": result.get('extracted_info', {})
            }
        }
        
        return jsonify(response), 200
    except Exception as e:
        import traceback
        print(f"Error processing message: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat/history/<chat_id>', methods=['GET'])
def get_chat_history(chat_id):
    """Get the conversation history for a chat session"""
    try:
        history = assessment_flow_service.get_chat_history(chat_id)
        return jsonify({"chat_id": chat_id, "history": history}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    print("Starting Flask app on port 5002...")
    app.run(debug=True, port=5002)
