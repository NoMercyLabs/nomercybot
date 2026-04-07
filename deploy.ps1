#Requires -Version 5.1
# SPDX-License-Identifier: AGPL-3.0-or-later
# Copyright (C) NoMercy Entertainment. All rights reserved.
#
# NomNomzBot — one-command deployment script for Windows
# Usage: .\deploy.ps1

function Write-Info { param($msg) Write-Host "[nomnomzbot] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "[warning] $msg" -ForegroundColor Yellow }
function Write-Err  { param($msg) Write-Host "[error] $msg" -ForegroundColor Red }
function Write-Bold { param($msg) Write-Host $msg -ForegroundColor White }

# ── 1. Check Docker ───────────────────────────────────────────────────────────
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Warn "Docker Desktop is not installed."
    Write-Host ""
    Write-Host "Download and install Docker Desktop, then re-run this script:"
    Write-Host "  https://docs.docker.com/desktop/install/windows-install/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Make sure 'Use WSL 2 based engine' is enabled in Docker Desktop settings."
    exit 1
}

# ── 2. Check Docker Compose v2 ────────────────────────────────────────────────
try {
    docker compose version | Out-Null
} catch {
    Write-Err "Docker Compose v2 is not available."
    Write-Host "Update Docker Desktop to the latest version and try again."
    exit 1
}

# ── 3. Create .env if missing ─────────────────────────────────────────────────
if (-not (Test-Path .env)) {
    Write-Info "No .env found — generating one..."
    Copy-Item .env.example .env

    # Generate secrets using .NET cryptography (no external tools needed)
    function New-RandomBytes([int]$count) {
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        $buf = New-Object byte[] $count
        $rng.GetBytes($buf)
        return $buf
    }
    function To-Hex([byte[]]$bytes) {
        return ($bytes | ForEach-Object { $_.ToString('x2') }) -join ''
    }

    $jwtSecret       = [Convert]::ToBase64String((New-RandomBytes 64))
    $encKey          = [Convert]::ToBase64String((New-RandomBytes 32))
    $postgresPassword = To-Hex (New-RandomBytes 32)
    $redisPassword   = To-Hex (New-RandomBytes 32)

    $envContent = Get-Content .env
    $envContent = $envContent -replace '^JWT_SECRET=.*',          "JWT_SECRET=$jwtSecret"
    $envContent = $envContent -replace '^ENCRYPTION_KEY=.*',      "ENCRYPTION_KEY=$encKey"
    $envContent = $envContent -replace '^POSTGRES_PASSWORD=.*',   "POSTGRES_PASSWORD=$postgresPassword"
    $envContent = $envContent -replace '^REDIS_PASSWORD=.*',      "REDIS_PASSWORD=$redisPassword"
    $envContent | Set-Content .env -Encoding UTF8

    Write-Host ""
    Write-Bold "Enter your Twitch credentials (https://dev.twitch.tv/console/apps):"
    $twitchClientId     = Read-Host "  Twitch Client ID"
    $twitchClientSecret = Read-Host "  Twitch Client Secret"

    Write-Host ""
    Write-Bold "Enter your public API URL (the domain Twitch will redirect back to):"
    $apiBaseUrl = Read-Host "  API Base URL [http://localhost:5080]"
    if ([string]::IsNullOrWhiteSpace($apiBaseUrl)) { $apiBaseUrl = "http://localhost:5080" }

    $envContent = Get-Content .env
    $envContent = $envContent -replace '^TWITCH_CLIENT_ID=.*',     "TWITCH_CLIENT_ID=$twitchClientId"
    $envContent = $envContent -replace '^TWITCH_CLIENT_SECRET=.*', "TWITCH_CLIENT_SECRET=$twitchClientSecret"
    $envContent = $envContent -replace '^API_BASE_URL=.*',         "API_BASE_URL=$apiBaseUrl"
    $envContent | Set-Content .env -Encoding UTF8

    Write-Info ".env created with generated secrets."
} else {
    Write-Info ".env already exists — skipping generation."
}

# ── 4. Build and start ────────────────────────────────────────────────────────
Write-Info "Building and starting containers (this takes a few minutes the first time)..."
docker compose up -d --build
if ($LASTEXITCODE -ne 0) {
    Write-Err "docker compose up failed. Check the output above."
    exit 1
}

# ── 5. Wait for health check ──────────────────────────────────────────────────
Write-Info "Waiting for API to become healthy..."

$apiPort = (Select-String '^API_HTTP_PORT=(.+)' .env -ErrorAction SilentlyContinue)?.Matches?.Groups[1]?.Value
if (-not $apiPort) { $apiPort = "5080" }

$maxWait = 120
$elapsed = 0
$healthy = $false

while ($elapsed -lt $maxWait) {
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:$apiPort/health/live" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        if ($resp.StatusCode -eq 200) { $healthy = $true; break }
    } catch {}
    Start-Sleep 5
    $elapsed += 5
}

if (-not $healthy) {
    Write-Err "API did not become healthy within ${maxWait}s."
    Write-Host "Check logs with: docker compose logs api"
    exit 1
}

# ── 6. Done ───────────────────────────────────────────────────────────────────
$apiBase = ((Select-String '^API_BASE_URL=(.+)' .env).Matches.Groups[1].Value)
$frontendUrl = ((Select-String '^FRONTEND_URL=(.+)' .env -ErrorAction SilentlyContinue)?.Matches?.Groups[1]?.Value)
if (-not $frontendUrl) { $frontendUrl = "http://localhost:8081" }

Write-Host ""
Write-Bold "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Info "NomNomzBot is running!"
Write-Bold "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""
Write-Host "  Web app:  $frontendUrl"
Write-Host "  API:      http://localhost:$apiPort"
Write-Host "  API docs: http://localhost:$apiPort/scalar"
Write-Host "  Health:   http://localhost:$apiPort/health"
Write-Host ""
Write-Host "Register these 3 redirect URIs in your Twitch Developer Console:"
Write-Host "  $apiBase/api/v1/auth/twitch/callback" -ForegroundColor Cyan
Write-Host "  $apiBase/api/v1/auth/twitch/bot/callback" -ForegroundColor Cyan
Write-Host "  $apiBase/api/v1/channels/callback/bot" -ForegroundColor Cyan
Write-Host ""
