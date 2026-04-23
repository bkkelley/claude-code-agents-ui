# Quick Start — No Terminal Required

1. Go to the [**Releases page**](https://github.com/bkkelley/claude-code-agents-ui/releases/latest).
2. Download:
   - **macOS / Linux:** the `.tar.gz` file (preserves executable bits on launchers)
   - **Windows:** the `.zip` file
3. Extract the archive anywhere (Downloads, Desktop, etc.)
4. **Double-click** the launcher for your OS:

| Platform | File |
|----------|------|
| macOS    | `Start-macOS.command` |
| Windows  | `Start-Windows.bat` |
| Linux    | `Start-Linux.sh` |

The launcher:
1. Checks that Node.js 20+ is installed (prompts you to download it if not)
2. Installs dependencies on first run
3. Builds and starts the server
4. Opens the app in your browser at `http://localhost:3030`

**Keep the launcher window open while using the app.** Closing it shuts down the server.

## First-time setup notes

### macOS — "Apple could not verify… is free of malware"

This is expected. macOS Gatekeeper blocks unsigned scripts downloaded from the internet until you explicitly allow them. Nothing is wrong with the launcher — you just need to approve it once.

**The reliable fix (works on every macOS version):**

1. Double-click `Start-macOS.command`. You'll see the "could not verify" warning. Click **Done** (or **Cancel**) to dismiss it.
2. Open **System Settings** (Apple menu → System Settings).
3. Go to **Privacy & Security** in the sidebar.
4. Scroll down to the **Security** section. You'll see a message like:
   > *"`Start-macOS.command` was blocked to protect your Mac."*
5. Click **Open Anyway** next to that message.
6. Authenticate with your password or Touch ID when prompted.
7. A confirmation dialog appears — click **Open Anyway** again.
8. Terminal launches and the app starts. You won't see this warning again for this file.

**Shortcut that sometimes works:** right-click (or Control-click) the file in Finder → **Open** → **Open** in the dialog. On older macOS this is enough; on Sequoia (15+) the System Settings route above is more reliable.

**Why this happens:** my launcher isn't code-signed with an Apple Developer ID. Signing would cost $99/yr and make the warning disappear entirely — a path worth considering only if you're distributing this broadly to non-technical users.

**If the file opens as a text file instead of running,** it lost its executable bit during extraction (common with `.zip`; the `.tar.gz` build avoids this). Fix with one Terminal command, or re-download the `.tar.gz` instead:

```
chmod +x Start-macOS.command
```

### Windows

Windows Defender SmartScreen may show a "Windows protected your PC" warning the first time. Click **More info** → **Run anyway**.

### Linux

You may need to mark the file executable first:

```
chmod +x Start-Linux.sh
```

Some file managers require you to open launchers via "Run in Terminal" from the right-click menu.

## Requirements

- **Node.js 20 or newer** — download from https://nodejs.org
- Internet access on first run (to install dependencies)
- About 500 MB of disk space for dependencies and build artifacts

## Troubleshooting

**"Port 3030 already in use"** — another process is using the port. Close it, or run with a different port:

```
PORT=4000 ./Start-macOS.command   # macOS/Linux
set PORT=4000 && Start-Windows.bat # Windows
```

**Browser didn't open** — manually visit http://localhost:3030 (or whatever port you set).

**Updates** — `git pull` in this folder, then delete `node_modules` and `.output` to force a fresh build on next launch.
