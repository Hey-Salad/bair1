import { NextRequest, NextResponse } from "next/server";
import { getDb, ensureTable } from "@/lib/db";
import { resolveCellTower } from "@/lib/geolocation";

const API_KEY = process.env.SENSOR_API_KEY!;

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-api-key");
  if (key !== API_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sql = getDb();
  await ensureTable();

  // Find readings with cellTower data but no lat/lng in raw_payload
  const rows = await sql`
    SELECT id, raw_payload
    FROM readings
    WHERE raw_payload->'cellTower' IS NOT NULL
      AND raw_payload->>'lat' IS NULL
    ORDER BY created_at ASC
  `;

  let resolved = 0;
  let failed = 0;

  for (const row of rows) {
    const raw = row.raw_payload as Record<string, unknown>;
    const ct = raw.cellTower as Record<string, unknown>;
    if (!ct) { failed++; continue; }

    const loc = await resolveCellTower({
      mcc: Number(ct.mcc ?? 0),
      mnc: Number(ct.mnc ?? 0),
      lac: Number(ct.lac ?? 0),
      cid: Number(ct.cid ?? 0),
    });

    if (loc) {
      raw.lat = loc.lat;
      raw.lng = loc.lng;
      raw.locationAccuracy = loc.accuracy;
      raw.locationSource = "cellTower";

      await sql`
        UPDATE readings
        SET raw_payload = ${JSON.stringify(raw)}::jsonb
        WHERE id = ${row.id}
      `;
      resolved++;
    } else {
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    total: rows.length,
    resolved,
    failed,
  });
}
