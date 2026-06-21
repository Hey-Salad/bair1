# Bair1 — Checkpoint 2 Submission

## Challenge Explanation

We are building for the **Solvimon Bounty (Most Likely to Be a Successful Business)**, **Best Use of Vercel**, and the **Launch Track (Bilt.me)**.

**Bair1 (Better Air One)** is a consumer air quality monitoring platform that pairs a physical IoT sensor with a real-time web dashboard and mobile app. The sensor — designed in a bear form factor — plugs in, connects via WiFi or cellular, and streams PM1/PM2.5/PM10 particulate readings to bair1.live. One glance at the bear's expression tells you if the air is safe.

**Why these challenges:**

- **Solvimon (Business Viability):** Air quality monitoring is a proven market (PurpleAir, IQAir) but existing products are ugly, expensive, and confusing. Bair1 targets health-conscious urban families — starting in London — with a friendly, affordable monitor that gives plain-English guidance. Revenue model: hardware sales (device) + optional SaaS subscription (historical data, alerts, multi-room).

- **Best Use of Vercel:** The entire web platform runs on Vercel — Next.js 16 with App Router, server-side API routes for sensor ingestion, Neon Postgres via Vercel Marketplace, Tailwind v4, and auto-deploys from GitHub. The dashboard uses server components for initial load and client components for real-time updates.

- **Launch Track (Bilt.me):** The React Native mobile app was built on Bilt.me and connects to the same live backend. It features a 5-tab UI (home AQI gauge, analytics charts, map, chat, profile), real-time data from our API, and is ready for App Store / Play Store submission.

---

## Submission Details

### What We Built

A full-stack IoT air quality platform — from silicon to screen:

**1. Sensor Hardware (firmware/)**
- Seeed XIAO MG24 Sense microcontroller + Sensirion SPS30 laser particulate sensor
- Measures PM1, PM2.5, PM10 every 5 seconds
- SIM800L cellular module for 2G/GPRS upload (works anywhere with mobile signal)
- SSD1306 OLED display for local readout
- MQ-series gas sensor for VOC detection
- SD card logging for offline buffering

**2. Cloud Relay (relay/)**
- Cloudflare Worker that bridges TLS 1.0 (SIM800L limitation) to TLS 1.2+ (Vercel)
- AWS API Gateway + Lambda as TLS 1.0 entry point
- Adds authentication headers and forwards to Vercel API

**3. Web Dashboard (web/)**
- Next.js 16 on Vercel with Tailwind v4
- Landing page at bair1.live with product story and Stripe checkout
- Real-time dashboard with AQI gauge, PM breakdown, historical charts
- Mapbox GL map showing sensor locations
- Auth0 authentication for multi-user access
- Neon Postgres for serverless data storage
- 6 AQI states with bear expression changes

**4. Mobile App (mobile/)**
- React Native + Expo, built on Bilt.me
- 5-tab navigation: Home (AQI gauge), Analytics, Map, Chat, Profile
- Connects to same live backend API
- Device selector for multi-sensor households

### The Process

1. **Research & BOM** — Selected components based on cost, accuracy, and cellular connectivity requirements
2. **Firmware first** — Got the SPS30 reading PM data over I2C, then added cellular upload via SIM800L
3. **TLS bridge** — Discovered SIM800L only speaks TLS 1.0; built AWS API Gateway → CF Worker → Vercel relay chain
4. **Web dashboard** — Next.js 16 with real-time data visualization, Auth0 gating, Stripe payments
5. **Mobile app** — Built on Bilt.me with the same API, native feel
6. **Monorepo** — Combined all components into a single GitHub repository with architecture documentation

### Key Achievements

- **End-to-end data flow working**: Physical sensor → cellular → cloud → database → dashboard
- **Sub-minute latency**: Readings appear on the dashboard within 60 seconds of measurement
- **Production deployed**: bair1.live is live with real sensor data
- **4 codebases unified**: Web, relay, firmware, mobile in one monorepo
- **Secret-safe architecture**: All credentials in environment variables, CI secret scanning on all repos

---

## Links

- **Code Repository:** https://github.com/Hey-Salad/bair1
- **Live Demo:** https://bair1.live
- **Live Dashboard:** https://bair1.live/dashboard

---

## Business Case (Solvimon)

**Target Customer:** Health-conscious urban families, starting in London. Parents concerned about pollution near schools, runners checking air before exercise, allergy sufferers monitoring triggers.

**Value Proposition:** "Is the air good right now?" — answered in one glance, no jargon.

**Differentiation vs PurpleAir/IQAir:**
- Friendly bear form factor (not a clinical white box)
- Plain-English guidance (not raw AQI numbers)
- Cellular connectivity (works without WiFi)
- Affordable target price point (under £50)

**Monetisation:**
- Hardware sales: Bear sensor device (£49 one-time)
- SaaS subscription: Premium dashboard, historical data, multi-room, alerts (£4.99/month)
- B2B: Schools, offices, councils wanting air quality networks (enterprise pricing)

**Market Size:** UK indoor air quality market est. £200M+. 8.4M households in London alone.
