#!/usr/bin/env bash
# ==============================================================================
# Nsei Sukul Managements System: Sukul Hub Local Server Launcher
# ==============================================================================

echo "====================================================================="
echo "   NSEI SUKUL MANAGEMENTS SYSTEM: SUKUL HUB (LAN EDGE SERVER)"
echo "====================================================================="
echo ""
echo "Starting local school server..."

if [ ! -f .env.local ]; then
    if [ -f .env.hub ]; then
        cp .env.hub .env.local
    elif [ -f .env.hub.example ]; then
        cp .env.hub.example .env.local
    fi
fi

if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "Starting containerized Sukul Hub via Docker Compose..."
    docker-compose -f docker-compose.hub.yml up -d
else
    echo "Starting native Node.js instance..."
    export NEXT_PUBLIC_HUB_MODE=true
    export PORT=3000
    npm run start
fi

LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
echo ""
echo "====================================================================="
echo " [SUCCESS] Sukul Hub is running!"
echo " Local Access URL: http://${LAN_IP:-127.0.0.1}:3000"
echo " Staff can connect over the school Wi-Fi without internet."
echo "====================================================================="
