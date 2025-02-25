"""
TradeKing Export Assessment Platform Application Package
"""
from typing import Optional, Dict, Any
import os
import logging
import flask
from flask import Flask, session, request, current_app
from flask.typing import ResponseReturnValue
from flask_cors import CORS
from flask_session import Session

# Configure root logger
logging.basicConfig(
    filename='logs/app.log',
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def create_app(test_config: Optional[Dict[str, Any]] = None) -> Flask:
    """Create and configure the Flask application."""
    # Create Flask app
    app = Flask(__name__, instance_relative_config=True)
    
    # Load default configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
        SESSION_TYPE='filesystem',
        SESSION_FILE_DIR='flask_session',
        SESSION_PERMANENT=True,
        PERMANENT_SESSION_LIFETIME=1800,  # 30 minutes
        SESSION_KEY_PREFIX='tradeking_',  # Add prefix for clarity
        CORS_ORIGINS=['http://localhost:3000'],
        CORS_SUPPORTS_CREDENTIALS=True,
        CORS_ALLOW_HEADERS=['Content-Type', 'X-Session-ID'],
        CORS_METHODS=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    )
    
    # Load test config if provided
    if test_config is not None:
        app.config.update(test_config)
    
    # Ensure instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
    
    # Ensure session folder exists
    if not os.path.exists('flask_session'):
        os.makedirs('flask_session')
    
    # Ensure logs directory exists
    if not os.path.exists('logs'):
        os.makedirs('logs')
    
    # Initialize extensions
    CORS(app, resources={
        r"/*": {
            "origins": app.config['CORS_ORIGINS'],
            "supports_credentials": True,
            "allow_headers": app.config['CORS_ALLOW_HEADERS'],
            "methods": app.config['CORS_METHODS']
        }
    })
    
    # Initialize session
    Session(app)
    
    @app.before_request
    def handle_session_id() -> None:
        """Ensure session ID is properly set from headers or create new one."""
        session_id = request.headers.get('X-Session-ID')
        if session_id:
            session['session_id'] = session_id
        elif 'session_id' not in session:
            session['session_id'] = f"session_{os.urandom(16).hex()}"
    
    # Register blueprints
    from .routes.assessment import assessment_bp
    app.register_blueprint(assessment_bp)
    
    # Health check endpoint
    @app.route('/health')
    def health_check() -> ResponseReturnValue:
        """Health check endpoint."""
        return {'status': 'healthy'}
    
    return app

# Create and configure the app
app = create_app() 