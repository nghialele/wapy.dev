# AGENTS.md

Fork of [meceware/wapy.dev](https://github.com/meceware/wapy.dev) deployed as **sub.idler.me**: a free hosted subscription tracker. Next.js App Router (JS, no TypeScript), Prisma 7 + Postgres, better-auth, Tailwind + shadcn/Radix.

This file is for coding agents working in the repo. `README.md` is the human-facing setup guide.

## Fork differences from upstream

- **No billing.** Paddle checkout, pricing page, refund policy, trial gating, and `SubscriptionGuard` are removed on purpose. Do not reintroduce them or "fix" their absence.
- **Open signup** gated only by the email magic link; `DISABLE_USER_REGISTRATION=true` closes it.
- **idler.me branding** — ink/bone/signal-orange, Newsreader + Inter + JetBrains Mono, orbit-mark icons. `npm run brand:assets` regenerates brand images.
- **No cookie consent banner.** The language cookie is written without a consent check. Adding analytics or any third-party script means adding a consent gate back; do not assume one exists.

## Commands

```bash
npm run dev            # next dev --turbopack
npm run build          # next build — the real check; there is no test suite
npm run migrate        # prisma migrate dev
npm run studio         # prisma studio on :5555
npm run brand:assets   # regenerate brand images
```

`src/generated/` is Prisma output; never edit it. `postinstall` fetches dashboard icons into `public/icons/dashboard/`.

**`npm run lint` is currently broken**: Next 16 removed `next lint`, and ESLint 10 requires a flat `eslint.config.js` while the repo still has `.eslintrc.json`. Treat `npm run build` as the gate until that is migrated; do not paper over it by deleting the script.

Verification = `npm run build`, then load the affected page with a dev server and check the console. No unit tests exist; do not claim a change is tested if you only built it.

## Deploy / ops

- `./scripts/setup.sh` generates `.env` (secrets included) and the DB. `docker-compose.yml` builds from source, `docker-compose.image.yml` uses the pre-built image, `docker-compose-dev.yml` runs locally with hot reload.
- App binds `127.0.0.1:3000`; Caddy terminates TLS.
- `/api/cron*` must stay blocked at the edge. The cron container reaches `app:3000` directly; exposing it publicly lets anyone trigger notifications.
- Caddy must set `header_up X-Forwarded-For {remote_host}` (replace, not append). Otherwise a client-supplied header collapses better-auth's rate limiter into one shared bucket and the magic-link limit applies to everyone.
- `SITE_URL` is better-auth's `baseURL` and must be the public origin, or cookies and origin checks fail.
- `db/` is a container-owned Postgres volume. Query it through `docker compose exec`; never chown it.

## Conventions

- Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`).
- UI strings live in `i18n/*.json` (21 locales). Add a key to `en.json` and the locale you are working on, not to all 21 — other locales fall back to `en`.
- Languages are configured in `src/config/languages.js`: each entry carries `flag`, `dir` (`ltr`/`rtl`), and optionally `numberLocale`. `layout.js` sets `<html lang dir>` from it and wraps the tree in a Radix `DirectionProvider`, so RTL is handled centrally — do not hardcode `dir` in components.
- Server code under `src/lib` (`prisma.js`, `auth.js`, `mail.js`, `notifications.js`); route handlers in `src/app/api/*`. Use `with-auth` / `user-session` for authenticated routes instead of re-deriving the session.
- Keep data-driven lists in `src/config/*` (categories, currencies, payment methods, languages) rather than inline in components.
