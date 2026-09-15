@echo off
title CampusCycle Launcher
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"
set "PATH=C:\Users\Manas J\AppData\Local\OpenAI\Codex\runtimes\cua_node\fb8898c05a62885e\bin;%PATH%"

echo =========================================================
echo   CampusCycle - College Second-Hand Marketplace
echo   "Give Your Things a Second Life"
echo =========================================================
echo.
echo Starting CampusCycle Server on port 5000...
echo (Serving full frontend website and backend API)
echo.

start "CampusCycle Web Engine" cmd /k "cd server && node server.js"

echo Waiting for database and server initialization...
timeout /t 5 /nobreak >nul

echo Opening CampusCycle in your browser...
start http://localhost:5000

echo.
echo =========================================================
echo   Website running at: http://localhost:5000
echo   Keep the server window open while using the website.
echo =========================================================
pause
