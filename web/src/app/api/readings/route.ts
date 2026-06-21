import { NextRequest, NextResponse } from "next/server";
import { getDb, ensureTable } from "@/lib/db";
import { resolveCellTower } from "@/lib/geolocation";
import { getDevice, createDevice } from "@/lib/devices";

const API_KEY = process.env.SENSOR_API_KEY!;

function extractApiKey(req: NextRequest): string | null {
  // Support both x-api-key header and Authorization: Bearer <key>
  const xApiKey = req.headers.get("x-api-key");
  if (xApiKey) return xApiKey;
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function POST(req: NextRequest) {
  const key = extractApiKey(req);
  if (key !== API_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const deviceId = String(body.deviceId ?? "unknown");
  const pm25 = body.pm25 != null ? Number(body.pm25) : null;
  const aqi = Number(body.aqi ?? pm25 ?? 0);
  const gasRaw = body.gasRaw != null ? Number(body.gasRaw) : null;
  const gasVoltage = body.gasVoltage != null ? Number(body.gasVoltage) : null;
  const airState = body.airState ? String(body.airState) : null;
  const rssi = body.rssi != null ? Number(body.rssi) : null;
  const firmwareVersion = body.firmwareVersion ? String(body.firmwareVersion) : null;
  const uptimeMs = body.uptimeMs != null ? Number(body.uptimeMs) : null;
  const sample = body.sample != null ? Number(body.sample) : null;
  const transport = body.transport ? String(body.transport) : null;

  try {
    // Resolve cell tower to lat/lng if present and no lat/lng already
    const ct = body.cellTower as Record<string, unknown> | undefined;
    if (ct && body.lat == null && body.lng == null) {
      const loc = await resolveCellTower({
        mcc: Number(ct.mcc ?? 0),
        mnc: Number(ct.mnc ?? 0),
        lac: Number(ct.lac ?? 0),
        cid: Number(ct.cid ?? 0),
      });
      if (loc) {
        body.lat = loc.lat;
        body.lng = loc.lng;
        body.locationAccuracy = loc.accuracy;
        body.locationSource = "cellTower";
      }
    }

    const sql = getDb();
    await ensureTable();

    await sql`
      INSERT INTO readings (device_id, aqi, gas_raw, gas_voltage, air_state, rssi, firmware_version, uptime_ms, sample, transport, raw_payload)
      VALUES (${deviceId}, ${aqi}, ${gasRaw}, ${gasVoltage}, ${airState}, ${rssi}, ${firmwareVersion}, ${uptimeMs}, ${sample}, ${transport}, ${JSON.stringify(body)})
    `;

    // Auto-register device if not yet known
    const existing = await getDevice(deviceId);
    if (!existing) {
      const family = body.family ? String(body.family) : "";
      const preferredName =
        body.deviceName ? String(body.deviceName) :
        body.name ? String(body.name) :
        family ? `${family} sensor` :
        deviceId;
      await createDevice({
        deviceId,
        name: preferredName,
        location: "",
        lat: body.lat != null ? Number(body.lat) : null,
        lng: body.lng != null ? Number(body.lng) : null,
        ownerId: "",
        orgId: "default",
        status: "active",
        createdAt: new Date().toISOString(),
      });
    } else if (body.lat != null && body.lng != null) {
      // Update device location from latest reading
      const sql2 = getDb();
      await sql2`UPDATE devices SET lat = ${Number(body.lat)}, lng = ${Number(body.lng)} WHERE device_id = ${deviceId}`;
    }

    return NextResponse.json({ ok: true, deviceId, aqi, pm25, timestamp: new Date().toISOString() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("[readings] POST error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const sql = getDb();
    await ensureTable();

    const rows = await sql`
      SELECT * FROM readings ORDER BY created_at DESC LIMIT 20
    `;

    return NextResponse.json({ readings: rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
