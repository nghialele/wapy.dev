# sub.idler.me

A free, hosted instance of [Wapy.dev](https://github.com/meceware/wapy.dev) — a subscription tracker — for people who cannot or would rather not self-host.

Track recurring expenses in one readable dashboard, get reminders before you are charged, and export your data any time. No ads, no tracking, no payment details.

## Differences from upstream

- **No billing.** Paddle checkout, pricing page, refund policy, trial gating, and the `SubscriptionGuard` are removed. Every signed-in account gets the whole app.
- **Open signup.** The email magic link is the only gate. `DISABLE_USER_REGISTRATION=true` in `.env` closes it if you ever need to.
- **idler.me branding.** Ink/bone/signal-orange theme, Newsreader + Inter + JetBrains Mono fonts, orbit-mark icons and social images.
- **One person, best effort.** No uptime promise, no SLA. Export your data regularly and keep your own backups.

## Quick start

No build needed — use the pre-built image from this repo's package registry:

```bash
cp .env.example .env   # then set POSTGRES_PASSWORD, AUTH_SECRET, SUBSCRIPTION_JWT_SECRET (openssl rand -base64 32 works)
docker compose -f docker-compose.image.yml up -d
```

The container runs `prisma migrate deploy` on start; Postgres gets created on first boot. Only `SITE_URL` needs a real value in production (`https://sub.idler.me`), plus your SMTP settings.

Or build it yourself from source:

```bash
./scripts/setup.sh && docker compose up -d --build
```

This generates `.env` (secrets included), starts Postgres, builds the app, and runs a cron container that pings the notification endpoint every minute. The app listens on `127.0.0.1:3000` only — put a reverse proxy in front of it.

For development: `./scripts/setup.sh && docker compose -f docker-compose-dev.yml up -d`, then `npm run dev`.

## Reverse proxy (Caddy)

Block `/api/cron*` at the edge; the cron container reaches `app:3000` directly, so the endpoint stays off the public internet:

```
sub.idler.me {
    @cron path /api/cron*
    respond 404
    reverse_proxy 127.0.0.1:3000 {
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

`header_up X-Forwarded-For {remote_host}` **replaces** the header rather than appending. Without it, a client-supplied `X-Forwarded-For` makes better-auth's rate limiter fall back to a shared counter and the magic-link limit applies to everyone at once.

`SITE_URL` must be the public origin (e.g. `https://sub.idler.me`): it is better-auth's `baseURL`, used for cookie and origin checks.

## Service level

This is a one-person service run on self-hosted infrastructure, free of charge. There is no uptime promise and no guarantee that data survives a failure. The account page exports every record the app holds about you; use it.

## Attribution

This deployment is a fork of [meceware/wapy.dev](https://github.com/meceware/wapy.dev), licensed under the MIT license with a [Commons Clause](./LICENSE). Hosting it free of charge is permitted; selling it is not.
