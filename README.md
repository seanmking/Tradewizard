# Ollama ChatBot

An interactive chatbot system built with Flask that uses Ollama for local LLM hosting.

## Prerequisites

- Python 3.8 or higher
- Ollama installed and running locally
- Virtual environment (recommended)

## Setup

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Unix/macOS
# or
.\venv\Scripts\activate  # On Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Make sure Ollama is running locally with your preferred model (e.g., llama2)

4. Start the application:
```bash
python app.py
```

5. Open your browser and navigate to `http://localhost:5000`

## Features

- Real-time chat interface
- Integration with local LLM through Ollama
- Clean and responsive UI
- Message history display 