import requests
import json
import os
import time
import re
from typing import Dict, List, Any, Optional

class LLMService:
    """
    Service for interacting with LLM APIs.
    This handles communication with the API, error handling, retries, etc.
    """
    
    def __init__(self):
        # API configuration - default to using local LLM
        self.api_url = os.environ.get("LLM_API_URL", "http://localhost:11434/api/generate")
        self.model = os.environ.get("LLM_MODEL", "mistral")
        self.api_key = os.environ.get("LLM_API_KEY", "")
        
        # Set to true to log more details about API calls
        self.debug = False
        
        # Retry configuration
        self.max_retries = 3
        self.retry_delay = 2  # seconds
        
    def generate(self, prompt: str, max_tokens: int = 1000, temperature: float = 0.7) -> str:
        """
        Generate text using the LLM API.
        
        Args:
            prompt: The prompt to send to the LLM
            max_tokens: Maximum number of tokens to generate
            temperature: Temperature for generation (higher = more creative)
            
        Returns:
            The generated text response
        """
        # Retry mechanism for API calls
        for attempt in range(self.max_retries):
            try:
                # Prepare the API request
                payload = {
                    "model": self.model,
                    "prompt": prompt,
                    "temperature": temperature,
                    "max_tokens": max_tokens
                }
                
                headers = {
                    "Content-Type": "application/json"
                }
                
                # Add API key if provided
                if self.api_key:
                    headers["Authorization"] = f"Bearer {self.api_key}"
                
                if self.debug:
                    print(f"LLM Request - Attempt {attempt+1}:")
                    print(f"Prompt: {prompt[:150]}...")
                
                # Make the API call
                response = requests.post(
                    self.api_url,
                    headers=headers,
                    data=json.dumps(payload),
                    timeout=30  # 30 second timeout
                )
                
                # Check for successful response
                if response.status_code == 200:
                    # Parse the response
                    response_data = response.json()
                    
                    if self.debug:
                        print(f"LLM Response: {response_data[:150]}...")
                    
                    # Extract the generated text - adjust based on API response format
                    if "response" in response_data:
                        return response_data["response"]
                    elif "choices" in response_data:
                        return response_data["choices"][0]["text"]
                    else:
                        return str(response_data)
                else:
                    print(f"LLM API error (HTTP {response.status_code}): {response.text}")
                    
                    # If this isn't the last attempt, retry
                    if attempt < self.max_retries - 1:
                        time.sleep(self.retry_delay)
                        continue
                    else:
                        return f"Error: API returned status code {response.status_code}"
                        
            except Exception as e:
                print(f"LLM API exception: {str(e)}")
                
                # If this isn't the last attempt, retry
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay)
                    continue
                else:
                    return f"Error: {str(e)}"
        
        # If we get here, all attempts failed
        return "Error: Failed to get a response from the LLM API after multiple attempts"
    
    def extract_structured_data(self, text: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract structured data from text using the LLM.
        
        Args:
            text: The text to extract data from
            schema: Schema describing the data to extract
            
        Returns:
            Dictionary with extracted data
        """
        # Convert schema to string description for prompt
        schema_desc = json.dumps(schema, indent=2)
        
        prompt = f"""
        Extract structured data from the following text according to this schema:
        
        {schema_desc}
        
        Text to extract from:
        {text}
        
        Return ONLY valid JSON matching the schema above. No additional text.
        """
        
        # Generate response
        response = self.generate(prompt)
        
        # Try to parse response as JSON
        try:
            # Find JSON in the response - it might be surrounded by markdown code blocks
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```|({[\s\S]*})', response)
            if json_match:
                json_str = json_match.group(1) or json_match.group(2)
                return json.loads(json_str)
            else:
                return json.loads(response)
        except json.JSONDecodeError as e:
            print(f"Error parsing LLM response as JSON: {e}")
            print(f"Response: {response}")
            # Return empty data
            return {} 