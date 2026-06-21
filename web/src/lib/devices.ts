import { getDb } from "./db";

export type DeviceStatus = "active" | "inactive" | "provisioning";

export interface Device {
  deviceId: string;
  name: string;
  location: string;
  lat: number | null;
  lng: number | null;
  ownerId: string;
  orgId: string;
  status: DeviceStatus;
  createdAt: string;
}

async function ensureDevicesTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS devices (
      device_id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      lat REAL,
      lng REAL,
      owner_id TEXT NOT NULL DEFAULT '',
      org_id TEXT NOT NULL DEFAULT 'default',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

function parseRow(row: Record<string, unknown>): Device {
  return {
    deviceId: String(row.device_id ?? ""),
    name: String(row.name ?? ""),
    location: String(row.location ?? ""),
    lat: row.lat != null ? Number(row.lat) : null,
    lng: row.lng != null ? Number(row.lng) : null,
    ownerId: String(row.owner_id ?? ""),
    orgId: String(row.org_id ?? "default"),
    status: (row.status as DeviceStatus) ?? "inactive",
    createdAt: row.created_at ? new Date(row.created_at as string).toISOString() : "",
  };
}

export async function getDevice(deviceId: string): Promise<Device | null> {
  const sql = getDb();
  await ensureDevicesTable();
  const rows = await sql`SELECT * FROM devices WHERE device_id = ${deviceId}`;
  return rows[0] ? parseRow(rows[0]) : null;
}

export async function createDevice(device: Device): Promise<void> {
  const sql = getDb();
  await ensureDevicesTable();
  await sql`
    INSERT INTO devices (device_id, name, location, lat, lng, owner_id, org_id, status, created_at)
    VALUES (${device.deviceId}, ${device.name}, ${device.location}, ${device.lat}, ${device.lng}, ${device.ownerId}, ${device.orgId}, ${device.status}, ${device.createdAt || new Date().toISOString()})
    ON CONFLICT (device_id) DO UPDATE SET
      name = EXCLUDED.name,
      location = EXCLUDED.location,
      lat = EXCLUDED.lat,
      lng = EXCLUDED.lng,
      owner_id = EXCLUDED.owner_id,
      org_id = EXCLUDED.org_id,
      status = EXCLUDED.status
  `;
}

export async function updateDevice(
  deviceId: string,
  updates: Partial<Pick<Device, "name" | "location" | "lat" | "lng" | "status" | "ownerId">>
): Promise<void> {
  const sql = getDb();
  await ensureDevicesTable();
  const current = await getDevice(deviceId);
  if (!current) return;
  await sql`
    UPDATE devices SET
      name = ${updates.name ?? current.name},
      location = ${updates.location ?? current.location},
      lat = ${updates.lat !== undefined ? updates.lat : current.lat},
      lng = ${updates.lng !== undefined ? updates.lng : current.lng},
      status = ${updates.status ?? current.status},
      owner_id = ${updates.ownerId ?? current.ownerId}
    WHERE device_id = ${deviceId}
  `;
}

export async function deleteDevice(deviceId: string): Promise<void> {
  const sql = getDb();
  await ensureDevicesTable();
  await sql`DELETE FROM devices WHERE device_id = ${deviceId}`;
}

export async function getAllDevicesRegistry(): Promise<Device[]> {
  const sql = getDb();
  await ensureDevicesTable();
  const rows = await sql`SELECT * FROM devices ORDER BY created_at DESC`;
  return rows.map(parseRow);
}

export async function getDevicesForUser(userId: string): Promise<Device[]> {
  const sql = getDb();
  await ensureDevicesTable();
  const rows = await sql`SELECT * FROM devices WHERE owner_id = ${userId}`;
  return rows.map(parseRow);
}

export async function getDevicesForOrg(orgId: string): Promise<Device[]> {
  const sql = getDb();
  await ensureDevicesTable();
  const rows = await sql`SELECT * FROM devices WHERE org_id = ${orgId}`;
  return rows.map(parseRow);
}
