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

### macOS

When you first double-click `Start-macOS.command`, macOS may block it with a "cannot be opened because it is from an unidentified developer" warning.

**Fix:** Right-click the file → **Open** → click **Open** in the dialog. You only need to do this once.

If the file opens as a text file instead of running, it lost its executable bit. Fix with one Terminal command:

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
