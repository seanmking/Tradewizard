from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from services.llm_service import LLMService
from services.chat_service import ChatService

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize services
llm_service = LLMService()
chat_service = ChatService()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "TradeKing API is running"}), 200

@app.route('/api/chat/start', methods=['POST'])
def start_chat():
    try:
        user_data = request.json
        chat_id = chat_service.create_chat_session(user_data.get('user_id'))
        return jsonify({"chat_id": chat_id, "message": "Chat session created successfully"}), 201
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
        
        # Process message through LLM service
        response = llm_service.process_message(message, chat_id)
        
        # Store the message and response in chat history
        chat_service.add_message(chat_id, user_id, message, response)
        
        return jsonify({
            "chat_id": chat_id,
            "response": response
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat/history/<chat_id>', methods=['GET'])
def get_chat_history(chat_id):
    try:
        history = chat_service.get_chat_history(chat_id)
        return jsonify({"chat_id": chat_id, "history": history}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
