#!/bin/bash

# Run the streamlined AI Agent example

echo "Compiling TypeScript..."
npx tsc

echo "Running streamlined example..."
node dist/examples/run-streamlined-example.js

echo "Done!" 