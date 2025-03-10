#!/usr/bin/env python
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import json
import logging
import os
import sys
import importlib
from datetime import datetime
import traceback
import requests

# Add the project root to the path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))  # Go up two levels to project root
sys.path.insert(0, project_root)

# Add modules to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import application modules
# Fix the import paths to match the actual location
try:
    # Import directly from the export_intelligence package
    from export_intelligence.analysis import market_analysis, regulatory, timeline, resources
    from export_intelligence.assessment import assessment_workflow
    from export_intelligence.analysis.api import app as analysis_api_app
    print("Successfully imported from export_intelligence package")
except ImportError as e:
    print(f"Failed to import required modules from export_intelligence package: {e}")
    raise

# Set up logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Try different import methods
try:
    # Method 1: Try direct module import
    from tradewizard.backend.services.assessment_flow import AssessmentFlowService
    from tradewizard.backend.api.user import user_bp
    # Import the AI Agent blueprint
    from tradewizard.backend.api.aiagent import aiagent_bp
    print("Successfully imported with package prefix")
except ImportError as e:
    print(f"Import with package prefix failed: {e}")
    try:
        # Method 2: Try relative imports
        from services.assessment_flow import AssessmentFlowService
        from api.user import user_bp
        # Import the AI Agent blueprint
        from api.aiagent import aiagent_bp
        print("Successfully imported with direct imports")
    except ImportError as e:
        print(f"Direct imports also failed: {e}")
        # Method 3: Try absolute imports with sys.path
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'services')))
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'api')))
        
        from assessment_flow import AssessmentFlowService
        from user import user_bp
        # Import the AI Agent blueprint
        from aiagent import aiagent_bp
        print("Successfully imported with absolute imports")

# Initialize Flask app
app = Flask(__name__)

# Configure CORS with explicit options
CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"], "allow_headers": "*"}})

# Initialize services
print("Initializing AssessmentFlowService...")
assessment_flow_service = AssessmentFlowService()
print("AssessmentFlowService initialized successfully")

from services.market_intelligence import MarketIntelligenceService
market_intelligence_service = MarketIntelligenceService()

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api/user')
# Register the AI Agent blueprint
app.register_blueprint(aiagent_bp, url_prefix='/api/aiagent')

# Import analysis modules directly from export_intelligence
from export_intelligence.analysis import market_analysis, regulatory, timeline, resources
print("Successfully imported analysis modules from export_intelligence package")

# Now add a specific implementation of identify_market_trends if it doesn't exist
# This should be added before the @app.route functions
if not hasattr(market_analysis, 'identify_market_trends'):
    print("Adding identify_market_trends function as it wasn't found in the imported modules")
    def identify_market_trends(industry, markets):
        """
        Identify key market trends for the specified industry and markets.
        This is a fallback implementation when the actual function is not available.
        """
        # Default trends based on industry
        default_trends = {
            "Food": [
                "Growing demand for healthier options",
                "Increased interest in authentic ethnic cuisines",
                "Rising popularity of convenient, ready-to-eat meals"
            ],
            "Bakery": [
                "Premium artisanal products gaining market share",
                "Gluten-free and alternative grain products growing",
                "Demand for clean-label, minimal-ingredient baked goods"
            ],
            "Frozen Foods": [
                "Quality frozen foods increasing in popularity",
                "Sustainable packaging becoming important to consumers",
                "Premium frozen meal options expanding market share"
            ],
            "Snacks": [
                "Health-conscious snacking on the rise",
                "Protein-enriched options gaining popularity",
                "Cultural fusion flavors trending upward"
            ]
        }
        
        # Market-specific trends
        market_trends = {
            "United Kingdom": [
                "Post-Brexit regulatory changes affecting imports",
                "Strong demand for premium specialty foods",
                "Growing interest in sustainability and ethical sourcing"
            ],
            "United Arab Emirates": [
                "Expanding luxury food market in major cities",
                "Increasing demand for Halal-certified products",
                "Strong expatriate market seeking familiar home foods"
            ],
            "South Africa": [
                "Growing middle class seeking convenience foods",
                "Strong preference for local and familiar flavors",
                "Price sensitivity balanced with quality expectations"
            ]
        }
        
        # Combine industry and market trends
        trends = []
        
        # Add industry-specific trends
        industry_norm = industry.strip().title()
        if industry_norm in default_trends:
            trends.extend(default_trends[industry_norm])
        else:
            # Default to Food if industry not recognized
            trends.extend(default_trends["Food"])
        
        # Add market-specific trends
        for market in markets:
            market_norm = market.strip().title()
            if market_norm in market_trends:
                trends.extend(market_trends[market_norm])
        
        # Return unique trends, up to 5
        unique_trends = list(set(trends))
        return unique_trends[:5]
    
    # Add the function to the market_analysis module
    setattr(market_analysis, 'identify_market_trends', identify_market_trends)

