#!/bin/bash

# Install the AI Agent as a package that can be imported by the Flask backend

echo "Installing AI Agent..."

# Compile TypeScript
echo "Compiling TypeScript..."
npx tsc

# Create a symbolic link to the dist directory
echo "Creating symbolic link..."
ln -sf "$(pwd)/dist" "$(pwd)/tradewizard/backend/aiagent"

echo "AI Agent installed successfully!"
echo "You can now import the AI Agent in the Flask backend using:"
echo "from aiagent.agent.streamlined_core import StreamlinedAgentCore"
echo "from aiagent.database.connection import Database" 