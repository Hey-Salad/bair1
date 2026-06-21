import { API_BASE_URL } from './config';
import type {
  AdminMe,
  Device,
  EnvironmentData,
  Reading,
  TimeSeriesPoint,
  TrailPoint,
  VoiceBriefing,
} from './types';

// ---------------------------------------------------------------------------
// Low-level fetch helpers
// ---------------------------------------------------------------------------

async function getJson<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error(`Request failed (${res.status}): ${path}`);
  const json: unknown = await res.json();
  return json as T;
}

async function graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE_URL}/api/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL failed (${res.status})`);
  const parsed: unknown = await res.json();
  const json = parsed as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  if (!json.data) throw new Error('GraphQL returned no data');
  return json.data;
}

// ---------------------------------------------------------------------------
// Raw REST reading normalization (top-level fields are often null; real values
// live in raw_payload). Used as a fallback when GraphQL is unavailable.
// ---------------------------------------------------------------------------

interface RawReading {
  device_id: string;
  created_at: string;
  aqi: number | null;
  gas_raw: number | null;
  gas_voltage: number | null;
  air_state: string | null;
  rssi: number | null;
  firmware_version: string | null;
  uptime_ms: number | string | null;
  sample: number | null;
  transport: string | null;
  raw_payload?: {
    aqi?: number;
    air?: { score?: number; state?: string };
    sensors?: { gasRaw?: number; gasVoltage?: number };
    cellular?: { rssi?: number };
    lat?: number;
    lng?: number;
    version?: string;
    deviceName?: string;
  } | null;
}

function normalizeReading(r: RawReading): Reading {
  const p = r.raw_payload ?? {};
  const aqi = (p.air?.score ?? (r.aqi || undefined) ?? p.aqi ?? 0) || 0;
  return {
    deviceId: r.device_id,
    timestamp: r.created_at,
    aqi,
    gasRaw: r.gas_raw ?? p.sensors?.gasRaw ?? null,
    gasVoltage: r.gas_voltage ?? p.sensors?.gasVoltage ?? null,
    airState: r.air_state ?? p.air?.state ?? null,
    rssi: r.rssi ?? p.cellular?.rssi ?? null,
    firmwareVersion: r.firmware_version ?? p.version ?? null,
    uptimeMs: typeof r.uptime_ms === 'string' ? Number(r.uptime_ms) : r.uptime_ms,
    sample: r.sample,
    transport: r.transport,
    lat: p.lat ?? null,
    lng: p.lng ?? null,
  };
}

// ---------------------------------------------------------------------------
// Public reads
// ---------------------------------------------------------------------------

export async function fetchLatestReadings(): Promise<Reading[]> {
  const data = await getJson<{ readings: RawReading[] }>('/api/readings');
  return (data.readings ?? []).map(normalizeReading);
}

export async function fetchRegisteredDevices(): Promise<Device[]> {
  const data = await graphql<{ registeredDevices: Device[] }>(`
    query Devices {
      registeredDevices {
        deviceId
        name
        location
        lat
        lng
        status
        latestReading {
          aqi
          timestamp
          lat
          lng
          gasVoltage
          rssi
        }
      }
    }
  `);
  return data.registeredDevices ?? [];
}

export async function fetchTimeSeries(
  deviceId: string,
  fromIso: string,
  toIso: string,
): Promise<TimeSeriesPoint[]> {
  const data = await graphql<{ timeSeries: TimeSeriesPoint[] }>(
    `
      query Series($deviceId: String!, $from: String!, $to: String!) {
        timeSeries(deviceId: $deviceId, from: $from, to: $to) {
          timestamp
          aqi
          gasVoltage
          rssi
          lat
          lng
        }
      }
    `,
    { deviceId, from: fromIso, to: toIso },
  );
  return data.timeSeries ?? [];
}

export async function fetchLocationTrail(
  deviceId: string,
  fromIso: string,
  toIso: string,
): Promise<TrailPoint[]> {
  const data = await graphql<{ locationTrail: TrailPoint[] }>(
    `
      query Trail($deviceId: String!, $from: String!, $to: String!) {
        locationTrail(deviceId: $deviceId, from: $from, to: $to) {
          timestamp
          lat
          lng
          aqi
          accuracy
        }
      }
    `,
    { deviceId, from: fromIso, to: toIso },
  );
  return (data.locationTrail ?? []).filter((t): t is TrailPoint => t.lat != null && t.lng != null);
}

export async function fetchReadingsHistory(deviceId: string, limit = 100): Promise<Reading[]> {
  const data = await graphql<{ readings: Reading[] }>(
    `
      query History($deviceId: String!, $limit: Int!) {
        readings(deviceId: $deviceId, limit: $limit) {
          deviceId
          timestamp
          aqi
          gasRaw
          gasVoltage
          airState
          rssi
          firmwareVersion
          uptimeMs
          sample
          transport
          lat
          lng
        }
      }
    `,
    { deviceId, limit },
  );
  return data.readings ?? [];
}

export async function fetchEnvironment(lat: number, lng: number): Promise<EnvironmentData> {
  return getJson<EnvironmentData>(`/api/environment?lat=${lat}&lng=${lng}`);
}

export async function fetchVoiceBriefing(
  deviceId: string | undefined,
  lat: number,
  lng: number,
): Promise<VoiceBriefing> {
  const params = new URLSearchParams();
  if (deviceId) params.set('deviceId', deviceId);
  params.set('lat', String(lat));
  params.set('lng', String(lng));
  return getJson<VoiceBriefing>(`/api/voice/briefing?${params.toString()}`);
}

// ---------------------------------------------------------------------------
// AI chat — manual streaming over the AI SDK data-stream protocol.
// Calls onDelta with each incremental text chunk. Returns the full text.
// ---------------------------------------------------------------------------

export async function streamChat(
  messages: { role: 'user' | 'assistant'; content: string }[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`Chat failed (${res.status})`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  const emit = (chunk: string) => {
    if (!chunk) return;
    full += chunk;
    onDelta(chunk);
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const text = parseStreamLine(line);
      if (text) emit(text);
    }
  }
  const tail = parseStreamLine(buffer);
  if (tail) emit(tail);
  return full;
}

// Supports both the AI SDK "0:" data-stream protocol and SSE "data:" frames.
function parseStreamLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return '';
  // AI SDK v3 text part: 0:"chunk"
  if (trimmed.startsWith('0:')) {
    try {
      const parsed: unknown = JSON.parse(trimmed.slice(2));
      return typeof parsed === 'string' ? parsed : '';
    } catch {
      return '';
    }
  }
  // SSE / AI SDK v5 frames: data: {...}
  if (trimmed.startsWith('data:')) {
    const payload = trimmed.slice(5).trim();
    if (payload === '[DONE]') return '';
    try {
      const parsed: unknown = JSON.parse(payload);
      const obj = parsed as {
        type?: string;
        textDelta?: string;
        delta?: string;
        text?: string;
        content?: string;
      };
      return obj.textDelta ?? obj.delta ?? obj.text ?? obj.content ?? '';
    } catch {
      return '';
    }
  }
  return '';
}

// ---------------------------------------------------------------------------
// Admin (Auth0 Bearer token required)
// ---------------------------------------------------------------------------

export async function fetchAdminMe(token: string): Promise<AdminMe> {
  return getJson<AdminMe>('/api/admin/me', token);
}

export async function fetchAdminDevices(token: string): Promise<Device[]> {
  const data = await getJson<{ devices?: Device[] } | Device[]>('/api/admin/devices', token);
  return Array.isArray(data) ? data : (data.devices ?? []);
}

export async function provisionDevice(
  token: string,
  device: { deviceId: string; name: string; location: string; lat?: number; lng?: number },
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/devices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(device),
  });
  if (!res.ok) throw new Error(`Provision failed (${res.status})`);
}

export async function updateDevice(
  token: string,
  patch: { deviceId: string; status?: string; name?: string; pushToken?: string },
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/devices`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Update failed (${res.status})`);
}

type AdminUser = { id?: string; email: string; name: string; role: string };

export async function fetchAdminUsers(token: string): Promise<AdminUser[]> {
  const data = await getJson<{ users?: AdminUser[] } | AdminUser[]>('/api/admin/users', token);
  if (Array.isArray(data)) return data;
  return data.users ?? [];
}

export async function createUser(
  token: string,
  user: { email: string; name: string; role: string },
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error(`Create user failed (${res.status})`);
}

export async function updateUserRole(token: string, userId: string, role: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ userId, role }),
  });
  if (!res.ok) throw new Error(`Update role failed (${res.status})`);
}
