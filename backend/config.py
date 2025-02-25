"""
Configuration settings for the TradeKing Export Assessment Platform
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev')
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    # API settings
    LLM_API_URL = os.getenv('LLM_API_URL')
    
    # Session settings
    SESSION_TYPE = 'filesystem'
    SESSION_FILE_DIR = 'flask_session'
    PERMANENT_SESSION_LIFETIME = 1800  # 30 minutes
    
    # CORS settings
    CORS_ORIGINS = ['http://localhost:5173']  # Vite dev server
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = 'logs/app.log' 