"""
AI Agent API endpoints for TradeWizard.
This module provides Flask routes for interacting with the streamlined AI Agent.
"""

from flask import Blueprint, request, jsonify
import sys
import os
import json
from datetime import datetime

# Add the aiagent directory to the path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
aiagent_dir = os.path.join(backend_dir, 'aiagent')
sys.path.insert(0, aiagent_dir)

# Import the AI Agent
try:
    from agent.streamlined_core import StreamlinedAgentCore
    from database.connection import Database
    print("Successfully imported AI Agent from symbolic link")
except ImportError as e:
    print(f"Failed to import AI Agent from symbolic link: {e}")
    try:
        # Try importing from the project root
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(backend_dir)))
        sys.path.insert(0, project_root)
        from src.agent.streamlined_core import StreamlinedAgentCore
        from src.database.connection import Database
        print("Successfully imported AI Agent from project root")
    except ImportError as e:
        print(f"Failed to import AI Agent from project root: {e}")
        # Fallback to a mock implementation
        class StreamlinedAgentCore:
            def __init__(self, db):
                self.db = db
                self.initialized = False
            
            async def initialize(self):
                self.initialized = True
                return True
            
            async def handleRequest(self, request):
                return {
                    "success": True,
                    "message": "Mock AI Agent response",
                    "data": {"mock": True}
                }
        
        class Database:
            async def connect(self):
                return True

# Create a blueprint for AI Agent routes
aiagent_bp = Blueprint('aiagent', __name__)

# Initialize the AI Agent
db = Database()
agent_core = StreamlinedAgentCore(db)
initialized = False

@aiagent_bp.before_request
async def initialize_agent():
    global initialized
    if not initialized:
        await db.connect()
        await agent_core.initialize()
        initialized = True

@aiagent_bp.route('/assessment', methods=['POST'])
async def run_assessment():
    """
    Run an assessment using the AI Agent.
    
    Request body:
    {
        "businessId": "business-123",
        "data": {
            // Assessment data
        }
    }
    """
    try:
        data = request.json
        
        if not data or 'businessId' not in data:
            return jsonify({
                "success": False,
                "error": "Missing businessId in request"
            }), 400
        
        # Create a request for the AI Agent
        agent_request = {
            "businessId": data['businessId'],
            "type": "GET_BUSINESS_STATE",
            "data": data.get('data', {})
        }
        
        # Handle the request
        response = await agent_core.handleRequest(agent_request)
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@aiagent_bp.route('/market-report', methods=['POST'])
async def get_market_report():
    """
    Get a market report using the AI Agent.
    
    Request body:
    {
        "businessId": "business-123",
        "country": "Germany"
    }
    """
    try:
        data = request.json
        
        if not data or 'businessId' not in data or 'country' not in data:
            return jsonify({
                "success": False,
                "error": "Missing businessId or country in request"
            }), 400
        
        # Create a request for the AI Agent
        agent_request = {
            "businessId": data['businessId'],
            "type": "GET_MARKET_REPORT",
            "data": {
                "country": data['country']
            }
        }
        
        # Handle the request
        response = await agent_core.handleRequest(agent_request)
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@aiagent_bp.route('/timeline', methods=['POST'])
async def get_timeline():
    """
    Get a timeline using the AI Agent.
    
    Request body:
    {
        "businessId": "business-123",
        "country": "Germany"
    }
    """
    try:
        data = request.json
        
        if not data or 'businessId' not in data or 'country' not in data:
            return jsonify({
                "success": False,
                "error": "Missing businessId or country in request"
            }), 400
        
        # Create a request for the AI Agent
        agent_request = {
            "businessId": data['businessId'],
            "type": "GET_TIMELINE",
            "data": {
                "country": data['country']
            }
        }
        
        # Handle the request
        response = await agent_core.handleRequest(agent_request)
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@aiagent_bp.route('/update-profile', methods=['POST'])
async def update_profile():
    """
    Update a business profile using the AI Agent.
    
    Request body:
    {
        "businessId": "business-123",
        "profile": {
            // Profile data
        }
    }
    """
    try:
        data = request.json
        
        if not data or 'businessId' not in data or 'profile' not in data:
            return jsonify({
                "success": False,
                "error": "Missing businessId or profile in request"
            }), 400
        
        # Create a request for the AI Agent
        agent_request = {
            "businessId": data['businessId'],
            "type": "UPDATE_BUSINESS_PROFILE",
            "data": data['profile']
        }
        
        # Handle the request
        response = await agent_core.handleRequest(agent_request)
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@aiagent_bp.route('/select-market', methods=['POST'])
async def select_market():
    """
    Select a target market using the AI Agent.
    
    Request body:
    {
        "businessId": "business-123",
        "country": "Germany"
    }
    """
    try:
        data = request.json
        
        if not data or 'businessId' not in data or 'country' not in data:
            return jsonify({
                "success": False,
                "error": "Missing businessId or country in request"
            }), 400
        
        # Create a request for the AI Agent
        agent_request = {
            "businessId": data['businessId'],
            "type": "SELECT_TARGET_MARKET",
            "data": {
                "country": data['country']
            }
        }
        
        # Handle the request
        response = await agent_core.handleRequest(agent_request)
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@aiagent_bp.route('/compare-markets', methods=['POST'])
async def compare_markets():
    """
    Compare markets using the AI Agent.
    
    Request body:
    {
        "businessId": "business-123",
        "countries": ["Germany", "France", "United Kingdom"]
    }
    """
    try:
        data = request.json
        
        if not data or 'businessId' not in data or 'countries' not in data:
            return jsonify({
                "success": False,
                "error": "Missing businessId or countries in request"
            }), 400
        
        # Create a request for the AI Agent
        agent_request = {
            "businessId": data['businessId'],
            "type": "COMPARE_MARKETS",
            "data": {
                "countries": data['countries']
            }
        }
        
        # Handle the request
        response = await agent_core.handleRequest(agent_request)
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@aiagent_bp.route('/notifications', methods=['GET'])
async def get_notifications():
    """
    Get notifications using the AI Agent.
    
    Query parameters:
    - businessId: The business ID
    - unreadOnly: Whether to get only unread notifications (optional)
    - limit: The maximum number of notifications to return (optional)
    """
    try:
        business_id = request.args.get('businessId')
        unread_only = request.args.get('unreadOnly', 'false').lower() == 'true'
        limit = request.args.get('limit', 50)
        
        if not business_id:
            return jsonify({
                "success": False,
                "error": "Missing businessId in request"
            }), 400
        
        # Create a request for the AI Agent
        agent_request = {
            "businessId": business_id,
            "type": "GET_NOTIFICATIONS",
            "data": {
                "unreadOnly": unread_only,
                "limit": int(limit)
            }
        }
        
        # Handle the request
        response = await agent_core.handleRequest(agent_request)
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500 