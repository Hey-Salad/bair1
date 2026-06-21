import { neon } from "@neondatabase/serverless";

export function getDb() {
  return neon(process.env.DATABASE_URL!);
}

export async function ensureTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS readings (
      id SERIAL PRIMARY KEY,
      device_id TEXT NOT NULL,
      aqi INTEGER NOT NULL DEFAULT 0,
      gas_raw INTEGER,
      gas_voltage REAL,
      air_state TEXT,
      rssi INTEGER,
      firmware_version TEXT,
      uptime_ms BIGINT,
      sample INTEGER,
      transport TEXT,
      raw_payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_readings_device_created
    ON readings (device_id, created_at DESC)
  `;
}
