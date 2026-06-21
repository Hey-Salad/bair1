# bair1-relay

Cloudflare Worker that relays sensor readings from the Bair1 IoT device to the
Vercel API. Part of the [Bair1 platform](https://bair1.live).

## Why

The ESP32 + SIM800L sensor connects via 2G cellular. The SIM800L only supports
TLS 1.0, which most modern platforms reject. This relay sits behind AWS API
Gateway (TLS 1.0 compatible) and forwards requests to Vercel over TLS 1.2.

## Data Flow

```
Sensor (SIM800L, TLS 1.0)
  → AWS API Gateway (TLS 1.0 termination)
    → Lambda
      → This Worker (HTTPS)
        → Vercel /api/readings (HTTPS)
          → Neon Postgres
```

## Setup

```bash
npm install
cp .dev.vars.example .dev.vars
# Edit .dev.vars with real values
```

## Development

```bash
npx wrangler dev
```

## Deploy

```bash
# Set secrets (first time only)
npx wrangler secret put UPSTREAM_URL
npx wrangler secret put UPSTREAM_API_KEY

# Deploy
npx wrangler deploy
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check — returns `{ ok: true }` |
| POST | `/` | Forwards JSON body to upstream API with x-api-key header |

## Environment Variables

| Name | Description |
|------|-------------|
| `UPSTREAM_URL` | Target API endpoint (e.g. `https://www.bair1.live/api/readings`) |
| `UPSTREAM_API_KEY` | API key sent as `x-api-key` header |

## Related Repos

- [bair1-web](https://github.com/Hey-Salad/bair1-web) — Dashboard + API
- [bair1-firmware](https://github.com/Hey-Salad/bair1-firmware) — ESP32 sensor firmware
