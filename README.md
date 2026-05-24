# Fritterflix

Fritterflix is a small self-hosted personal Letterboxd-style app for John and Aira's Jellyfin media stack.

Slice 1 is intentionally narrow:

- Next.js app
- Postgres + Prisma
- one admin login: username `admin`
- password supplied by `FRITTERFLIX_ADMIN_PASSWORD`
- `/library` shows movies from media-proxy's normalized Jellyfin library endpoint
- John and Aira ratings stored side by side per Jellyfin movie item
- no reviews, watchlist, wheel, search, title detail, TMDB, MCP, Radarr, Jellyseerr, or TV support yet

## Architecture

Fritterflix does **not** talk to Jellyfin directly. It only consumes media-stack data through media-proxy:

```text
Fritterflix -> MEDIA_PROXY_BASE_URL/api/media/library
```

In production on fritter.lol, the app runs in its own Compose project and Postgres remains on Fritterflix's private Compose network with no published port. The app container is also connected to `seedbox_default` so Caddy can proxy `flix.fritter.lol` to `fritterflix-app-1:3000`. Fritterflix consumes media-proxy through `MEDIA_PROXY_BASE_URL` and never receives Jellyfin credentials.

## Environment variables

Copy `.env.example` to `.env` and set:

| Variable | Purpose |
| --- | --- |
| `POSTGRES_DB` | Local Fritterflix database name. |
| `POSTGRES_USER` | Local Fritterflix database user. |
| `POSTGRES_PASSWORD` | Local Fritterflix database password. |
| `SESSION_SECRET` | HMAC secret for signed session cookies. |
| `FRITTERFLIX_ADMIN_PASSWORD` | Plain-string Slice 1 password for the `admin` account. TODO: hash if opened beyond fritter.lol. |
| `MEDIA_PROXY_BASE_URL` | Server-side media-proxy URL. On fritter.lol production: `https://fritter.lol`. |

## Bring-up

```bash
cp .env.example .env
# edit .env
docker compose up -d --build
docker compose ps
```

The app listens on port `3000` inside Docker. On fritter.lol, Caddy routes `https://flix.fritter.lol` to `fritterflix-app-1:3000` over the shared `seedbox_default` network; Postgres stays private to the Fritterflix Compose project.

## Local checks

```bash
npm install
npm run lint
npm run build
```

## Slice 1 routes

- `GET /login` — login form
- `POST /api/auth/login` — plain-string env password check for `admin`
- `GET /library` — protected Jellyfin movie grid via media-proxy with editable John/Aira ratings
- `POST /api/auth/logout` — clears session and redirects to login
- `GET /api/media/*` — image proxy-through to media-proxy for poster URLs
