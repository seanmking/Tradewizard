"""
Flask application factory for TradeKing Export Assessment Platform
"""
import os
import logging
from typing import Optional, Any

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from flask_session import Session

from config import Config
from app import init_app

# Configure root logger
logging.basicConfig(
    filename='logs/app.log',
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def create_app(config_class: Optional[Any] = None) -> Flask:
    """Create and configure the Flask application.
    
    Args:
        config_class: Configuration class to use. Defaults to Config.
        
    Returns:
        Flask: Configured Flask application instance.
    """
    # Initialize Flask app using init_app
    app = init_app()
    
    # Load configuration
    app.config.from_object(config_class or Config)
    
    @app.route('/api/start', methods=['POST'])
    def start_session() -> tuple[Response, int]:
        """Initialize a new session.
        
        Returns:
            tuple: Response object and status code.
        """
        try:
            session_id = request.headers.get('X-Session-ID')
            if not session_id:
                logger.warning("No session ID provided in request")
                return jsonify({
                    'error': 'No session ID provided'
                }), 400
            
            logger.info(f"Session initialized with ID: {session_id}")
            return jsonify({
                'sessionId': session_id,
                'status': 'active'
            }), 200
            
        except Exception as e:
            logger.error(f"Error in start_session: {str(e)}")
            return jsonify({
                'error': 'Internal server error',
                'message': str(e)
            }), 500
    
    return app

if __name__ == '__main__':
    flask_app = create_app()
    flask_app.run(host='0.0.0.0', port=5001, debug=flask_app.config['DEBUG'])