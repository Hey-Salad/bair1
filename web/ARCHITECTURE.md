# Bair1 — System Architecture

Better Air One (Bair1) is an IoT air quality monitoring platform. A physical sensor
measures gas levels and uploads readings via cellular to a cloud API. A web dashboard
displays real-time and historical data.

---

## System Overview

```
                          CELLULAR (GPRS/2G)
 ┌──────────────┐             │
 │  ESP32-C3    │  HTTPS      │
 │  + SIM800L   │─────────────┤
 │  + MQ Gas    │  TLS 1.0    │
 └──────────────┘             │
                              ▼
                   ┌──────────────────┐
                   │  AWS API Gateway  │  TLS 1.0 compatible
                   │  (eu-west-2)     │
                   └────────┬─────────┘
                            │ Lambda proxy
                            ▼
                   ┌──────────────────┐
                   │  Cloudflare      │  bair1-relay.heysalad-o.workers.dev
                   │  Worker Relay    │  sensor.heysalad.app
                   └────────┬─────────┘
                            │ POST + x-api-key
                            ▼
                   ┌──────────────────┐
                   │  Vercel          │  www.bair1.live/api/readings
                   │  Next.js API     │
                   └────────┬─────────┘
                            │ SQL INSERT
                            ▼
                   ┌──────────────────┐
                   │  Neon Postgres   │  readings table
                   │  (serverless)    │
                   └──────────────────┘

                   ┌──────────────────┐
                   │  Dashboard       │  app.bair1.live
                   │  (Next.js SPA)   │  Auth0 login
                   │  + Mapbox GL     │
                   └──────────────────┘
```

---

## Repositories

| Repo | Purpose | Hosting |
|------|---------|---------|
| `Hey-Salad/bair1-web` | Landing page + dashboard + API | Vercel |
| `Hey-Salad/bair1-relay` | Cloudflare Worker relay | Cloudflare Workers |
| `Hey-Salad/bair1-firmware` | ESP32 firmware (PlatformIO) | N/A (flashed locally) |

---

## 1. Sensor Hardware (bair1-firmware)

### Components

| Part | Model | Purpose |
|------|-------|---------|
| MCU | Seeed XIAO ESP32-C3 | Main processor, WiFi, BLE |
| Cellular | SIM800L | 2G/GPRS data upload |
| Gas sensor | MQ-series (analog) | Air quality measurement (ADC pin A0) |
| Display | SSD1306 OLED 128x64 | Local readout |
| Storage | SD card (SPI) | Local data logging |
| Input | Tactile button (D1) | UI navigation |
| Output | Piezo buzzer (D3) | Alerts |

### Pin Mapping

| Function | Pin | GPIO |
|----------|-----|------|
| Button | D1 | 3 |
| SD CS | D2 | 4 |
| Buzzer | D3 | 5 |
| I2C SDA | D4 | 6 |
| I2C SCL | D5 | 7 |
| SIM TX | D6 | 21 |
| SIM RX | D7 | 20 |
| Gas ADC | A0 | 2 |

### Firmware Behaviour

1. Boot: initialise OLED, I2C scan, BLE advertising, SIM800L UART
2. WiFi: attempts connection to configured SSID; falls back to AP mode (`AirNode-XXXX`)
3. Cellular: `AT+SAPBR` GPRS bearer setup with configured APN
4. Sampling: reads gas sensor every 5 seconds, computes AQI score
5. Upload: every 60 seconds, POST JSON to `BEAR_ONE_API_URL` via SIM800L HTTP service
6. OTA: ArduinoOTA available when WiFi connected

### Configuration

Secrets live in `src/config.h` (gitignored). Copy `src/config.h.example` to get started:

```
cp src/config.h.example src/config.h
# Edit with your WiFi, API URL, API key, APN
```

### Build & Flash

```bash
# Install PlatformIO CLI
pip install platformio

# Build all targets
pio run

# Flash main firmware (sensor must be USB-connected)
pio run -e xiao_esp32c3 -t upload

# Monitor serial output
pio device monitor -b 115200
```

---

## 2. Cloudflare Worker Relay (bair1-relay)

### Why It Exists

The SIM800L cellular module cannot connect directly to Vercel's API because:
- SIM800L's SSL library only supports TLS 1.0
- Vercel requires TLS 1.2+

The relay provides an intermediate endpoint that the AWS API Gateway (TLS 1.0
compatible) can forward to, and it adds the `x-api-key` header before proxying
to Vercel.

### How It Works

```
POST /  →  forwards body to UPSTREAM_URL with x-api-key header
GET  /  →  returns { ok: true, relay: "bair1-relay" }
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `UPSTREAM_URL` | Vercel API endpoint (e.g. `https://www.bair1.live/api/readings`) |
| `UPSTREAM_API_KEY` | Shared secret for x-api-key header |

Set via `wrangler secret put`:

```bash
wrangler secret put UPSTREAM_URL
wrangler secret put UPSTREAM_API_KEY
```

### Deployment

```bash
npm install
npx wrangler deploy
```

Deployed to:
- `https://bair1-relay.heysalad-o.workers.dev`
- `https://sensor.heysalad.app` (custom domain)

---

## 3. AWS API Gateway + Lambda (TLS Bridge)

### Why It Exists

The SIM800L gets HTTP error 606 (SSL handshake failure) when connecting
to Cloudflare Workers directly because `workers.dev` domains enforce TLS 1.2+.
AWS API Gateway default endpoints support TLS 1.0, which the SIM800L can negotiate.

### Components

