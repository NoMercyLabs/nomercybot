#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later
# Copyright (C) NoMercy Entertainment. All rights reserved.
#
# NomNomzBot — one-command deployment script for Linux/macOS
# Usage: chmod +x deploy.sh && ./deploy.sh

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${GREEN}[nomnomzbot]${NC} $*"; }
warn()  { echo -e "${YELLOW}[warning]${NC} $*"; }
error() { echo -e "${RED}[error]${NC} $*" >&2; }
bold()  { echo -e "${BOLD}$*${NC}"; }

DOCKER="docker"

# ── 1. Check / install Docker ─────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
    warn "Docker is not installed."
    read -rp "Install Docker now? [Y/n] " answer
    answer="${answer:-Y}"
    if [[ "$answer" =~ ^[Yy]$ ]]; then
        info "Installing Docker via get.docker.com..."
        curl -fsSL https://get.docker.com | sh
        if ! groups "$USER" | grep -q '\bdocker\b'; then
            sudo usermod -aG docker "$USER"
            warn "Added $USER to the docker group."
            warn "If permission errors occur, run: newgrp docker  or log out and back in."
        fi
    else
        error "Docker is required. Aborting."
        exit 1
    fi
fi

# ── 2. Check Docker Compose v2 ───────────────────────────────────────────────
if ! $DOCKER compose version &>/dev/null; then
    warn "Docker Compose v2 plugin not found."
    read -rp "Install docker-compose-plugin now? [Y/n] " answer
    answer="${answer:-Y}"
    if [[ "$answer" =~ ^[Yy]$ ]]; then
        if command -v apt-get &>/dev/null; then
            sudo apt-get update -qq && sudo apt-get install -y docker-compose-plugin
        elif command -v yum &>/dev/null; then
            sudo yum install -y docker-compose-plugin
        elif command -v dnf &>/dev/null; then
            sudo dnf install -y docker-compose-plugin
        else
            error "Cannot auto-install docker-compose-plugin on this system."
            error "Install manually: https://docs.docker.com/compose/install/"
            exit 1
        fi
    else
        error "Docker Compose v2 is required. Aborting."
        exit 1
    fi
fi

# ── 3. Create .env if missing ─────────────────────────────────────────────────
if [[ ! -f .env ]]; then
    info "No .env found — generating one..."
    cp .env.example .env

    JWT_SECRET=$(openssl rand -base64 64)
    ENCRYPTION_KEY=$(openssl rand -base64 32)
    POSTGRES_PASSWORD=$(openssl rand -hex 32)
    REDIS_PASSWORD=$(openssl rand -hex 32)

    # Inline sed replacements (portable: no -i extension needed on Linux)
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|"                 .env
    sed -i "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=${ENCRYPTION_KEY}|"     .env
    sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${POSTGRES_PASSWORD}|" .env
    sed -i "s|^REDIS_PASSWORD=.*|REDIS_PASSWORD=${REDIS_PASSWORD}|"     .env

    echo ""
    bold "Enter your Twitch credentials (https://dev.twitch.tv/console/apps):"
    read -rp "  Twitch Client ID:     " TWITCH_CLIENT_ID
    read -rp "  Twitch Client Secret: " TWITCH_CLIENT_SECRET

    echo ""
    bold "Enter your public API URL (the domain Twitch will redirect back to):"
    read -rp "  API Base URL [http://localhost:5080]: " API_BASE_URL
    API_BASE_URL="${API_BASE_URL:-http://localhost:5080}"

    sed -i "s|^TWITCH_CLIENT_ID=.*|TWITCH_CLIENT_ID=${TWITCH_CLIENT_ID}|"         .env
    sed -i "s|^TWITCH_CLIENT_SECRET=.*|TWITCH_CLIENT_SECRET=${TWITCH_CLIENT_SECRET}|" .env
    sed -i "s|^API_BASE_URL=.*|API_BASE_URL=${API_BASE_URL}|"                     .env

    info ".env created with generated secrets."
else
    info ".env already exists — skipping generation."
fi

# ── 4. Build and start ───────────────────────────────────────────────────────
info "Building and starting containers (this takes a few minutes the first time)..."
$DOCKER compose up -d --build

# ── 5. Wait for health check ──────────────────────────────────────────────────
info "Waiting for API to become healthy..."
API_PORT=$(grep "^API_HTTP_PORT=" .env 2>/dev/null | cut -d= -f2)
API_PORT="${API_PORT:-5080}"

MAX_WAIT=120  # seconds
ELAPSED=0
until curl -sf "http://localhost:${API_PORT}/health/live" &>/dev/null; do
    if [[ $ELAPSED -ge $MAX_WAIT ]]; then
        error "API did not become healthy within ${MAX_WAIT}s."
        echo "  Run: docker compose logs api"
        exit 1
    fi
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

# ── 6. Done ───────────────────────────────────────────────────────────────────
API_BASE=$(grep "^API_BASE_URL=" .env | cut -d= -f2)
FRONTEND_URL=$(grep "^FRONTEND_URL=" .env 2>/dev/null | cut -d= -f2 || true)
FRONTEND_URL="${FRONTEND_URL:-http://localhost:8081}"

echo ""
bold "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "NomNomzBot is running!"
bold "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "  ${BOLD}Web app:${NC}  ${FRONTEND_URL}"
echo -e "  ${BOLD}API:${NC}      http://localhost:${API_PORT}"
echo -e "  ${BOLD}API docs:${NC} http://localhost:${API_PORT}/scalar"
echo -e "  ${BOLD}Health:${NC}   http://localhost:${API_PORT}/health"
echo ""
echo "Register these 3 redirect URIs in your Twitch Developer Console:"
echo -e "  ${GREEN}${API_BASE}/api/v1/auth/twitch/callback${NC}"
echo -e "  ${GREEN}${API_BASE}/api/v1/auth/twitch/bot/callback${NC}"
echo -e "  ${GREEN}${API_BASE}/api/v1/channels/callback/bot${NC}"
echo ""
