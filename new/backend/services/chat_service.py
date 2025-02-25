import uuid
from typing import Dict, List, Optional
from datetime import datetime

class ChatService:
    def __init__(self):
        # In-memory storage for chat sessions and messages
        # In a production environment, this would be replaced with a database
        self.chat_sessions: Dict[str, Dict] = {}
        self.chat_messages: Dict[str, List[Dict]] = {}

    def create_chat_session(self, user_id: str) -> str:
        """
        Create a new chat session for a user.
        Returns the chat_id for the new session.
        """
        chat_id = str(uuid.uuid4())
        self.chat_sessions[chat_id] = {
            'user_id': user_id,
            'created_at': datetime.utcnow().isoformat(),
            'status': 'active'
        }
        self.chat_messages[chat_id] = []
        return chat_id

    def add_message(self, chat_id: str, user_id: str, message: str, response: str) -> None:
        """
        Add a message and its response to the chat history.
        """
        if chat_id not in self.chat_sessions:
            raise Exception("Chat session not found")

        timestamp = datetime.utcnow().isoformat()
        
        # Add user message
        self.chat_messages[chat_id].append({
            'timestamp': timestamp,
            'role': 'user',
            'user_id': user_id,
            'content': message
        })
        
        # Add assistant response
        self.chat_messages[chat_id].append({
            'timestamp': timestamp,
            'role': 'assistant',
            'content': response
        })

    def get_chat_history(self, chat_id: str) -> List[Dict]:
        """
        Retrieve the chat history for a given chat_id.
        """
        if chat_id not in self.chat_sessions:
            raise Exception("Chat session not found")
        
        return {
            'session_info': self.chat_sessions[chat_id],
            'messages': self.chat_messages[chat_id]
        }

    def end_chat_session(self, chat_id: str) -> None:
        """
        End a chat session by marking it as inactive.
        """
        if chat_id not in self.chat_sessions:
            raise Exception("Chat session not found")
        
        self.chat_sessions[chat_id]['status'] = 'inactive'
        self.chat_sessions[chat_id]['ended_at'] = datetime.utcnow().isoformat()
