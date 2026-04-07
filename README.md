# NomNomzBot

Twitch bot management platform. Stream commands, channel point rewards, moderation, music, and more.

🌐 **Hosted:** [nomnomz.bot](https://nomnomz.bot)
📦 **Self-hosted:** see below

---

## Deploy to a server (production)

**Requires: Docker only.** No .NET SDK, no Node, no Yarn — everything builds inside containers.

```bash
# Linux/macOS
git clone --recursive https://github.com/NoMercyLabs/nomnomzbot.git
cd nomnomzbot
chmod +x deploy.sh
./deploy.sh
```

```powershell
# Windows
git clone --recursive https://github.com/NoMercyLabs/nomnomzbot.git
cd nomnomzbot
.\deploy.ps1
```

The script:
1. Installs Docker if missing (Linux/macOS only — Windows users get a download link)
2. Generates all security keys automatically (`openssl rand`)
3. Prompts for Twitch credentials and your API domain
4. Runs `docker compose up -d --build`
5. Waits for the health check and prints your URLs

---

## Develop locally

**Requires: .NET 10 SDK, Node 22, Yarn, Docker (for Postgres + Redis)**

```bash
git clone --recursive https://github.com/NoMercyLabs/nomnomzbot.git
cd nomnomzbot
node setup.mjs
```

The setup script checks all prerequisites, walks through Twitch app creation, and starts the dev environment.

---

## Structure

- `nomnomzbot-server/` — .NET 10 backend API
- `nomnomzbot-app/` — Expo/React Native dashboard (web + mobile)

## Docs

- [Deployment Guide](DEPLOYMENT.md)
- [Security Architecture](SECURITY_ARCHITECTURE.md)

## License

AGPL-3.0
