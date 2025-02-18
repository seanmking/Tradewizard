#!/bin/bash

echo "🚀 Starting TradeKing Development Environment..."

# Function to check if a port is in use
check_port() {
    lsof -i :$1 >/dev/null 2>&1
    return $?
}

# Kill processes on specific ports if they exist
echo "🧹 Cleaning up existing processes..."
if check_port 5001; then
    echo "Killing process on port 5001..."
    lsof -ti:5001 | xargs kill -9
fi

if check_port 5173; then
    echo "Killing process on port 5173..."
    lsof -ti:5173 | xargs kill -9
fi

# Check if Ollama is running
echo "🤖 Checking Ollama service..."
if ! pgrep -x "ollama" > /dev/null; then
    echo "⚠️  Ollama is not running. Starting Ollama..."
    open -a Ollama
    # Wait for Ollama to start
    sleep 5
fi

# Navigate to project root
cd "$(dirname "$0")"

# Start backend server
echo "🔧 Starting backend server..."
cd backend
source venv/bin/activate
python3 app.py &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
sleep 3

# Check if backend started successfully
if ! check_port 5001; then
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to start..."
sleep 5

echo "✨ Development environment is ready!"
echo "📝 Backend running on http://localhost:5001"
echo "🌐 Frontend running on http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"

# Handle cleanup on script exit
cleanup() {
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Keep script running
wait 