#!/usr/bin/env python
"""
Quick and reliable way to start the backend server.
Run this script from any directory.
"""
import os
import sys
import subprocess

def main():
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Find the backend app.py path
    if os.path.exists(os.path.join(script_dir, "tradewizard", "backend", "app.py")):
        backend_dir = os.path.join(script_dir, "tradewizard", "backend")
    else:
        # Try to find it in the current directory
        backend_dir = os.path.join(os.getcwd(), "tradewizard", "backend")
        if not os.path.exists(os.path.join(backend_dir, "app.py")):
            print("Error: Cannot find backend app.py. Make sure you're in the project root or run this script from the project root.")
            sys.exit(1)
    
    print(f"Starting backend server from {backend_dir}")
    
    # Set PYTHONPATH to include both the project root and backend directory
    os.environ["PYTHONPATH"] = f"{script_dir}:{backend_dir}:{os.environ.get('PYTHONPATH', '')}"
    
    # Change directory to backend
    os.chdir(backend_dir)
    
    # Run Flask app directly
    command = [sys.executable, "app.py"]
    
    try:
        print(f"Running command: {' '.join(command)}")
        process = subprocess.run(command, check=True)
        return process.returncode
    except subprocess.CalledProcessError as e:
        print(f"Error running backend: {e}")
        return e.returncode
    except KeyboardInterrupt:
        print("Backend server stopped by user")
        return 0

if __name__ == "__main__":
    sys.exit(main()) 