@echo off
title Nsei Sukul Managements System: Sukul Hub Local Server
echo =====================================================================
echo    NSEI SUKUL MANAGEMENTS SYSTEM: SUKUL HUB (LAN EDGE SERVER)
echo =====================================================================
echo.
echo Starting local school server...
echo Staff can connect to this computer over the local school Wi-Fi.
echo Zero internet connection required.
echo.

if not exist .env.local (
    if exist .env.hub (
        copy .env.hub .env.local >nul
    ) else if exist .env.hub.example (
        copy .env.hub.example .env.local >nul
    )
)

echo Checking for Docker...
where docker >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Starting containerized Sukul Hub via Docker Compose...
    docker compose -f docker-compose.hub.yml up -d
    goto ShowInfo
)

echo Docker not found, starting native Node.js instance...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Neither Docker nor Node.js was found on this PC.
    echo Please install Docker Desktop or Node.js to run the Sukul Hub.
    pause
    exit /b 1
)

set NEXT_PUBLIC_HUB_MODE=true
set PORT=3000
npm run start

:ShowInfo
echo.
echo =====================================================================
echo  [SUCCESS] Sukul Hub is running!
echo  Open http://localhost:3000 on this PC.
echo.
echo  To let other computers and phones on the school Wi-Fi connect:
echo  1. Open Command Prompt and type 'ipconfig'
echo  2. Look for 'IPv4 Address' (e.g. 192.168.1.100)
echo  3. Tell staff to go to http://YOUR_IP:3000 in their phone browser.
echo =====================================================================
echo.
pause
