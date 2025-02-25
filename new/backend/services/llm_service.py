import requests
from typing import Dict, List, Optional
import traceback

class LLMService:
    def __init__(self):
        """Initialize LLM service with Ollama endpoint."""
        self.api_url = "http://localhost:11434/api/generate"
        self.model = "mistral"  # Using Mistral model
        self.chat_contexts: Dict[str, List[Dict]] = {}
        self.is_healthy = True
        self.last_error = None

    def process_message(self, message: str, chat_id: str) -> str:
        """
        Process a message using the Ollama API and maintain conversation context.
        """
        if chat_id not in self.chat_contexts:
            self.chat_contexts[chat_id] = []

        # Add system message for trading context if it's a new conversation
        if not self.chat_contexts[chat_id]:
            system_prompt = "You are TradeKing, an expert trading assistant. Provide clear, accurate, and professional guidance on trading concepts, market analysis, and risk management. Always emphasize the importance of responsible trading and proper risk assessment."
        else:
            system_prompt = ""

        try:
            # Include previous context in the prompt
            prompt = message
            if self.chat_contexts[chat_id]:
                context = ""
                for msg in self.chat_contexts[chat_id][-3:]:  # Only use last 3 messages for context
                    if msg["role"] == "user":
                        context += f"User: {msg['content']}\n"
                    elif msg["role"] == "assistant":
                        context += f"Assistant: {msg['content']}\n"
                prompt = f"{context}\nUser: {message}"

            print(f"Making request to Ollama with: model={self.model}, prompt={prompt}")
            
            # Make request to Ollama
            response = requests.post(
                self.api_url,
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "system": system_prompt,
                    "stream": False
                },
                timeout=30
            )
            
            print(f"Ollama response status: {response.status_code}")
            print(f"Ollama response body: {response.text}")
            
            if response.status_code != 200:
                print(f"Error in LLM processing: HTTP {response.status_code}")
                raise Exception(f"LLM service error: HTTP {response.status_code}")

            result = response.json()
            if 'response' not in result:
                print(f"Invalid response format: {result}")
                raise Exception("Invalid response format from LLM service")

            # Store the conversation context
            self.chat_contexts[chat_id].append({
                "role": "user",
                "content": message
            })
            self.chat_contexts[chat_id].append({
                "role": "assistant",
                "content": result['response']
            })

            # Maintain context window (keep last 10 messages)
            if len(self.chat_contexts[chat_id]) > 10:
                self.chat_contexts[chat_id] = self.chat_contexts[chat_id][-10:]

            return result['response']

        except Exception as e:
            print(f"Error in LLM processing: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            raise Exception("Failed to process message with LLM service")
