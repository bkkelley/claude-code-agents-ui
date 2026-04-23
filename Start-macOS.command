#!/bin/bash
# Claude Code Agents UI — macOS launcher
# Double-click this file to start the app. It will open in your browser.

set -e
cd "$(dirname "$0")"

clear
echo "┌─────────────────────────────────────────┐"
echo "│   Claude Code Agents UI                 │"
echo "│   Starting up...                        │"
echo "└─────────────────────────────────────────┘"
echo ""

# --- Node.js check ---
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed."
  echo ""
  echo "Please install Node.js (v20 or newer) from:"
  echo "  https://nodejs.org"
  echo ""
  echo "After installing, double-click this file again."
  echo ""
  read -n 1 -s -r -p "Press any key to close this window..."
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "⚠️  Node.js version is too old (v$NODE_VERSION). Please upgrade to v20 or newer."
  echo "   Download from https://nodejs.org"
  read -n 1 -s -r -p "Press any key to close this window..."
  exit 1
fi

# --- Install dependencies on first run ---
if [ ! -d node_modules ]; then
  echo "📦 First run — installing dependencies (this takes a minute or two)..."
  echo ""
  npm install
  echo ""
fi

# --- Start the server ---
PORT=${PORT:-3030}
URL="http://localhost:$PORT"

echo "🚀 Starting server on $URL"
echo "   (First launch builds the app — may take 30–60 seconds)"
echo ""

# Run server in background
node bin/start.mjs &
SERVER_PID=$!

# Ensure server is killed if this window closes or Ctrl+C is hit
trap "echo ''; echo 'Shutting down...'; kill $SERVER_PID 2>/dev/null; exit 0" EXIT INT TERM

# Wait for server to accept connections (poll port)
for i in $(seq 1 120); do
  if curl -s -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null | grep -qE "^(200|3..|4..)$"; then
    break
  fi
  sleep 1
done

echo ""
echo "✅ Ready! Opening $URL in your browser..."
echo ""
echo "   ⚠️  Keep this window open while using the app."
echo "       Close it to shut down the server."
echo ""

open "$URL"

# Keep window alive while server runs
wait $SERVER_PID
