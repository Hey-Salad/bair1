# Bair1 Demo Video Script

**Duration:** 2-3 minutes
**Voice:** ElevenLabs (Voice ID: WEWg46iZYLTGRhEby6aH, Model: eleven_flash_v2_5)

---

## Narration Script

[SCENE 1 — Hook, 10s]
"What if checking the air quality was as simple as glancing at a teddy bear?"

[SCENE 2 — The Problem, 15s]
"Nine out of ten people breathe polluted air. In London alone, thousands of children go to schools near roads that exceed legal pollution limits. But existing air quality monitors are expensive, ugly, and show numbers most people can't interpret."

[SCENE 3 — Introducing Bair1, 15s]
"This is Bair1 — Better Air One. A bear-shaped sensor that plugs in and tells you instantly whether the air is safe. No numbers, no jargon. The bear's expression changes with the air quality. Happy means breathe easy. Worried means close the window."

[SCENE 4 — How It Works, 20s]
"Inside the bear is a Sensirion SPS30 laser sensor that measures PM1, PM2.5, and PM10 particulates — the stuff that actually damages your lungs. It connects via cellular or WiFi and streams readings every sixty seconds to our cloud platform."

[SCENE 5 — The Dashboard, 20s]
"On bair1.live, you get a real-time dashboard showing your air quality score, particulate breakdown, and historical trends. The map shows every Bair1 sensor in your area, building a community air quality network. Everything runs on Vercel with Neon Postgres — serverless, fast, always on."

[SCENE 6 — The Mobile App, 15s]
"And there's a mobile app — built on Bilt.me with React Native — so you can check the air from anywhere. Same live data, same bear, in your pocket."

[SCENE 7 — The Architecture, 15s]
"Under the hood, the sensor talks to AWS API Gateway over cellular, which relays through a Cloudflare Worker to our Vercel API. End-to-end encrypted, sub-minute latency, and it works anywhere with mobile signal."

[SCENE 8 — Business Model, 15s]
"The bear sells for forty-nine pounds. Premium features — historical data, multi-room monitoring, smart alerts — are four ninety-nine a month. And we're already talking to London schools about classroom air quality networks."

[SCENE 9 — Close, 10s]
"Bair1. Because the air you breathe shouldn't be a mystery. Try it live at bair1.live."

---

## ElevenLabs Generation Command

```bash
curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/WEWg46iZYLTGRhEby6aH" \
  -H "xi-api-key: sk_3a2ae34417ad8e880b81b15c45c0615a901870f64a2f77dd" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "PASTE_FULL_SCRIPT_HERE",
    "model_id": "eleven_flash_v2_5",
    "voice_settings": {
      "stability": 0.6,
      "similarity_boost": 0.8
    }
  }' \
  --output bair1_demo_narration.mp3
```
