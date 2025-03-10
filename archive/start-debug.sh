#!/bin/bash

# Set working directory to script location
cd "$(dirname "$0")"

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

# Cleanup function
function cleanup_processes() {
    echo_info "Cleaning up existing processes..."
    
    # Kill any existing Node.js processes on port 3000
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    
    # Kill any existing Python processes on port 5002
    lsof -ti:5002 | xargs kill -9 2>/dev/null
    
    # Kill any existing Node.js processes on port 3001 (mock server)
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    
    echo_success "Process cleanup completed"
}

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

# Run cleanup
cleanup_processes

# Start the mock server
echo_info "Starting mock server..."
cd tradewizard
node mock-server.js &
MOCK_SERVER_PID=$!

# Wait a bit for the mock server to start
sleep 2

# Check if the mock server is running
if ! kill -0 $MOCK_SERVER_PID 2>/dev/null; then
    echo_error "Mock server failed to start."
    exit 1
fi

echo_success "Mock server started successfully (PID: $MOCK_SERVER_PID)"

# Return to the root directory
cd ..

# Check if backend dependencies are installed
echo_info "Checking backend dependencies..."
if ! command -v $PYTHON_CMD &> /dev/null; then
    echo_error "Python not found. Please install Python 3.8 or later."
    exit 1
fi

# Go to backend directory and set up Python environment
cd tradewizard/backend

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

# Create user_data directory for scraped data
echo_info "Creating user_data directory for scraped data..."
mkdir -p user_data

# Print Python path for debugging
echo_info "Python sys.path:"
$PYTHON_CMD -c "import sys; print('\n'.join(sys.path))"

# Print directory structure
echo_info "Directory structure:"
find .. -type d -not -path "*/\.*" -not -path "*/venv/*" -not -path "*/node_modules/*" | sort

# Try importing modules to verify paths
echo_info "Attempting module imports..."
$PYTHON_CMD -c "
try:
    import sys
    print('Python version:', sys.version)
    print('Current working directory:', __file__)
    
    try:
        from services import website_analyzer
        print('Successfully imported website_analyzer from services')
    except ImportError as e:
        print(f'Error importing website_analyzer from services: {e}')
        
    try:
        from export_intelligence.scraper import website_analyzer
        print('Successfully imported website_analyzer from export_intelligence.scraper')
    except ImportError as e:
        print(f'Error importing website_analyzer from export_intelligence.scraper: {e}')
except Exception as e:
    print(f'Error: {e}')
"

# Start backend server in the background with verbose output
echo_info "Starting backend server with debug output..."
$PYTHON_CMD -u app.py > ../backend_debug.log 2>&1 &
BACKEND_PID=$!

# Wait a bit for the backend to start
sleep 5

# Check if the backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo_error "Backend failed to start. Check backend_debug.log for details."
    cat ../backend_debug.log
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
BROWSER=none $FRONTEND_CMD start > ../frontend_debug.log 2>&1 &
FRONTEND_PID=$!

# Wait a bit for the frontend to start
sleep 5

echo_success "Frontend server started successfully (PID: $FRONTEND_PID)"
echo_success "TradeWizard is now running in debug mode!"
echo_info "Services are available at:"
echo_info "Backend: http://localhost:5002"
echo_info "Frontend: http://localhost:3000"
echo_info "Mock Server: http://localhost:3001"
echo_info "Debug logs:"
echo_info "Backend: tradewizard/backend_debug.log"
echo_info "Frontend: tradewizard/frontend_debug.log"
echo_info "Press Ctrl+C to stop all servers"

# Function to handle cleanup on exit
function cleanup_on_exit() {
    echo_info "Shutting down..."
    
    # Kill the backend, frontend, and mock servers
    kill $BACKEND_PID $FRONTEND_PID $MOCK_SERVER_PID 2>/dev/null
    
    # Cleanup any remaining processes on the ports
    cleanup_processes
    
    exit 0
}

# Set up trap for cleanup
trap cleanup_on_exit INT

# Wait for processes
wait 