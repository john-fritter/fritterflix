# CLAUDE.md — Fritterflix

## What

Self-hosted personal movie-rating app for two users (John & Aira). Displays the Jellyfin movie library (via media-proxy) and stores side-by-side 0–10 ratings per movie. Single `admin` login — no per-user auth.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions)
- **Prisma 6** → PostgreSQL 16
- **Docker Compose** (app + postgres, private network)
- **Auth**: HMAC-signed session cookie; password from `FRITTERFLIX_ADMIN_PASSWORD` env var (plaintext compare — TODO: hash before opening beyond fritter.lol)

## Key Paths

```
src/lib/auth.ts          — session creation/verification, allowed users
src/lib/mediaProxy.ts    — fetches /api/media/library from media-proxy
src/lib/prisma.ts        — Prisma client singleton
src/app/library/page.tsx — main movie grid (server component)
src/app/library/actions.ts — saveRating server action
src/app/api/auth/        — login/logout routes
src/app/login/           — login page
prisma/schema.prisma     — User, MovieRating models
```

## Data Flow

```
Browser → /library (server component)
         ├─ media-proxy /api/media/library → movie list + posters
         └─ prisma.movieRating.findMany   → existing ratings
         → merged, rendered as card grid

Browser → POST /library (Server Action updateMovieRating)
         └─ prisma.movieRating.upsert → saves johnRating/airaRating
```

Fritterflix never talks to Jellyfin directly. All media data comes through `MEDIA_PROXY_BASE_URL`.

## Commands

```bash
npm run lint          # ESLint
npm run build         # prisma generate + next build
docker compose up -d --build   # full rebuild + deploy
docker network connect seedbox_default fritterflix-app-1  # required after recreate
```

## Deployment Gotcha

The app container must be on `seedbox_default` for Caddy to proxy `flix.fritter.lol` → `fritterflix-app-1:3000`. Compose only declares the private `fritterflix_internal` network. After any `docker compose up --force-recreate`, re-connect:

```bash
docker network connect seedbox_default fritterflix-app-1
```

Without this, Caddy returns 502.

## Env Vars

See `.env.example` for the full list. Required: `DATABASE_URL`, `SESSION_SECRET`, `FRITTERFLIX_ADMIN_PASSWORD`, `MEDIA_PROXY_BASE_URL`.

## Conventions

- Server Components for data fetching, Server Actions for mutations
- No client-side data fetching yet
- Ratings are Decimal(3,1) in Prisma (0.0–10.0)
- Poster images are proxied through media-proxy — no direct Jellyfin URLs