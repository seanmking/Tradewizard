import requests
import sys
from time import sleep

def check_flask():
    try:
        response = requests.get('http://localhost:5001/api/health')
        return response.status_code == 200, "Flask server is running"
    except requests.exceptions.ConnectionError:
        return False, "Flask server is not running"

def check_ollama():
    try:
        response = requests.post(
            'http://localhost:11434/api/generate',
            json={
                "model": "mistral",
                "prompt": "Say ok",
                "stream": False
            },
            timeout=5
        )
        if response.status_code == 200:
            return True, "Ollama is running and responding"
        return False, f"Ollama returned status code {response.status_code}"
    except requests.exceptions.ConnectionError:
        return False, "Ollama is not running. Start it with 'ollama serve'"
    except requests.exceptions.Timeout:
        return False, "Ollama timed out. It might be overloaded or stuck"
    except Exception as e:
        return False, f"Error checking Ollama: {str(e)}"

def main():
    print("Checking TradeKing services...")
    print("-" * 30)
    
    flask_ok, flask_msg = check_flask()
    ollama_ok, ollama_msg = check_ollama()
    
    print(f"Flask Server: {'✅' if flask_ok else '❌'} - {flask_msg}")
    print(f"Ollama LLM:   {'✅' if ollama_ok else '❌'} - {ollama_msg}")
    print("-" * 30)
    
    if not (flask_ok and ollama_ok):
        print("\nSome services are not running. Please fix before proceeding.")
        sys.exit(1)
    else:
        print("\nAll services are running correctly! ✨")
        sys.exit(0)

if __name__ == "__main__":
    main() 