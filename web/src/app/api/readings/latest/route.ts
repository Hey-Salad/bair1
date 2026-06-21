import { NextResponse } from "next/server";
import { getDb, ensureTable } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = getDb();
    await ensureTable();

    const rows = await sql`
      SELECT * FROM readings ORDER BY created_at DESC LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "no readings" }, { status: 404 });
    }

    const r = rows[0];
    const raw = typeof r.raw_payload === "string" ? JSON.parse(r.raw_payload) : r.raw_payload;
    return NextResponse.json({
      deviceId: r.device_id,
      aqi: r.aqi,
      gasRaw: r.gas_raw,
      gasVoltage: r.gas_voltage,
      airState: r.air_state ?? raw?.airState ?? null,
      rssi: r.rssi,
      firmwareVersion: r.firmware_version,
      uptimeMs: r.uptime_ms,
      sample: r.sample,
      transport: r.transport,
      pm1: raw?.pm1 ?? null,
      pm25: raw?.pm25 ?? null,
      pm4: raw?.pm4 ?? null,
      pm10: raw?.pm10 ?? null,
      sensorModel: raw?.sensorModel ?? null,
      deviceName: raw?.deviceName ?? null,
      timestamp: r.created_at,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
