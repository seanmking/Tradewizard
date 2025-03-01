from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from services.trade_assessment_service import TradeAssessmentService
from services.sidekick_service import SideKickService

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize services
assessment_service = TradeAssessmentService()
sidekick_service = SideKickService()

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

# SideKick API Endpoints
@app.route('/api/sidekick/analyze', methods=['POST'])
def analyze_company():
    try:
        data = request.json
        website_url = data.get('website_url')
        target_markets = data.get('target_markets', [])
        product_info = data.get('product_info')
        
        if not website_url:
            return jsonify({"error": "Website URL is required"}), 400
        
        if not target_markets:
            return jsonify({"error": "At least one target market is required"}), 400
        
        # Generate the "What We Think We Know" dashboard
        dashboard = sidekick_service.generate_what_we_know_dashboard(
            website_url=website_url,
            target_markets=target_markets,
            product_info=product_info
        )
        
        # Add a dashboard ID
        dashboard["dashboard_id"] = os.urandom(8).hex()
        
        return jsonify(dashboard), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/sidekick/verify', methods=['POST'])
def verify_information():
    try:
        data = request.json
        dashboard_id = data.get('dashboard_id')
        verified_info = data.get('verified_info')
        
        if not dashboard_id:
            return jsonify({"error": "Dashboard ID is required"}), 400
        
        if not verified_info:
            return jsonify({"error": "Verified information is required"}), 400
        
        # Update the dashboard with verified information
        result = sidekick_service.verify_dashboard_information(
            dashboard_id=dashboard_id,
            verified_info=verified_info
        )
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/sidekick/generate-plan', methods=['POST'])
def generate_export_plan():
    try:
        data = request.json
        dashboard_id = data.get('dashboard_id')
        
        if not dashboard_id:
            return jsonify({"error": "Dashboard ID is required"}), 400
        
        # Generate the export plan
        export_plan = sidekick_service.generate_export_plan(dashboard_id=dashboard_id)
        
        return jsonify(export_plan), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
