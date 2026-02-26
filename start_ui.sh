#!/bin/bash

# VigiCore UI Startup Script

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
UI_DIR="$DIR/Cybersecurity Dashboard UI System"

echo "Starting VigiCore UI..."

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed."
    exit 1
fi

# Navigate to UI directory
cd "$UI_DIR" || exit 1

# Install dependencies if node_modules does not exist
if [ ! -d "node_modules" ]; then
    echo "Installing UI dependencies..."
    npm install
fi

# Start the development server
echo "Starting Vite development server..."
npm run dev
