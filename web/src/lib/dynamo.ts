import { getDb, ensureTable } from "./db";

export interface Reading {
  deviceId: string;
  timestamp: string;
  aqi: number;
  gasRaw: number | null;
  gasVoltage: number | null;
  airState: string | null;
  rssi: number | null;
  firmwareVersion: string | null;
  uptimeMs: number | null;
  sample: number | null;
  transport: string | null;
  lat: number | null;
  lng: number | null;
  locationAccuracy: number | null;
  pm1: number | null;
  pm25: number | null;
  pm4: number | null;
  pm10: number | null;
  sensorModel: string | null;
  board: string | null;
}

function parseRow(row: Record<string, unknown>): Reading {
  const raw = row.raw_payload as Record<string, unknown> | null;
  return {
    deviceId: String(row.device_id ?? "unknown"),
    timestamp: row.created_at ? new Date(row.created_at as string).toISOString() : "",
    aqi: Number(row.aqi ?? 0),
    gasRaw: row.gas_raw != null ? Number(row.gas_raw) : null,
    gasVoltage: row.gas_voltage != null ? Number(row.gas_voltage) : null,
    airState: row.air_state as string | null,
    rssi: row.rssi != null ? Number(row.rssi) : null,
    firmwareVersion: row.firmware_version as string | null,
    uptimeMs: row.uptime_ms != null ? Number(row.uptime_ms) : null,
    sample: row.sample != null ? Number(row.sample) : null,
    transport: row.transport as string | null,
    lat: raw?.lat != null ? Number(raw.lat) : null,
    lng: raw?.lng != null ? Number(raw.lng) : null,
    locationAccuracy: null,
    pm1: raw?.pm1 != null ? Number(raw.pm1) : null,
    pm25: raw?.pm25 != null ? Number(raw.pm25) : null,
    pm4: raw?.pm4 != null ? Number(raw.pm4) : null,
    pm10: raw?.pm10 != null ? Number(raw.pm10) : null,
    sensorModel: raw?.sensorModel ? String(raw.sensorModel) : null,
    board: raw?.board ? String(raw.board) : null,
  };
}

export async function getReadings(
  deviceId: string,
  limit = 100
): Promise<Reading[]> {
  const sql = getDb();
  await ensureTable();
  const rows = await sql`
    SELECT * FROM readings
    WHERE device_id = ${deviceId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows.map(parseRow);
}

export async function getLatestReading(
  deviceId: string
): Promise<Reading | null> {
  const readings = await getReadings(deviceId, 1);
  return readings[0] ?? null;
}

export async function getAllDevices(): Promise<string[]> {
  const sql = getDb();
  await ensureTable();
  const rows = await sql`
    SELECT device_id, MAX(created_at) as last_seen
    FROM readings
    GROUP BY device_id
    ORDER BY last_seen DESC
  `;
  return rows.map((r) => String(r.device_id));
}

export async function getReadingsInRange(
  deviceId: string,
  from: string,
  to: string
): Promise<Reading[]> {
  const sql = getDb();
  await ensureTable();
  const rows = await sql`
    SELECT * FROM readings
    WHERE device_id = ${deviceId}
      AND created_at >= ${from}::timestamptz
      AND created_at <= ${to}::timestamptz
    ORDER BY created_at ASC
  `;
  return rows.map(parseRow);
}
