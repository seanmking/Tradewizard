#!/usr/bin/env python
"""
Run backend server directly from the root directory.
This script ensures proper imports and module loading.
"""
import os
import sys
import subprocess

# Get current directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Target backend directory
backend_dir = os.path.join(current_dir, "tradewizard", "backend")

if not os.path.exists(backend_dir):
    print(f"Error: Backend directory not found at {backend_dir}")
    sys.exit(1)

print(f"Starting backend server from {backend_dir}")

# Set PYTHONPATH to include backend directory
os.environ["PYTHONPATH"] = f"{backend_dir}:{os.environ.get('PYTHONPATH', '')}"

# Change to backend directory
os.chdir(backend_dir)

# Run the app.py file directly using the Python executable
try:
    # Use the current Python interpreter
    python_executable = sys.executable
    result = subprocess.run([python_executable, "app.py"], check=True)
    sys.exit(result.returncode)
except subprocess.CalledProcessError as e:
    print(f"Error running backend server: {e}")
    sys.exit(e.returncode)
except KeyboardInterrupt:
    print("Backend server stopped by user")
    sys.exit(0) 