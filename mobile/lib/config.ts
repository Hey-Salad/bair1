// ---------------------------------------------------------------------------
// Runtime configuration. Public values come from EXPO_PUBLIC_* env vars so
// they can be set without code changes. Auth0 falls back to a clear
// "not configured" state until credentials are provided.
// ---------------------------------------------------------------------------

export const API_BASE_URL = process.env.EXPO_PUBLIC_BAIR1_BASE_URL ?? 'https://www.bair1.live';

export const AUTH0_DOMAIN = process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? '';
export const AUTH0_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ?? '';
export const AUTH0_AUDIENCE = process.env.EXPO_PUBLIC_AUTH0_AUDIENCE ?? '';

export const isAuth0Configured = Boolean(AUTH0_DOMAIN && AUTH0_CLIENT_ID);

// Default location used when no device and no GPS available (Shoreditch, London —
// matches the demo sensor in the backend).
export const DEMO_LOCATION = { lat: 51.5260672, lng: -0.0856674 };

// Polling intervals (ms) — respect backend rate limits.
export const REFRESH_HOME_MS = 60_000;
export const REFRESH_MAP_MS = 15_000;

export const HARDWARE_STORE_URL = 'https://bair1.live';

// Map time-range options shared by Map + Analytics screens.
export const MAP_RANGES = [
  { label: '2h', hours: 2 },
  { label: '6h', hours: 6 },
  { label: '12h', hours: 12 },
  { label: '24h', hours: 24 },
  { label: '2d', hours: 48 },
  { label: '7d', hours: 168 },
] as const;

export const ANALYTICS_RANGES = [
  { label: '24h', hours: 24 },
  { label: '7d', hours: 168 },
  { label: '30d', hours: 720 },
] as const;
