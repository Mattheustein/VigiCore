#!/bin/bash
echo "Starting VigiCore Cybersecurity Dashboard..."

# Navigate to the correct directory where the UI system lives
cd "$(dirname "$0")/Cybersecurity Dashboard UI System"

# Start the Vite development server
npm run dev
