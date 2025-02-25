"""
TradeKing Export Assessment Platform Application Package
"""
from flask import Flask
from flask_cors import CORS
from flask_session import Session
import os
import logging
from .routes.assessment import assessment_bp

def create_app(test_config=None):
    """Create and configure the Flask application.
    
    Args:
        test_config: Optional test configuration to override defaults
        
    Returns:
        Configured Flask application instance
    """
    # Create Flask app
    app = Flask(__name__, instance_relative_config=True)
    
    # Load default configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
        SESSION_TYPE='filesystem',
        SESSION_FILE_DIR='flask_session',
        SESSION_PERMANENT=True,
        PERMANENT_SESSION_LIFETIME=1800,  # 30 minutes
        CORS_ORIGINS=['http://localhost:3000', 'http://localhost:8000'],  # Frontend and test harness servers
        CORS_SUPPORTS_CREDENTIALS=True,
        CORS_ALLOW_HEADERS=['Content-Type'],
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
    
    # Initialize extensions
    CORS(app, resources={
        r"/*": {
            "origins": app.config['CORS_ORIGINS'],
            "supports_credentials": app.config['CORS_SUPPORTS_CREDENTIALS'],
            "allow_headers": app.config['CORS_ALLOW_HEADERS'],
            "methods": app.config['CORS_METHODS']
        }
    })
    Session(app)
    
    # Register blueprints
    app.register_blueprint(assessment_bp)
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'healthy'}
    
    return app

# Create and configure the app
app = create_app() 