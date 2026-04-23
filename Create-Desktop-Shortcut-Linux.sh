#!/bin/bash
# Creates a "Claude Agents UI" .desktop entry so the app appears in your
# application launcher and can be placed on the Desktop. Safe to rerun.

set -e
cd "$(dirname "$0")"

REPO_ROOT="$(pwd)"
TARGET="$REPO_ROOT/Start-Linux.sh"
APPS_DIR="$HOME/.local/share/applications"
DESKTOP_FILE="$APPS_DIR/claude-agents-ui.desktop"

if [ ! -f "$TARGET" ]; then
  echo "❌ Can't find Start-Linux.sh in $REPO_ROOT — run this script from inside the extracted release folder."
  exit 1
fi

chmod +x "$TARGET"

mkdir -p "$APPS_DIR"

cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Claude Agents UI
Comment=Manage Claude Code agents, skills, and commands
Exec=bash -c "cd '$REPO_ROOT' && ./Start-Linux.sh"
Path=$REPO_ROOT
Icon=utilities-terminal
Terminal=true
Categories=Development;Utility;
StartupNotify=true
EOF

chmod +x "$DESKTOP_FILE"

echo "✅ Created $DESKTOP_FILE"
echo ""
echo "You should now see 'Claude Agents UI' in your applications menu."
echo ""
echo "To add a Desktop icon as well:"
echo "  cp \"$DESKTOP_FILE\" \"\$HOME/Desktop/\""
echo "  chmod +x \"\$HOME/Desktop/claude-agents-ui.desktop\""
echo ""
echo "On some desktops (GNOME 40+), right-click the Desktop icon → Allow Launching."
