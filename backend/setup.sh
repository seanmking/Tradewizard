#!/bin/bash

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Create necessary directories
mkdir -p app/routes
mkdir -p app/models
mkdir -p app/services
mkdir -p flask_session

# Create empty __init__.py files if they don't exist
touch app/__init__.py
touch app/routes/__init__.py
touch app/models/__init__.py
touch app/services/__init__.py

echo "Setup complete! You can now run the application with:"
echo "python run.py" 