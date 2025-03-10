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
    
    # Kill any existing Node.js processes on port 3001 (export-guru-mcp server)
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    
    # Kill any existing Node.js processes on port 3002 (mock server)
    lsof -ti:3002 | xargs kill -9 2>/dev/null
    
    echo_success "Process cleanup completed"
}

# Start Ollama function
function start_ollama() {
    echo_info "Starting Ollama..."
    
    # Check if Ollama is already running
    if ! pgrep -x "ollama" > /dev/null; then
        # Start Ollama in the background
        ollama serve &
        OLLAMA_PID=$!
        sleep 2
        
        # Check if Ollama started successfully
        if ! kill -0 $OLLAMA_PID 2>/dev/null; then
            echo_error "Failed to start Ollama"
            exit 1
        fi
        echo_success "Ollama started successfully"
    else
        echo_info "Ollama is already running"
    fi
}

# Start PostgreSQL function
function start_postgresql() {
    echo_info "Checking PostgreSQL status..."
    
    # Define PostgreSQL commands based on installation method
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - try to find pg_isready in common locations
        PG_ISREADY="/usr/local/bin/pg_isready"
        if [ ! -f "$PG_ISREADY" ]; then
            PG_ISREADY="/opt/homebrew/bin/pg_isready"
        fi
        if [ ! -f "$PG_ISREADY" ]; then
            PG_ISREADY="$(brew --prefix)/bin/pg_isready"
        fi
        
        # If we still can't find it, try to use the full path from Homebrew
        if [ ! -f "$PG_ISREADY" ]; then
            echo_info "pg_isready not found in PATH, using alternative check method..."
            # Check if PostgreSQL is running using brew services
            if brew services list | grep postgresql | grep started > /dev/null; then
                echo_info "PostgreSQL is already running according to brew services"
                PG_RUNNING=true
            else
                PG_RUNNING=false
            fi
        else
            # Check if PostgreSQL is already running using pg_isready
            if "$PG_ISREADY" -q; then
                PG_RUNNING=true
            else
                PG_RUNNING=false
            fi
        fi
    else
        # Linux or other OS
        if command -v pg_isready > /dev/null; then
            if pg_isready -q; then
                PG_RUNNING=true
            else
                PG_RUNNING=false
            fi
        else
            echo_error "pg_isready command not found. Please ensure PostgreSQL is properly installed."
            exit 1
        fi
    fi
    
    # Start PostgreSQL if not running
    if [ "$PG_RUNNING" = false ]; then
        echo_info "Starting PostgreSQL..."
        
        # Start PostgreSQL based on OS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            brew services start postgresql@15
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            sudo service postgresql start
        else
            # Windows or other
            echo_error "Automatic PostgreSQL startup not supported on this OS. Please start PostgreSQL manually."
            exit 1
        fi
        
        # Wait for PostgreSQL to start
        sleep 3
        
        # Check if PostgreSQL started successfully
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if [ -f "$PG_ISREADY" ]; then
                if ! "$PG_ISREADY" -q; then
                    echo_error "Failed to start PostgreSQL"
                    exit 1
                fi
            else
                # Alternative check using brew services
                if ! brew services list | grep postgresql | grep started > /dev/null; then
                    echo_error "Failed to start PostgreSQL"
                    exit 1
                fi
            fi
        else
            if ! pg_isready -q; then
                echo_error "Failed to start PostgreSQL"
                exit 1
            fi
        fi
        echo_success "PostgreSQL started successfully"
    else
        echo_info "PostgreSQL is already running"
    fi
    
    # Define PostgreSQL commands for database operations
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - try to find psql and createdb in common locations
        PSQL="/usr/local/bin/psql"
        CREATEDB="/usr/local/bin/createdb"
        
        if [ ! -f "$PSQL" ]; then
            PSQL="/opt/homebrew/bin/psql"
        fi
        if [ ! -f "$CREATEDB" ]; then
            CREATEDB="/opt/homebrew/bin/createdb"
        fi
        
        # If we still can't find them, try to use the full path from Homebrew
        if [ ! -f "$PSQL" ]; then
            PSQL="$(brew --prefix postgresql@15)/bin/psql"
        fi
        if [ ! -f "$CREATEDB" ]; then
            CREATEDB="$(brew --prefix postgresql@15)/bin/createdb"
        fi
        
        # Final check if commands exist
        if [ ! -f "$PSQL" ]; then
            echo_error "Could not find psql command. Please ensure PostgreSQL is properly installed."
            echo_info "You may need to run: brew install postgresql@15"
            echo_info "And add it to your PATH: echo 'export PATH=\"$(brew --prefix postgresql@15)/bin:\$PATH\"' >> ~/.zshrc"
            exit 1
        fi
        
        if [ ! -f "$CREATEDB" ]; then
            echo_error "Could not find createdb command. Please ensure PostgreSQL is properly installed."
            echo_info "You may need to run: brew install postgresql@15"
            echo_info "And add it to your PATH: echo 'export PATH=\"$(brew --prefix postgresql@15)/bin:\$PATH\"' >> ~/.zshrc"
            exit 1
        fi
    else
        # Linux or other OS
        PSQL="psql"
        CREATEDB="createdb"
    fi
    
    # Check if our databases exist, create if they don't
    echo_info "Checking databases..."
    
    # Check regulatory_db
    if ! "$PSQL" -lqt | cut -d \| -f 1 | grep -qw regulatory_db; then
        echo_info "Creating regulatory_db database..."
        "$CREATEDB" regulatory_db
        echo_success "Created regulatory_db database"
    fi
    
    # Check trade_db
    if ! "$PSQL" -lqt | cut -d \| -f 1 | grep -qw trade_db; then
        echo_info "Creating trade_db database..."
        "$CREATEDB" trade_db
        echo_success "Created trade_db database"
    fi
    
    # Check memory_db (for the memory subsystem)
    if ! "$PSQL" -lqt | cut -d \| -f 1 | grep -qw memory_db; then
        echo_info "Creating memory_db database for the memory subsystem..."
        "$CREATEDB" memory_db
        echo_success "Created memory_db database"
    fi
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

# Start Ollama
start_ollama

# Start PostgreSQL
start_postgresql

# Start the export-guru-mcp server
echo_info "Starting export-guru-mcp server..."
cd mcp-servers/export-guru-mcp

# Set environment variables for memory subsystem
export MEMORY_DB_URL="postgresql://seanking@localhost:5432/memory_db"

# Start the server
node src/simple-server.js &
MCP_SERVER_PID=$!

# Wait a bit for the server to start
sleep 2

# Check if the server is running
if ! kill -0 $MCP_SERVER_PID 2>/dev/null; then
    echo_error "Export-guru-mcp server failed to start."
    exit 1
fi

echo_success "Export-guru-mcp server started successfully (PID: $MCP_SERVER_PID)"

# Return to the root directory
cd ../..

# Start the mock server (no longer needed as we're using the MCP server)
# echo_info "Starting mock server..."
# cd tradewizard
# PORT=3002 node mock-server.js &
# MOCK_SERVER_PID=$!
# 
# # Wait a bit for the mock server to start
# sleep 2
# 
# # Check if the mock server is running
# if ! kill -0 $MOCK_SERVER_PID 2>/dev/null; then
#     echo_error "Mock server failed to start."
#     exit 1
# fi
# 
# echo_success "Mock server started successfully (PID: $MOCK_SERVER_PID)"
# 
# # Return to the root directory
# cd ..

# Check if backend dependencies are installed (no longer needed as we're using the MCP server)
# echo_info "Checking backend dependencies..."
# if ! command -v $PYTHON_CMD &> /dev/null; then
#     echo_error "Python not found. Please install Python 3.8 or later."
#     exit 1
# fi
# 
# # Go to backend directory and set up Python environment
# cd tradewizard/backend
# 
# # Check for virtual environment and create if it doesn't exist
# if [ ! -d "venv" ]; then
#     echo_info "Creating Python virtual environment..."
#     $PYTHON_CMD -m venv venv
#     
#     if [ $? -ne 0 ]; then
#         echo_error "Failed to create virtual environment. Please install venv package."
#         exit 1
#     fi
# fi
# 
# # Activate virtual environment
# echo_info "Activating virtual environment..."
# if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
#     source venv/Scripts/activate
# else
#     source venv/bin/activate
# fi
# 
# # Install backend dependencies
# echo_info "Installing backend dependencies..."
# pip install -r requirements.txt
# 
# if [ $? -ne 0 ]; then
#     echo_error "Failed to install backend dependencies."
#     exit 1
# fi
# 
# # Create user_data directory for scraped data
# echo_info "Creating user_data directory for scraped data..."
# mkdir -p user_data
# 
# # Start backend server in the background
# echo_info "Starting backend server..."
# $PYTHON_CMD app.py &
# BACKEND_PID=$!
# 
# # Wait a bit for the backend to start
# sleep 2
# 
# # Check if the backend is running
# if ! kill -0 $BACKEND_PID 2>/dev/null; then
#     echo_error "Backend failed to start."
#     exit 1
# fi
# 
# echo_success "Backend server started successfully (PID: $BACKEND_PID)"
# 
# # Switch to frontend directory
# cd ../frontend

# Switch to frontend directory
cd tradewizard/frontend

# Check if Node.js is installed
echo_info "Checking frontend dependencies..."
if ! command -v $FRONTEND_CMD &> /dev/null; then
    echo_error "Node.js not found. Please install Node.js 14 or later."
    
    # Kill MCP server before exiting
    kill $MCP_SERVER_PID
    exit 1
fi

# Install frontend dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo_info "Installing frontend dependencies..."
    $FRONTEND_CMD install
    
    if [ $? -ne 0 ]; then
        echo_error "Failed to install frontend dependencies."
        
        # Kill MCP server before exiting
        kill $MCP_SERVER_PID
        exit 1
    fi
fi

# Start the frontend in the background
echo_info "Starting frontend development server..."
BROWSER=none $FRONTEND_CMD start &
FRONTEND_PID=$!

# Wait a bit for the frontend to start
sleep 5

# Seed the database if needed
echo_info "Seeding the database..."
cd ../../mcp-servers/export-guru-mcp
npm run seed

# Initialize memory subsystem tables
echo_info "Initializing memory subsystem..."
export MEMORY_DB_URL="postgresql://seanking@localhost:5432/memory_db"
npm run init-memory

cd ../../tradewizard/frontend

echo_success "Frontend server started successfully (PID: $FRONTEND_PID)"
echo_success "TradeWizard is now running!"
echo_info "Services are available at:"
echo_info "Frontend: http://localhost:3000"
echo_info "Export-guru-mcp Server: http://localhost:3001"
echo_info "Press Ctrl+C to stop all servers"

# Function to handle cleanup on exit
function cleanup_on_exit() {
    echo_info "Shutting down..."
    
    # Kill the frontend and MCP server
    kill $FRONTEND_PID $MCP_SERVER_PID 2>/dev/null
    
    # Cleanup any remaining processes on the ports
    cleanup_processes
    
    # Stop Ollama if we started it
    if [ ! -z "$OLLAMA_PID" ]; then
        kill $OLLAMA_PID 2>/dev/null
    fi
    
    # Stop PostgreSQL if we started it
    echo_info "Stopping PostgreSQL..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - don't stop PostgreSQL as it might be used by other applications
        echo_info "PostgreSQL will continue running. Stop it manually if needed with: brew services stop postgresql@15"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux - don't stop PostgreSQL as it might be used by other applications
        echo_info "PostgreSQL will continue running. Stop it manually if needed with: sudo service postgresql stop"
    fi
    
    exit 0
}

# Set up trap for cleanup
trap cleanup_on_exit INT

# Wait for processes
wait 