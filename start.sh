#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting TradeKing Development Environment...${NC}\n"

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "${RED}Port $port is in use. Attempting to free it...${NC}"
        lsof -ti :$port | xargs kill -9 2>/dev/null
        sleep 2
    fi
}

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

# Start backend
echo -e "${BLUE}Starting backend server...${NC}"
cd backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!
echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"

# Wait for backend to fully start
echo -e "${BLUE}Waiting for backend to initialize...${NC}"
sleep 3

# Start frontend
echo -e "${BLUE}Starting frontend development server...${NC}"
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend started with PID: $FRONTEND_PID${NC}"

# Save PIDs for cleanup
echo $BACKEND_PID > .backend_pid
echo $FRONTEND_PID > .frontend_pid

# Trap SIGINT and SIGTERM signals to properly cleanup
cleanup() {
    echo -e "\n${BLUE}Shutting down services...${NC}"
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
echo -e "${BLUE}Press Ctrl+C to stop all services${NC}\n"

# Keep script running and show logs
wait 