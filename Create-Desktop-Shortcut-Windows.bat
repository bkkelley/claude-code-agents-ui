@echo off
REM Creates a "Claude Agents UI" shortcut on the user's Desktop that
REM launches Start-Windows.bat. Safe to run multiple times — it overwrites.

setlocal
cd /d "%~dp0"

set TARGET=%~dp0Start-Windows.bat
set SHORTCUT=%USERPROFILE%\Desktop\Claude Agents UI.lnk

echo Creating Desktop shortcut...
echo   Target: %TARGET%
echo   Shortcut: %SHORTCUT%
echo.

powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell; ^
   $sc = $ws.CreateShortcut('%SHORTCUT%'); ^
   $sc.TargetPath = '%TARGET%'; ^
   $sc.WorkingDirectory = '%~dp0'; ^
   $sc.IconLocation = '%SystemRoot%\System32\shell32.dll,13'; ^
   $sc.Description = 'Launch Claude Code Agents UI'; ^
   $sc.Save()"

if exist "%SHORTCUT%" (
  echo [OK] Shortcut created. Double-click "Claude Agents UI" on your Desktop to launch.
) else (
  echo [X] Failed to create shortcut.
)

echo.
pause
