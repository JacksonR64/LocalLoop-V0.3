#!/bin/bash

# LocalLoop Development Server Starter
# Ensures consistent port 3000 usage

echo "🔧 LocalLoop Dev Server Setup"
echo "=============================="

# Kill any existing process on port 3000
echo "🔍 Checking for existing processes on port 3000..."
PORT_PID=$(lsof -ti:3000)

if [ ! -z "$PORT_PID" ]; then
  echo "⚡ Killing existing process on port 3000 (PID: $PORT_PID)"
  kill -9 $PORT_PID
  sleep 1
fi

# Set consistent environment
export PORT=3000
export NEXT_PUBLIC_APP_URL="http://localhost:3000"

echo "🚀 Starting Next.js development server on port 3000..."
echo "📱 Local: http://localhost:3000"
echo "🌐 Network: http://$(ipconfig getifaddr en0):3000"
echo ""
echo "✅ Google OAuth configured for: http://localhost:3000/auth/callback"
echo ""

# Start the development server
npm run dev 