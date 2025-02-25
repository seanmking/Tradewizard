from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from services.trade_assessment_service import TradeAssessmentService

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize service
assessment_service = TradeAssessmentService()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "TradeKing API is running"}), 200

@app.route('/api/chat/start', methods=['POST'])
def start_chat():
    try:
        user_data = request.json
        chat_id = assessment_service.create_chat_session(user_data.get('user_id'))
        return jsonify({
            "chat_id": chat_id,
            "message": "Chat session created successfully",
            "current_step": "introduction"
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat/message', methods=['POST'])
def send_message():
    try:
        data = request.json
        chat_id = data.get('chat_id')
        message = data.get('message')
        user_id = data.get('user_id')
        
        if not all([chat_id, message, user_id]):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Process message through assessment service
        result = assessment_service.process_message(chat_id, message)
        
        # Structure the response to match frontend expectations
        response = {
            "chat_id": chat_id,
            "response": {
                "response": result.get('response'),  # The actual message
                "current_step": result.get('current_step'),
                "completed_steps": result.get('completed_steps', []),
                "progress": {
                    "completed": len(result.get('completed_steps', [])),
                    "total": 4  # Total number of steps in the assessment
                },
                "extracted_info": result.get('extracted_info', {}),
                "should_show_verification_form": result.get('should_show_verification_form', False)
            }
        }
        
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat/history/<chat_id>', methods=['GET'])
def get_chat_history(chat_id):
    try:
        history = assessment_service.get_chat_history(chat_id)
        return jsonify({"chat_id": chat_id, "history": history}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
