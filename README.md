# NomercyBot

An open-source, multi-tenant Twitch bot platform. One deployment supports unlimited channels — each streamer gets a full isolated dashboard, pipeline editor, custom commands, event responses, timers, overlays, and integrations (Spotify, Discord, YouTube, TTS).

Licensed under **AGPL-3.0**. Self-hosted deployments have zero restrictions.

---

## Repository Layout

```
NoMercyLabs/
├── nomercybot/           # Backend — .NET 10, PostgreSQL, Redis
│   ├── src/
│   │   ├── NomercyBot.Domain/          # Entities, domain events, value objects
│   │   ├── NomercyBot.Application/     # Use cases, interfaces, pipeline engine
│   │   ├── NomercyBot.Infrastructure/  # EF Core, Twitch services, EventSub, SignalR
│   │   └── NomercyBot.Api/             # ASP.NET Core host, controllers, hubs
│   ├── tests/                          # xUnit test projects (one per layer)
│   ├── docker-compose.yml
│   └── .env.example
├── nomercybot-app/       # Frontend — Expo (React Native), web + iOS + Android
│   ├── app/              # Expo Router file-based routes
│   ├── .env.development
│   └── .env.production
└── nomercybot-design/    # HTML mockups, research docs, architecture specs
```

---

## Prerequisites

