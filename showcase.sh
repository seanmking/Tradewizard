#!/bin/bash

# showcase.sh
# Script to set up and run the TradeKing showcase demo from a specific commit for investor presentations

# Set working directory to script location
cd "$(dirname "$0")"

# Color formatting
function echo_info() {
    echo -e "\033[1;34m$1\033[0m"
}

function echo_success() {
    echo -e "\033[1;32m$1\033[0m"
}

function echo_error() {
    echo -e "\033[1;31m$1\033[0m"
}

echo_info "==== TradeKing Investor Demo Setup ===="

# Make sure we're on the showcase-demo branch
echo_info "Switching to showcase-demo branch..."
git checkout showcase-demo

if [ $? -ne 0 ]; then
    echo_error "Failed to switch to showcase-demo branch. Please check if the branch exists."
    exit 1
fi

echo_success "Successfully switched to investor demo version"

# Install backend dependencies
echo_info "Setting up backend..."
cd tradewizard/backend

# Check if virtual environment exists and create if needed
if [ ! -d "venv" ]; then
    echo_info "Creating Python virtual environment..."
    python3 -m venv venv
    
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

# Install frontend dependencies
echo_info "Setting up frontend..."
cd ../frontend

# Install frontend dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo_info "Installing frontend dependencies..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo_error "Failed to install frontend dependencies."
        exit 1
    fi
fi

echo_success "==== SHOWCASE DEMO SETUP COMPLETE ===="
echo_info "To start the application, run: sh start.sh"
echo_info "Once started, the application will be available at:"
echo_info "Frontend: http://localhost:3000"
echo_info "Backend: http://localhost:5002"
echo_info ""
echo_info "After your demo is complete, you can return to your development work with:"
echo_info "git checkout main"
echo_info "git stash pop # To restore your uncommitted changes" 