| AWS Resource | Name/ID | Region |
|-------------|---------|--------|
| API Gateway | `onzlo0n0eg` | eu-west-2 |
| Lambda | `bair1-sensor-relay` | eu-west-2 |
| IAM Role | `bair1-sensor-lambda-role` | global |

### Endpoint

```
POST https://onzlo0n0eg.execute-api.eu-west-2.amazonaws.com/prod
```

The Lambda function receives the POST body and forwards it to the Cloudflare
Worker relay (`bair1-relay.heysalad-o.workers.dev`) over HTTPS (TLS 1.2).

### Data Flow

```
SIM800L (TLS 1.0) → AWS API Gateway → Lambda → Cloudflare Worker → Vercel API → Neon Postgres
```

---

## 4. Vercel Web App (bair1-web)

### Domains

| Domain | Purpose |
|--------|---------|
| `www.bair1.live` | Landing page |
| `app.bair1.live` | Dashboard (Auth0-gated) |

### API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/readings` | POST | x-api-key | Ingest sensor readings |
| `/api/readings` | GET | none | List last 20 readings |
| `/api/readings/latest` | GET | none | Most recent reading |
| `/api/checkout` | POST | none | Stripe checkout session |

### Environment Variables (Vercel)

| Variable | Type | Description |
|----------|------|-------------|
| `DATABASE_URL` | secret | Neon Postgres connection string |
| `SENSOR_API_KEY` | secret | Shared key for sensor ingestion |
| `NEXT_PUBLIC_AUTH0_DOMAIN` | public | Auth0 tenant domain |
| `NEXT_PUBLIC_AUTH0_CLIENT_ID` | public | Auth0 SPA client ID |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | public | Mapbox GL public token |
| `STRIPE_SECRET_KEY` | secret | Stripe server-side key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | public | Stripe client-side key |

### Tech Stack

- Next.js (App Router)
- Tailwind CSS v4 (OKLCH dark theme)
- Auth0 React SDK v2
- Mapbox GL JS
- `@neondatabase/serverless`
- Stripe

---

## 5. Database (Neon Postgres)

### readings table

```sql
CREATE TABLE readings (
  id              SERIAL PRIMARY KEY,
  device_id       TEXT NOT NULL,
  aqi             INTEGER NOT NULL DEFAULT 0,
  gas_raw         INTEGER,
  gas_voltage     REAL,
  air_state       TEXT,
  rssi            INTEGER,
  firmware_version TEXT,
  uptime_ms       BIGINT,
  sample          INTEGER,
  transport       TEXT,
  raw_payload     JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_readings_device_created
  ON readings (device_id, created_at DESC);
```

---

## 6. Authentication (Auth0)

- **Tenant**: `dev-v71n0fw208s2qy8d.us.auth0.com`
- **Application**: Single Page Application
- **Allowed Callbacks**: `https://app.bair1.live`, `http://localhost:3000`
- **Dashboard route**: `/dashboard` (redirects from `bair1.live` to `app.bair1.live`)

---

## 7. Secrets Inventory

All secrets are stored as environment variables, never in source code.

| Secret | Where Stored | Used By |
|--------|-------------|---------|
| `SENSOR_API_KEY` | Vercel env vars | bair1-web API route |
| `DATABASE_URL` | Vercel env vars | bair1-web DB connection |
| `UPSTREAM_URL` | Wrangler secrets | bair1-relay Worker |
| `UPSTREAM_API_KEY` | Wrangler secrets | bair1-relay Worker |
| `STRIPE_SECRET_KEY` | Vercel env vars | bair1-web checkout |
| WiFi SSID/password | firmware config.h (gitignored) | ESP32 |
| API URL/key | firmware config.h (gitignored) | ESP32 |
| SIM APN/PIN | firmware config.h (gitignored) | SIM800L |
| AWS credentials | `~/.aws/credentials` (local) | Lambda deploy |
| Cloudflare API token | Wrangler OAuth (local) | Worker deploy |

### CI/CD Secret Scanning

All three repos have GitHub Actions workflows that:
1. Scan for 64-char hex strings, AWS keys, Stripe keys, DB URLs
2. Check for known secret prefixes
3. Verify `config.h` is not tracked (firmware repo)
4. Block the build if any secrets are detected

---

## 8. Local Development

### bair1-web

```bash
cd bair1-web
cp .env.example .env.local
# Fill in values
npm install
npm run dev
# Open http://localhost:3000
```

### bair1-relay

```bash
cd bair1-relay
cp .dev.vars.example .dev.vars
# Fill in values
npm install
npx wrangler dev
# Relay at http://localhost:8787
```

### bair1-firmware

```bash
cd bair1-firmware
cp src/config.h.example src/config.h
# Edit src/config.h with your values
pio run -e xiao_esp32c3 -t upload
pio device monitor -b 115200
```

---

## 9. Deployment

### bair1-web (Vercel)

Auto-deploys on push to `main` via GitHub integration.
Set env vars in Vercel dashboard or via `vercel env add`.

### bair1-relay (Cloudflare Workers)

```bash
# Set secrets (one-time)
wrangler secret put UPSTREAM_URL
wrangler secret put UPSTREAM_API_KEY

# Deploy
npx wrangler deploy
```

Or via GitHub Actions (set `CLOUDFLARE_API_TOKEN`, `UPSTREAM_URL`,
`UPSTREAM_API_KEY` in repo secrets).

### bair1-firmware

Flash locally via USB:

```bash
pio run -e xiao_esp32c3 -t upload
```

OTA update available when sensor is on the same WiFi network.
