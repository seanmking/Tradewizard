from flask import Blueprint, request, jsonify
from services.user_service import UserService

user_bp = Blueprint('user', __name__)
user_service = UserService()

@user_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        confirm_password = data.get('confirm_password')
        
        # Validate input
        if not username or not password or not confirm_password:
            return jsonify({"success": False, "message": "Missing required fields"}), 400
        
        if password != confirm_password:
            return jsonify({"success": False, "message": "Passwords do not match"}), 400
        
        # Create user
        result = user_service.create_user(username, password)
        
        if result["success"]:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@user_bp.route('/login', methods=['POST'])
def login():
    """Login a user"""
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        # Validate input
        if not username or not password:
            return jsonify({"success": False, "message": "Missing required fields"}), 400
        
        # Validate credentials
        result = user_service.validate_credentials(username, password)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 401
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@user_bp.route('/profile/<username>', methods=['GET'])
def get_profile(username):
    """Get user profile"""
    try:
        user = user_service.get_user(username)
        
        if user:
            return jsonify({"success": True, "user": user}), 200
        else:
            return jsonify({"success": False, "message": "User not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@user_bp.route('/assessment/<username>', methods=['POST'])
def update_assessment(username):
    """Update user assessment data"""
    try:
        data = request.json
        assessment_data = data.get('assessment_data', {})
        
        result = user_service.update_assessment_data(username, assessment_data)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500 