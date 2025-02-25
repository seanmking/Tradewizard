"""Main Flask application for TradeKing Export Assessment."""

from flask import Flask, request, jsonify
from flask_cors import CORS
from services.chat_service import ChatService
import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, supports_credentials=True)

# Initialize services
chat_service = ChatService()

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat messages."""
    try:
        data = request.json
        message = data.get('message')
        
        if not message:
            return jsonify({'error': 'No message provided'}), 400
            
        # Process message through chat service
        response = chat_service.process_message(message)
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error processing chat message: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)