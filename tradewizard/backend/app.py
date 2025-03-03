from flask import Flask, request, jsonify
from flask_cors import CORS
from services.assessment_flow import AssessmentFlowService
from api.user import user_bp

app = Flask(__name__)
CORS(app)

# Initialize services
assessment_flow_service = AssessmentFlowService()

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
def process_assessment_response():
    """Process a user response in the assessment flow"""
    try:
        data = request.json
        step_id = data.get('step_id')
        response = data.get('response')
        user_data = data.get('user_data', {})
        
        if not step_id or not response:
            return jsonify({"error": "Missing required parameters"}), 400
        
        result = assessment_flow_service.process_response(step_id, response, user_data)
        return jsonify(result)
    except Exception as e:
        import traceback
        print(f"Error processing response: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

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
    app.run(debug=True, port=5002)
