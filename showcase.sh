#!/bin/bash

# showcase.sh
# Script to quickly switch to the showcase branch and build the application for presentations

echo "==== TradeKing Showcase Setup ===="
echo "Switching to showcase branch..."
git checkout showcase

echo "Building showcase version..."
cd tradewizard/frontend
npm run build

echo "==== SHOWCASE VERSION READY ===="
echo "To start the application, run: cd tradewizard && npm start"
echo "Or use: sh start.sh" 