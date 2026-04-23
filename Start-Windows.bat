@echo off
REM Claude Code Agents UI — Windows launcher
REM Double-click this file to start the app. It will open in your browser.

setlocal
cd /d "%~dp0"

cls
echo +-----------------------------------------+
echo ^|   Claude Code Agents UI                 ^|
echo ^|   Starting up...                        ^|
echo +-----------------------------------------+
echo.

REM --- Node.js check ---
where node >nul 2>&1
if errorlevel 1 (
  echo [X] Node.js is not installed.
  echo.
  echo Please install Node.js ^(v20 or newer^) from:
  echo   https://nodejs.org
  echo.
  echo After installing, double-click this file again.
  echo.
  pause
  exit /b 1
)

REM --- Install dependencies on first run ---
if not exist node_modules (
  echo [*] First run — installing dependencies ^(this takes a minute or two^)...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo [X] npm install failed. See messages above.
    pause
    exit /b 1
  )
  echo.
)

REM --- Start the server ---
if "%PORT%"=="" set PORT=3030
set URL=http://localhost:%PORT%

echo [*] Starting server on %URL%
echo     ^(First launch builds the app — may take 30–60 seconds^)
echo.
echo     WARNING: Keep this window open while using the app.
echo              Close it to shut down the server.
echo.

REM Open browser after a short delay so server has time to start
start "" /min cmd /c "timeout /t 8 /nobreak >nul & start %URL%"

REM Run server in foreground — closing this window kills it
node bin/start.mjs
