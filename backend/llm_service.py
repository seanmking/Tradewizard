"""Simplified LLM service for assessment system."""

import requests
from typing import Optional, Tuple

class LLMService:
    def __init__(self, api_url: str = "http://localhost:11434/api/generate"):
        self.api_url = api_url
    
    def get_response(
        self, 
        prompt: str, 
        system_prompt: str,
        timeout: int = 10
    ) -> Optional[str]:
        """Get response from LLM"""
        try:
            response = requests.post(
                self.api_url,
                json={
                    "model": "mistral",
                    "prompt": prompt,
                    "system": system_prompt,
                    "stream": False
                },
                timeout=timeout
            )
            return response.json()['response']
        except Exception as e:
            print(f"LLM Error: {str(e)}")
            return None

    def health_check(self) -> Tuple[bool, str]:
        """Check if LLM service is responding"""
        try:
            response = self.get_response("Say OK", "Respond with OK only")
            return response and "ok" in response.lower(), "LLM service is healthy"
        except Exception as e:
            return False, f"LLM service error: {str(e)}"