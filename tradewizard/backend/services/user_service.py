import os
import json
import uuid
import hashlib
from typing import Dict, Any, Optional

class UserService:
    def __init__(self):
        self.users_dir = "user_data"
        os.makedirs(self.users_dir, exist_ok=True)
        self.users_file = os.path.join(self.users_dir, "users.json")
        
        # Initialize users file if it doesn't exist
        if not os.path.exists(self.users_file):
            with open(self.users_file, 'w') as f:
                json.dump({}, f)
    
    def create_user(self, username: str, password: str) -> Dict[str, Any]:
        """
        Create a new user account
        
        Args:
            username: The username for the new account
            password: The password for the new account
            
        Returns:
            Dict containing user information and success status
        """
        # Load existing users
        users = self._load_users()
        
        # Check if username already exists
        if username in users:
            return {
                "success": False,
                "message": "Username already exists"
            }
        
        # Hash the password
        salt = uuid.uuid4().hex
        hashed_password = self._hash_password(password, salt)
        
        # Create user object
        user_id = str(uuid.uuid4())
        user = {
            "user_id": user_id,
            "username": username,
            "password_hash": hashed_password,
            "salt": salt,
            "created_at": self._get_timestamp(),
            "assessment_data": {}
        }
        
        # Save user
        users[username] = user
        self._save_users(users)
        
        # Return user info (without sensitive data)
        return {
            "success": True,
            "user_id": user_id,
            "username": username,
            "message": "User created successfully"
        }
    
    def validate_credentials(self, username: str, password: str) -> Dict[str, Any]:
        """
        Validate user credentials
        
        Args:
            username: The username to validate
            password: The password to validate
            
        Returns:
            Dict containing validation result
        """
        users = self._load_users()
        
        if username not in users:
            return {"success": False, "message": "Invalid username or password"}
        
        user = users[username]
        hashed_password = self._hash_password(password, user["salt"])
        
        if hashed_password == user["password_hash"]:
            return {
                "success": True,
                "user_id": user["user_id"],
                "username": username,
                "message": "Login successful"
            }
        else:
            return {"success": False, "message": "Invalid username or password"}
    
    def get_user(self, username: str) -> Optional[Dict[str, Any]]:
        """
        Get user information by username
        
        Args:
            username: The username to look up
            
        Returns:
            User information or None if not found
        """
        users = self._load_users()
        
        if username in users:
            user = users[username].copy()
            # Remove sensitive information
            user.pop("password_hash", None)
            user.pop("salt", None)
            return user
        
        return None
    
    def update_assessment_data(self, username: str, assessment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update the assessment data for a user
        
        Args:
            username: The username to update
            assessment_data: The assessment data to store
            
        Returns:
            Dict containing update status
        """
        users = self._load_users()
        
        if username not in users:
            return {"success": False, "message": "User not found"}
        
        users[username]["assessment_data"] = assessment_data
        self._save_users(users)
        
        return {"success": True, "message": "Assessment data updated"}
    
    def _load_users(self) -> Dict[str, Any]:
        """Load users from the JSON file"""
        try:
            with open(self.users_file, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}
    
    def _save_users(self, users: Dict[str, Any]) -> None:
        """Save users to the JSON file"""
        with open(self.users_file, 'w') as f:
            json.dump(users, f, indent=2)
    
    def _hash_password(self, password: str, salt: str) -> str:
        """Hash a password with the given salt"""
        return hashlib.sha256((password + salt).encode()).hexdigest()
    
    def _get_timestamp(self) -> str:
        """Get the current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat() 