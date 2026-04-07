#!/bin/sh
set -e

# Strip protocol prefix from hostnames if present (e.g. https://bot-api.nomercy.tv → bot-api.nomercy.tv)
API_HOST=$(echo "${API_BASE_URL:-http://localhost:5080}" | sed 's|^https\?://||' | sed 's|/.*||')
FRONTEND_HOST=$(echo "${FRONTEND_URL:-http://localhost:8081}" | sed 's|^https\?://||' | sed 's|/.*||')

sed \
  -e "s|API_HOSTNAME_PLACEHOLDER|${API_HOST}|g" \
  -e "s|FRONTEND_HOSTNAME_PLACEHOLDER|${FRONTEND_HOST}|g" \
  /etc/cloudflared/config.yml.tpl > /tmp/config.yml

exec cloudflared tunnel --config /tmp/config.yml run --token "${CLOUDFLARE_TUNNEL_TOKEN}"
