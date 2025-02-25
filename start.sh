#!/bin/bash

# Set working directory to script location
cd "$(dirname "$0")"

# Check if running on Windows and adjust commands accordingly
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows with Git Bash or similar
    PYTHON_CMD="python"
    FRONTEND_CMD="npm.cmd"
else
    # Linux/macOS
    PYTHON_CMD="python3"
    FRONTEND_CMD="npm"
fi

# Function to display messages
function echo_info() {
    echo -e "\033[1;34m$1\033[0m"
}

function echo_success() {
    echo -e "\033[1;32m$1\033[0m"
}

function echo_error() {
    echo -e "\033[1;31m$1\033[0m"
}

# Check if backend dependencies are installed
echo_info "Checking backend dependencies..."
if ! command -v $PYTHON_CMD &> /dev/null; then
    echo_error "Python not found. Please install Python 3.8 or later."
    exit 1
fi

# Go to backend directory and set up Python environment
cd new/backend

# Check for virtual environment and create if it doesn't exist
if [ ! -d "venv" ]; then
    echo_info "Creating Python virtual environment..."
    $PYTHON_CMD -m venv venv
    
    if [ $? -ne 0 ]; then
        echo_error "Failed to create virtual environment. Please install venv package."
        exit 1
    fi
fi

# Activate virtual environment
echo_info "Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install backend dependencies
echo_info "Installing backend dependencies..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo_error "Failed to install backend dependencies."
    exit 1
fi

# Start backend server in the background
echo_info "Starting backend server..."
$PYTHON_CMD app.py &
BACKEND_PID=$!

# Wait a bit for the backend to start
sleep 2

# Check if the backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo_error "Backend failed to start."
    exit 1
fi

echo_success "Backend server started successfully (PID: $BACKEND_PID)"

# Switch to frontend directory
cd ../frontend

# Check if Node.js is installed
echo_info "Checking frontend dependencies..."
if ! command -v $FRONTEND_CMD &> /dev/null; then
    echo_error "Node.js not found. Please install Node.js 14 or later."
    
    # Kill backend server before exiting
    kill $BACKEND_PID
    exit 1
fi

# Install frontend dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo_info "Installing frontend dependencies..."
    $FRONTEND_CMD install
    
    if [ $? -ne 0 ]; then
        echo_error "Failed to install frontend dependencies."
        
        # Kill backend server before exiting
        kill $BACKEND_PID
        exit 1
    fi
fi

# Start the frontend in the background
echo_info "Starting frontend development server..."
$FRONTEND_CMD start &
FRONTEND_PID=$!

# Wait a bit for the frontend to start
sleep 5

echo_success "Frontend server started successfully (PID: $FRONTEND_PID)"
echo_success "TradeWizard is now running!"
echo_info "Backend: http://localhost:5002"
echo_info "Frontend: http://localhost:3000"
echo_info "Press Ctrl+C to stop both servers"

# Wait for user to press Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; echo_info 'Shutting down...'; exit 0" INT
wait 