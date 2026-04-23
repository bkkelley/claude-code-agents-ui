#!/bin/bash
# Claude Code Agents UI — Linux launcher
# Make executable (chmod +x Start-Linux.sh) and double-click to start.

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
  echo "Install with your package manager, for example:"
  echo "  Ubuntu/Debian:  sudo apt install nodejs npm"
  echo "  Fedora:         sudo dnf install nodejs npm"
  echo "  Arch:           sudo pacman -S nodejs npm"
  echo "Or download from https://nodejs.org"
  echo ""
  read -n 1 -s -r -p "Press any key to close..."
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "⚠️  Node.js version is too old (v$NODE_VERSION). Please upgrade to v20 or newer."
  read -n 1 -s -r -p "Press any key to close..."
  exit 1
fi

# --- Install dependencies on first run ---
if [ ! -d node_modules ]; then
  echo "📦 First run — installing dependencies..."
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

node bin/start.mjs &
SERVER_PID=$!

trap "echo ''; echo 'Shutting down...'; kill $SERVER_PID 2>/dev/null; exit 0" EXIT INT TERM

# Wait for server to accept connections
for i in $(seq 1 120); do
  if curl -s -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null | grep -qE "^(200|3..|4..)$"; then
    break
  fi
  sleep 1
done

echo ""
echo "✅ Ready! Opening $URL..."
echo ""
echo "   ⚠️  Keep this window open while using the app."
echo ""

# Try common browser-open commands
if command -v xdg-open &> /dev/null; then
  xdg-open "$URL" &
elif command -v gnome-open &> /dev/null; then
  gnome-open "$URL" &
else
  echo "   Open this URL manually: $URL"
fi

wait $SERVER_PID