@app.route('/api/assessment/initial-question', methods=['GET'])
def get_initial_question():
    """Get the initial question for the assessment flow."""
    try:
        # Get user data from query parameters or session
        user_data = {
            'name': request.args.get('name', 'there'),
            'company': request.args.get('company', 'your company'),
            'industry': request.args.get('industry', 'your industry')
        }
        
        # Log the request
        app.logger.debug(f"Getting initial question with user data: {user_data}")
        
        # Get the assessment service
        assessment_service = get_assessment_service()
        
        # Get the initial question with user data
        question = assessment_service.get_initial_question(user_data)
        
        # Return the question
        return jsonify({
            "success": True,
            "step_id": "initial",
            "question": question
        })
    except Exception as e:
        app.logger.error(f"Error getting initial question: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/assessment/process-response', methods=['POST', 'OPTIONS'])
def process_response():
    """Process a response from the user in the assessment flow"""
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
        
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
        response = jsonify(result)
        # Add explicit CORS headers
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        logger.error(f"Error processing response: {str(e)}")
        logger.error(traceback.format_exc())
        error_response = jsonify({
            "error": str(e),
            "user_data": {},
            "next_step": "error",
            "response": "I'm sorry, I encountered an error processing your request. Please try again."
        })
        error_response.headers.add('Access-Control-Allow-Origin', '*')
        return error_response, 500

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

@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health_check():
    """Health check endpoint"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
        
    try:
        # Check if assessment service is ready
        assessment_status = "ok" if assessment_flow_service else "not initialized"
        
        # Log the health check
        print(f"Health check requested and returning status: ok")
        
        response = jsonify({
            "status": "ok",
            "services": {
                "assessment": assessment_status
            },
            "timestamp": datetime.now().isoformat()
        })
        
        # Add explicit CORS headers
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        error_response = jsonify({
            "status": "error", 
            "error": str(e)
        })
        error_response.headers.add('Access-Control-Allow-Origin', '*')
        return error_response, 500

@app.route('/api/export-readiness', methods=['POST'])
def export_readiness_report_endpoint():
    """
    Generate a comprehensive export readiness report for a specific market.
    
    Request JSON:
    {
        "userData": Object with user and business data,
        "market": String representing target market,
        "markets": Optional array of markets for batch processing
    }
    
    Returns:
    JSON with export readiness report data
    """
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        user_data = data.get('userData', {})
        
        # Handle either single market or multiple markets
        requested_markets = data.get('markets', [])
        single_market = data.get('market', '')
        
        # If markets is a string, split it
        if isinstance(requested_markets, str):
            requested_markets = [m.strip() for m in requested_markets.split(',') if m.strip()]
            
        # If no markets array but single market provided, use that
        if not requested_markets and single_market:
            requested_markets = [single_market]
            
        # Handle user_data.selected_markets if no markets specified
        if not requested_markets and user_data.get('selected_markets'):
            selected_markets = user_data.get('selected_markets')
            if isinstance(selected_markets, str):
                requested_markets = [m.strip() for m in selected_markets.split(',') if m.strip()]
            elif isinstance(selected_markets, list):
                requested_markets = selected_markets
                
        if not requested_markets:
            return jsonify({"error": "No target markets specified"}), 400
            
        # Process each market
        reports = []
        for market in requested_markets:
            try:
                # Extract product categories
                product_categories = []
                if user_data.get('product_types'):
                    product_categories = user_data['product_types']
                elif user_data.get('products', {}).get('categories'):
                    product_categories = user_data['products']['categories']
                
                # Generate market fit score based on product categories and target market
                market_fit_score = 75  # Default value
                try:
                    market_fit_score = market_analysis.analyze_market_fit(product_categories, market)
                except Exception as e:
                    logger.error(f"Error analyzing market fit: {str(e)}")
                
                # Get regulatory readiness
                regulatory_readiness = 60  # Default value
                try:
                    if product_categories:
                        requirements = regulatory.analyze_regulatory_requirements(product_categories[0], [market])
                        # Calculate readiness based on requirements
                        regulatory_readiness = 30 + (len(requirements) * 5)  # Simple formula for demo
                        regulatory_readiness = min(regulatory_readiness, 90)  # Cap at 90%
                except Exception as e:
                    logger.error(f"Error calculating regulatory readiness: {str(e)}")
                    
                # Generate strengths and areas for improvement
                strengths = []
                areas_for_improvement = []
                try:
                    strengths = market_analysis.identify_strengths(user_data, market)
                    areas_for_improvement = market_analysis.identify_improvement_areas(user_data, market)
                except Exception as e:
                    logger.error(f"Error identifying strengths/areas for improvement: {str(e)}")
                    strengths = ["Quality products", "Established domestic presence", "Strong brand values"]
                    areas_for_improvement = ["International certifications needed", "Export documentation experience", "International marketing strategy"]
                
                # Get market trends
                key_trends = []
                try:
                    industry = user_data.get('industry', 'Food')
                    key_trends = market_analysis.identify_market_trends(industry, [market])
                except Exception as e:
                    logger.error(f"Error identifying market trends: {str(e)}")
                    key_trends = [
                        f"Growing market for specialty foods in {market}",
                        "Increasing demand for convenience foods",
                        "Rising interest in authentic international cuisines"
                    ]
                
                # Get regulatory requirements
                regulatory_requirements = []
                try:
                    if product_categories:
                        regulatory_requirements = regulatory.analyze_regulatory_requirements(product_categories[0], [market])
                except Exception as e:
                    logger.error(f"Error analyzing regulatory requirements: {str(e)}")
                    regulatory_requirements = [
                        "Food safety certification",
                        "Export/import documentation",
                        "Product labeling requirements"
                    ]
                
                # Construct the report
                report = {
                    "company_name": user_data.get('company_name', user_data.get('business_name', 'Your Company')),
                    "target_market": market,
                    "analysis_date": datetime.now().strftime("%d/%m/%Y"),
                    "market_fit_score": market_fit_score,
                    "regulatory_readiness": regulatory_readiness,
                    "strengths": strengths[:3],  # Limit to 3 items
                    "areas_for_improvement": areas_for_improvement[:3],  # Limit to 3 items
                    "key_trends": key_trends,
                    "regulatory_requirements": regulatory_requirements
                }
                
                reports.append(report)
            except Exception as e:
                logger.error(f"Error processing market {market}: {str(e)}")
                logger.error(traceback.format_exc())
        
        # Return either a single report or multiple reports based on the request
        if len(reports) == 1 and single_market:
            return jsonify(reports[0])
        else:
            return jsonify({
                "reports": reports,
                "metadata": {
                    "processed_markets": len(reports),
                    "timestamp": datetime.now().isoformat()
                }
            })
    
    except Exception as e:
        logger.error(f"Error generating export readiness report: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": f"Failed to generate report: {str(e)}"}), 500

@app.route('/api/market/options', methods=['POST', 'OPTIONS'])
def market_options_endpoint():
    """
    Get market options for the user.
    Filters markets based on user selection.
    """
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
        
    try:
        # Get the request data
        data = request.json or {}
        
        # Get the selected markets from the request
        selected_markets = data.get('selectedMarkets', [])
        
        # Log the request
        app.logger.debug(f"Getting market options with selected markets: {selected_markets}")
        
        # Prepare the parameters for the MCP server
        params = {
            'selectedMarkets': selected_markets
        }
        
        # Only include industry if it's provided in the request
        if 'industry' in data:
            params['industry'] = data['industry']
            app.logger.debug(f"Including industry in request: {data['industry']}")
        
        # Forward the request to the MCP server through the proxy
        response = requests.post(
            'http://localhost:3000/api/mcp/tools',
            json={
                'tool': 'getMarketOptions',
                'params': params
            },
            headers={'Content-Type': 'application/json'}
        )
        
        # Check if the response is successful
        if not response.ok:
            app.logger.error(f"MCP server returned error: {response.status_code} - {response.text}")
            return jsonify({
                "success": False,
                "error": f"MCP server returned error: {response.status_code}"
            }), response.status_code
        
        # Get the markets from the response
        markets_data = response.json()
        
        # If no selected markets are provided, filter to only include USA, UK, and UAE
        if not selected_markets:
            default_markets = ['USA', 'UK', 'UAE']
            if 'markets' in markets_data:
                markets_data['markets'] = [
                    market for market in markets_data['markets'] 
                    if market['id'] in default_markets
                ]
        
        # Return the markets
        return jsonify(markets_data)
    except Exception as e:
        app.logger.error(f"Error getting market options: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/proxy/mcp/tools', methods=['POST'])
def proxy_mcp_tools():
    """
    Proxy endpoint for MCP tools requests.
    This allows the frontend to make requests to the MCP server through the backend,
    avoiding CORS issues and providing a single point of entry.
    """
    try:
        # Log the request
        app.logger.debug(f"Proxying MCP tools request: {request.json}")
        
        # Get the request data
        data = request.json
        
        # Only add industry information if not present and if we have business context
        # This allows the frontend to explicitly set the industry when it knows it
        if 'params' in data and 'industry' not in data['params'] and 'businessId' in data['params']:
            # In a real implementation, we would look up the business profile
            # and determine the industry based on that
            # For now, we'll just log that we're not setting a default industry
            app.logger.info(f"No industry specified for business {data['params']['businessId']}. " 
                           f"The AI Agent should determine the appropriate industry.")
        
        # Forward the request to the MCP server
        mcp_url = 'http://localhost:3001/api/mcp/tools'
        response = requests.post(
            mcp_url,
            json=data,
            headers={'Content-Type': 'application/json'}
        )
        
        # Check if the response is successful
        if not response.ok:
            app.logger.error(f"MCP server returned error: {response.status_code} - {response.text}")
            return jsonify({
                "success": False,
                "error": f"MCP server returned error: {response.status_code}"
            }), response.status_code
        
        # Return the response from the MCP server
        return jsonify(response.json()), response.status_code
    except Exception as e:
        app.logger.error(f"Error proxying to MCP server: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": f"Failed to communicate with MCP server: {str(e)}"
        }), 500

if __name__ == '__main__':
    print("Starting Flask app on port 5002...")
    app.run(debug=True, port=5002)