| Tool | Minimum Version | Notes |
|------|----------------|-------|
| [.NET SDK](https://dotnet.microsoft.com/download) | **10.0** | `dotnet --version` to check |
| [Node.js](https://nodejs.org/) | **20 LTS** | Required by Expo 55 |
| [Yarn](https://yarnpkg.com/) | **1.22** | `npm install -g yarn` |
| [Docker + Docker Compose](https://docs.docker.com/get-docker/) | any recent | For Postgres 16 + Redis 7 |
| A [Twitch Developer Application](https://dev.twitch.tv/console/apps) | — | Required; see setup below |

**Optional integrations** (nothing breaks without these — features are disabled):

| Integration | Where to create |
|------------|-----------------|
| Spotify | [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) |
| Discord bot | [Discord Developer Portal](https://discord.com/developers/applications) |
| YouTube Data API | [Google Cloud Console](https://console.cloud.google.com/) |
| Azure Cognitive Services (TTS) | [Azure Portal](https://portal.azure.com/) |
| ElevenLabs (TTS) | [ElevenLabs](https://elevenlabs.io/) |

---

## Creating a Twitch Application

1. Go to [dev.twitch.tv/console/apps](https://dev.twitch.tv/console/apps) and click **Register Your Application**.
2. Fill in:
   - **Name**: anything (e.g. `MyBot Dev`)
   - **OAuth Redirect URLs** — add all three:
     ```
     http://localhost:5080/api/v1/auth/twitch/callback
     http://localhost:5080/api/v1/auth/twitch/bot/callback
     http://localhost:5080/api/v1/channels/callback/bot
     ```
     > If you are using a Cloudflare tunnel or public URL instead of `localhost:5080`, use that base URL here instead.
   - **Category**: Chat Bot
3. Click **Create**, then click **Manage** on your new app to get:
   - `Client ID`
   - `Client Secret` (click **New Secret**)

> **Dev shortcut**: `appsettings.Development.json` already contains working Twitch credentials for a shared development app pre-configured to work with the `bot-dev-api.nomercy.tv` tunnel. You can use these credentials as-is while developing locally with a Cloudflare tunnel pointed at port 5080. Replace them with your own credentials for a standalone setup.

---

## Environment Setup

### Backend — `nomercybot/.env`

Copy the example file and fill in values:

```bash
cd nomercybot
cp .env.example .env
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `POSTGRES_USER` | no | `nomercybot` | PostgreSQL username |
| `POSTGRES_PASSWORD` | **yes** for production | `nomercybot_dev` | PostgreSQL password |
| `JWT_SECRET` | **yes** for production | `dev-secret-key-at-least-32-characters-long!!` | Signing key — must be ≥ 32 characters. Generate with `openssl rand -base64 32` |
| `JWT_ISSUER` | no | `nomercybot` | JWT issuer claim |
| `JWT_AUDIENCE` | no | `nomercybot` | JWT audience claim |
| `ENCRYPTION_KEY` | **yes** for production | `ZGV2...` (base64) | AES key for storing OAuth tokens. Generate with `openssl rand -base64 32` |
| `TWITCH_CLIENT_ID` | **yes** | — | From your Twitch app |
| `TWITCH_CLIENT_SECRET` | **yes** | — | From your Twitch app |
| `TWITCH_BOT_USERNAME` | **yes** | — | Twitch username of the bot account (the account that will chat) |
| `REDIS_CONNECTION_STRING` | no | `redis:6379` | Redis connection string (uses service name inside Docker) |
| `SPOTIFY_CLIENT_ID` | no | — | Enables music integration |
| `SPOTIFY_CLIENT_SECRET` | no | — | Enables music integration |
| `DISCORD_CLIENT_ID` | no | — | Enables Discord integration |
| `DISCORD_CLIENT_SECRET` | no | — | Enables Discord integration |
| `YOUTUBE_CLIENT_ID` | no | — | Enables YouTube music provider |
| `YOUTUBE_CLIENT_SECRET` | no | — | Enables YouTube music provider |
| `AZURE_TTS_API_KEY` | no | — | Azure Cognitive Services key for TTS |
| `AZURE_TTS_REGION` | no | `westeurope` | Azure region for TTS |
| `ELEVENLABS_API_KEY` | no | — | ElevenLabs key for TTS |
| `API_HTTP_PORT` | no | `5080` | Host port for the API container |
| `API_HTTPS_PORT` | no | `5081` | Host HTTPS port |
| `POSTGRES_PORT` | no | `5432` | Host port for Postgres |
| `REDIS_PORT` | no | `6379` | Host port for Redis |
| `ADMINER_PORT` | no | `8082` | Host port for Adminer (DB browser) |

> For **`dotnet run` local dev** (not Docker), Twitch credentials go in `nomercybot/src/NomercyBot.Api/appsettings.Development.json` instead. All other settings fall back to defaults from `appsettings.json`.

### Frontend — `nomercybot-app/.env.development`

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | **yes** | URL of the running backend API. Use `http://localhost:5080` for local dev, or your tunnel/server URL |
| `EXPO_PUBLIC_PROJECT_ID` | for native builds only | Your Expo project ID (see [Expo dashboard](https://expo.dev/)). Required for push notifications and EAS builds. **Not needed for `expo start --web`** |

---

## Getting Started

### 1. Clone

```bash
git clone https://github.com/NoMercyLabs/nomercybot.git
cd nomercybot
```

### 2. Start Infrastructure (Postgres + Redis)

For local development you only need Postgres and Redis — skip the `api` container and run the API with `dotnet run` instead:

```bash
cd nomercybot
docker-compose up -d postgres redis adminer
```

This starts:
- **Postgres 16** on `localhost:5432`
- **Redis 7** on `localhost:6379`
- **Adminer** (database browser) on `http://localhost:8082`

Wait for health checks to pass:
```bash
docker-compose ps   # both should show "healthy"
```

### 3. Backend Setup

```bash
cd nomercybot/src/NomercyBot.Api
```

For local dev without Docker, edit `appsettings.Development.json` with your Twitch credentials (or use the pre-filled dev credentials):

```json
{
  "Twitch": {
    "ClientId": "YOUR_CLIENT_ID",
    "ClientSecret": "YOUR_CLIENT_SECRET",
    "BotUsername": "YourBotAccount"
  }
}
```

Install the EF Core tools if you haven't:
```bash
dotnet tool install --global dotnet-ef
```

Run the API:
```bash
dotnet run
```

On first start the API automatically:
1. Waits for Postgres and Redis to be reachable
2. Runs all EF Core migrations (creates the schema)
3. Seeds reference data (TTS voices, permission presets, etc.)
4. Starts the Twitch EventSub WebSocket connection

The API is now available at:
- `http://localhost:5080` — HTTP
- `http://localhost:5080/scalar` — Interactive API docs (Scalar UI)
- `http://localhost:5080/health` — Full health status (JSON)
- `http://localhost:5080/health/live` — Liveness probe
- `http://localhost:5080/health/ready` — Readiness probe

### 4. Frontend Setup

```bash
cd nomercybot-app
yarn install
```

Set your API URL in `.env.development`:
```
EXPO_PUBLIC_API_URL=http://localhost:5080
```

Run the web app:
```bash
yarn web
```

The dashboard opens at `http://localhost:8081` (or `19006` depending on Expo version).

To run on a device/emulator:
```bash
yarn ios      # requires Xcode (macOS only)
yarn android  # requires Android Studio
```

### 5. First-Time Setup Wizard

The app detects when no streamer account is configured and routes to `/setup`. The wizard walks through:

1. **Connect Twitch account** — OAuth flow authorizing the streamer account with initial scopes
2. **Connect bot account** — separate OAuth for the bot identity that will chat in your channel
3. **Configure basic settings** — bot prefix, default language, timezone
4. **Enable optional integrations** — Spotify, Discord, etc. (can be done later from Settings)

After completing setup you land on the main dashboard at `/`.

### 6. Cloudflare Tunnel (Optional — needed for Twitch OAuth redirect)

Twitch OAuth requires HTTPS redirect URIs. For local development you have two options:

**Option A — Use the shared dev tunnel (easiest)**

The pre-filled `appsettings.Development.json` credentials point to `bot-dev-api.nomercy.tv`, a Cloudflare tunnel. If you have access to that tunnel, no extra setup is required.

**Option B — Create your own tunnel**

1. Install [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/)
2. Create a tunnel:
   ```bash
   cloudflared tunnel --url http://localhost:5080
   ```
3. Copy the generated `*.trycloudflare.com` URL
4. Add it as a redirect URI in your Twitch app (`https://your-tunnel.trycloudflare.com/api/v1/auth/twitch/callback`, etc.)
5. Set `App__BaseUrl` in your env or `appsettings.Development.json`:
   ```json
   { "App": { "BaseUrl": "https://your-tunnel.trycloudflare.com" } }
   ```

**Option C — Skip tunnels entirely (no Twitch OAuth)**

If you only want to develop backend features without Twitch login, you can call the API directly and skip the OAuth flows. The `/health` and all non-auth endpoints work without any tunnel.

### 7. Full Docker Stack (Production / Staging)

To run everything in Docker:

```bash
cd nomercybot
cp .env.example .env
# Fill in all required values in .env
docker-compose up -d
```

This builds and runs the API container alongside Postgres, Redis, and Adminer. The API is exposed on `$API_HTTP_PORT` (default `5080`).

---

## Architecture Overview

### Backend — Clean Architecture

```
NomercyBot.Domain          → Entities, domain events, value objects, interfaces
NomercyBot.Application     → Use cases (services), pipeline engine, IEventBus
NomercyBot.Infrastructure  → EF Core, Twitch services, Spotify/Discord/TTS providers
NomercyBot.Api             → ASP.NET Core host, JWT auth, SignalR hubs, controllers
```

No MediatR. Services are called directly via typed interfaces registered in DI.

### Authentication Flow

1. User hits `/api/v1/auth/twitch/login` → redirected to Twitch OAuth
2. Twitch calls back to `/api/v1/auth/twitch/callback` with code
3. API exchanges code for tokens, stores encrypted tokens in Postgres, returns a JWT
4. Frontend stores the JWT (in `expo-secure-store`) and sends it as `Authorization: Bearer` on all requests
5. SignalR hubs also accept the JWT via `?access_token=` query string

Multi-tenancy is resolved per-request by `TenantResolutionMiddleware` from the JWT `sub` claim — each authenticated user sees only their own channel data.

### Twitch EventSub

The bot uses **EventSub WebSocket** (`wss://eventsub.wss.twitch.tv/ws`) — not webhooks. This means:

- **No public URL required** to receive Twitch events during local development
- The `TwitchEventSubService` runs as a `IHostedService` and manages the WebSocket lifecycle automatically
- Reconnects with exponential backoff on disconnect
- Subscriptions are re-registered after reconnect

### Pipeline Engine

Commands and event responses use a visual pipeline system. Each pipeline is a list of **actions** (SendMessage, SendReply, Timeout, Ban, Shoutout, SetVariable, Wait, PlayMusic, Stop, etc.) with optional **conditions** (UserRole, Random). No scripting — all action blocks are compiled C# classes implementing `ICommandAction`.

Template strings support 90+ variables: `{{user.name}}`, `{{channel.title}}`, `{{stream.uptime}}`, `{{args.1}}`, etc.

### SignalR Hubs

| Hub | Path | Purpose |
|-----|------|---------|
| `DashboardHub` | `/hubs/dashboard` | Real-time dashboard updates (chat feed, stats, alerts) |
| `OverlayHub` | `/hubs/overlay` | Browser-source overlays (alerts, now-playing widgets) |
| `OBSRelayHub` | `/hubs/obs` | OBS WebSocket relay |
| `AdminHub` | `/hubs/admin` | Platform admin operations |

---

## Development

### Running Tests

```bash
cd nomercybot
dotnet test                          # run all test projects
dotnet test tests/NomercyBot.Domain.Tests
dotnet test tests/NomercyBot.Application.Tests
dotnet test tests/NomercyBot.Infrastructure.Tests
dotnet test tests/NomercyBot.Api.Tests
```

Frontend tests:
```bash
cd nomercybot-app
yarn test
```

Typecheck the frontend:
```bash
yarn typecheck
```

Lint:
```bash
yarn lint
```

### Adding a New Pipeline Action

1. Create a class in `NomercyBot.Infrastructure/Pipeline/Actions/` implementing `ICommandAction`:
   ```csharp
   public sealed class MyNewAction : ICommandAction
   {
       public string Type => "my_new_action";
       public Task ExecuteAsync(PipelineContext ctx, CancellationToken ct) { ... }
   }
   ```
2. Register it in `InfrastructureServiceExtensions` with the other pipeline actions.
3. Add the corresponding DTO to `NomercyBot.Application/Contracts/Pipeline/`.
4. Add a card to the pipeline builder UI in `nomercybot-app/app/(dashboard)/pipelines/`.

### Adding a New API Endpoint

1. Add a use-case service interface in `NomercyBot.Application/Common/Interfaces/`.
2. Implement it in `NomercyBot.Infrastructure/Services/`.
3. Create a controller in `NomercyBot.Api/Controllers/` using `[ApiVersion("1.0")]` and `[Route("api/v{version:apiVersion}/...")]`.
4. All responses follow `StatusResponseDto<T>` / `PaginatedResponse<T>` shapes (see existing controllers for reference).

### Code Style

- **Nullable reference types** enabled everywhere (`<Nullable>enable</Nullable>`)
- **Global usings** in each project's `GlobalUsings.cs`
- Async all the way down — no `.Result` or `.Wait()`
- Repository pattern with `IUnitOfWork` for persistence
- `Result<T>` for operations that can fail without throwing

---

## Expo / EAS — Do You Need Secrets?

**For local web development**: No Expo account or secrets needed. `yarn web` works with just `EXPO_PUBLIC_API_URL` set.

**For native device builds via EAS** (`eas build`):
1. Create an account at [expo.dev](https://expo.dev/)
2. Run `eas init` in `nomercybot-app/` to link the project
3. Set `EXPO_PUBLIC_PROJECT_ID` in `.env.development` (and `.env.production`) to the ID shown in the Expo dashboard
4. For production, set the API URL as an EAS secret instead of committing it:
   ```bash
   eas secret:create --name EXPO_PUBLIC_API_URL --value https://your-api.example.com
   ```
5. Push notification certificates are managed automatically by EAS — no manual cert handling required

**For iOS/Android simulator dev builds** (no EAS): run `expo run:ios` or `expo run:android` — the `EXPO_PUBLIC_PROJECT_ID` is not required but push notifications will not work.

**Summary**: `EXPO_PUBLIC_PROJECT_ID` is only required when you need push notifications or are building release binaries through EAS. Everything else works without it.

---

## Useful URLs (local dev)

| URL | Description |
|-----|-------------|
| `http://localhost:5080/scalar` | Interactive API docs |
| `http://localhost:5080/health` | Health check (JSON) |
| `http://localhost:8081` | Frontend web app |
| `http://localhost:8082` | Adminer (Postgres browser) |

---

## License

AGPL-3.0-or-later. Copyright (C) NoMercy Entertainment.
Self-hosted deployments have no restrictions. If you distribute a modified version as a network service, the AGPL requires you to make your source changes available.
