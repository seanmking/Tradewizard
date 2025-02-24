#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting TradeKing Development Environment...${NC}\n"

# Function to check if command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed${NC}"
        return 1
    fi
    return 0
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "${RED}Port $port is in use. Attempting to free it...${NC}"
        lsof -ti :$port | xargs kill -9 2>/dev/null
        sleep 2
    fi
}

# Check for required commands
echo -e "${BLUE}Checking dependencies...${NC}"
check_command node || { echo -e "${RED}Please install Node.js${NC}"; exit 1; }
check_command npm || { echo -e "${RED}Please install npm${NC}"; exit 1; }
check_command python3 || { echo -e "${RED}Please install Python 3${NC}"; exit 1; }

# Enhanced cleanup of existing processes
echo -e "${BLUE}Cleaning up existing processes...${NC}"
# Kill Python processes
pkill -9 -f "python.*app.py" 2>/dev/null
# Kill Node processes for frontend
pkill -9 -f "node.*vite" 2>/dev/null
pkill -9 -f "npm.*run dev" 2>/dev/null
# Check and free required ports
check_port 5001  # Backend port
check_port 3000  # Frontend port
# Remove any leftover PID files
rm -f .backend_pid .frontend_pid 2>/dev/null
sleep 2

# Setup backend
echo -e "${BLUE}Setting up backend environment...${NC}"
cd backend || { echo -e "${RED}Error: backend directory not found${NC}"; exit 1; }

# Create and activate virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating Python virtual environment...${NC}"
    python3 -m venv venv || { echo -e "${RED}Failed to create virtual environment${NC}"; exit 1; }
fi

# Activate virtual environment
echo -e "${BLUE}Activating virtual environment...${NC}"
source venv/bin/activate || { echo -e "${RED}Failed to activate virtual environment${NC}"; exit 1; }

# Install Python dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo -e "${BLUE}Installing Python dependencies...${NC}"
    pip install -r requirements.txt || { echo -e "${RED}Failed to install Python dependencies${NC}"; exit 1; }
fi

# Start backend server
echo -e "${BLUE}Starting backend server...${NC}"
python app.py &
BACKEND_PID=$!
echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"

# Wait for backend to fully start and check health
echo -e "${BLUE}Waiting for backend to initialize...${NC}"
sleep 3
if ! curl -s http://localhost:5001/health > /dev/null; then
    echo -e "${RED}Backend failed to start properly${NC}"
    kill -9 $BACKEND_PID 2>/dev/null
    exit 1
fi

# Setup frontend
echo -e "${BLUE}Setting up frontend environment...${NC}"
cd ../frontend || { echo -e "${RED}Error: frontend directory not found${NC}"; exit 1; }

# Install npm dependencies if needed
if [ -f "package.json" ]; then
    echo -e "${BLUE}Installing npm dependencies...${NC}"
    npm install || { echo -e "${RED}Failed to install npm dependencies${NC}"; exit 1; }
fi

# Start frontend
echo -e "${BLUE}Starting frontend development server...${NC}"
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend started with PID: $FRONTEND_PID${NC}"

# Save PIDs for cleanup
echo $BACKEND_PID > .backend_pid
echo $FRONTEND_PID > .frontend_pid

# Trap SIGINT and SIGTERM signals to properly cleanup
cleanup() {
    echo -e "\n${BLUE}Shutting down services...${NC}"
    if [ -f "venv/bin/activate" ]; then
        deactivate 2>/dev/null
    fi
    kill -9 $BACKEND_PID 2>/dev/null
    kill -9 $FRONTEND_PID 2>/dev/null
    rm -f .backend_pid .frontend_pid 2>/dev/null
    # Additional cleanup
    pkill -9 -f "python.*app.py" 2>/dev/null
    pkill -9 -f "node.*vite" 2>/dev/null
    pkill -9 -f "npm.*run dev" 2>/dev/null
    echo -e "${GREEN}All services stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

echo -e "\n${GREEN}Development environment is ready!${NC}"
echo -e "${BLUE}Frontend: http://localhost:3000${NC}"
echo -e "${BLUE}Backend: http://localhost:5001${NC}"
echo -e "${BLUE}Press Ctrl+C to stop all services${NC}\n"

# Keep script running and show logs
wait 