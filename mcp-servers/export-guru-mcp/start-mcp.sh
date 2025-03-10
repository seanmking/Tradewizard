#!/bin/bash

# Start the MCP server
echo "Starting Export Guru MCP Server..."
cd "$(dirname "$0")"
node src/simple-server.js 