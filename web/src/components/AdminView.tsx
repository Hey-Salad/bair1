"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";

interface UserRecord {
  userId: string;
  email: string;
  name: string;
  role: "super_admin" | "admin" | "user";
  orgId: string;
  createdAt: string;
}

interface DeviceRecord {
  deviceId: string;
  name: string;
  location: string;
  lat: number | null;
  lng: number | null;
  ownerId: string;
  orgId: string;
  status: string;
  createdAt: string;
}

type AdminTab = "devices" | "users";

export default function AdminView() {
  const { getAccessTokenSilently } = useAuth0();
  const [adminTab, setAdminTab] = useState<AdminTab>("devices");
  const [me, setMe] = useState<UserRecord | null>(null);
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Device form
  const [showDeviceForm, setShowDeviceForm] = useState(false);
  const [deviceForm, setDeviceForm] = useState({
    deviceId: "",
    name: "",
    location: "",
    lat: "",
    lng: "",
  });

  // User form
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({
    email: "",
    name: "",
    role: "user" as "super_admin" | "admin" | "user",
  });

  const getToken = useCallback(async () => {
    try {
      return await getAccessTokenSilently();
    } catch {
      return null;
    }
  }, [getAccessTokenSilently]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError("Unable to authenticate");
        setLoading(false);
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };

      const [meRes, devicesRes, usersRes] = await Promise.all([
        fetch("/api/admin/me", { headers }),
        fetch("/api/admin/devices", { headers }).catch(() => null),
        fetch("/api/admin/users", { headers }).catch(() => null),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setMe(meData.user);
        // If user is not admin, show their devices from /me
        if (!["super_admin", "admin"].includes(meData.user.role)) {
          setDevices(meData.devices ?? []);
        }
      }

      if (devicesRes?.ok) {
        const devData = await devicesRes.json();
        setDevices(devData.devices ?? []);
      }

      if (usersRes?.ok) {
        const userData = await usersRes.json();
        setUsers(userData.users ?? []);
      }
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch data");
    }
    setLoading(false);
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const provisionDevice = async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch("/api/admin/devices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deviceId: deviceForm.deviceId.trim(),
        name: deviceForm.name.trim(),
        location: deviceForm.location.trim(),
        lat: deviceForm.lat ? parseFloat(deviceForm.lat) : null,
        lng: deviceForm.lng ? parseFloat(deviceForm.lng) : null,
      }),
    });
    if (res.ok) {
      setShowDeviceForm(false);
      setDeviceForm({ deviceId: "", name: "", location: "", lat: "", lng: "" });
      fetchData();
    } else {
      const err = await res.json();
      setError(err.error ?? "Failed to provision device");
    }
  };

  const updateDeviceStatus = async (
    deviceId: string,
    status: string
  ) => {
    const token = await getToken();
    if (!token) return;
    await fetch("/api/admin/devices", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ deviceId, status }),
    });
    fetchData();
  };

  const removeDevice = async (deviceId: string) => {
    const token = await getToken();
    if (!token) return;
    await fetch(`/api/admin/devices?deviceId=${encodeURIComponent(deviceId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchData();
  };

  const changeUserRole = async (userId: string, role: string) => {
    const token = await getToken();
    if (!token) return;
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, role }),
    });
    fetchData();
  };

  const removeUser = async (userId: string) => {
    const token = await getToken();
    if (!token) return;
    await fetch(`/api/admin/users?userId=${encodeURIComponent(userId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchData();
  };

  const isAdmin = me && (me.role === "super_admin" || me.role === "admin");

  if (loading) {
    return (
      <div className="tab-content-enter px-4 pb-28 flex items-center justify-center pt-12">
        <p className="text-sm text-muted">Loading admin panel...</p>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="tab-content-enter px-4 pb-28 pt-8">
        <div className="bg-surface border border-border rounded-2xl p-6 text-center">
          <p className="text-sm text-muted">Unable to load user profile.</p>
          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  const roleColor = {
    super_admin: "text-aqi-purple",
    admin: "text-amber-yellow",
    user: "text-muted",
  };

  return (
    <div className="tab-content-enter px-4 pb-28">
      {/* Profile card */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-ink">{me.name || me.email}</div>
            <div className="text-xs text-muted">{me.email}</div>
          </div>
          <span
            className={`text-xs font-bold uppercase tracking-wider ${roleColor[me.role]}`}
          >
            {me.role.replace("_", " ")}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-aqi-red/10 border border-aqi-red/20 rounded-xl p-3 mb-4">
          <p className="text-sm text-aqi-red">{error}</p>
        </div>
      )}

      {!isAdmin && (
        <div className="bg-surface border border-border rounded-2xl p-6 text-center">
          <p className="text-sm text-muted mb-2">You have a <strong>user</strong> role.</p>
          <p className="text-xs text-muted/60">
            Contact an admin to manage devices and users.
          </p>
          {devices.length > 0 && (
            <div className="mt-4 text-left">
              <div className="text-xs font-bold text-ink mb-2 uppercase tracking-wider">
                Your Devices
              </div>
              {devices.map((d) => (
                <div
                  key={d.deviceId}
                  className="flex items-center gap-3 bg-bg border border-border rounded-xl px-4 py-3 mb-2"
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      d.status === "active"
                        ? "bg-bair-green"
                        : d.status === "provisioning"
                        ? "bg-amber-yellow"
                        : "bg-muted/30"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink">{d.name}</div>
                    <div className="text-xs text-muted">{d.deviceId}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isAdmin && (
        <>
          {/* Admin tabs */}
          <div className="flex gap-2 mb-4">
            {(["devices", "users"] as AdminTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setAdminTab(t)}
                className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${
                  adminTab === t
                    ? "bg-primary text-white"
                    : "bg-surface border border-border text-muted hover:text-ink"
                }`}
              >
                {t === "devices" ? "Devices" : "Users"}
              </button>
            ))}
          </div>

          {/* Devices tab */}
          {adminTab === "devices" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-ink">
                  Registered Devices ({devices.length})
                </h3>
                <button
                  onClick={() => setShowDeviceForm((p) => !p)}
                  className="text-xs font-medium bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-hover transition-colors"
                >
                  {showDeviceForm ? "Cancel" : "+ Add Device"}
                </button>
              </div>

              {showDeviceForm && (
                <div className="bg-surface border border-border rounded-2xl p-4 mb-4">
                  <div className="text-xs font-bold text-ink mb-3 uppercase tracking-wider">
                    Provision New Device
                  </div>
                  <div className="flex flex-col gap-3">
                    <input
                      placeholder="Device ID (e.g. 64E83383EC74)"
                      value={deviceForm.deviceId}
                      onChange={(e) =>
                        setDeviceForm((p) => ({ ...p, deviceId: e.target.value }))
                      }
                      className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-ink placeholder:text-muted/40"
                    />
                    <input
                      placeholder="Name (e.g. Office Sensor)"
                      value={deviceForm.name}
                      onChange={(e) =>
                        setDeviceForm((p) => ({ ...p, name: e.target.value }))
                      }
                      className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-ink placeholder:text-muted/40"
                    />
                    <input
                      placeholder="Location (e.g. Shoreditch, London)"
                      value={deviceForm.location}
                      onChange={(e) =>
                        setDeviceForm((p) => ({ ...p, location: e.target.value }))
                      }
                      className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-ink placeholder:text-muted/40"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        placeholder="Latitude"
                        value={deviceForm.lat}
                        onChange={(e) =>
                          setDeviceForm((p) => ({ ...p, lat: e.target.value }))
                        }
                        className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-ink placeholder:text-muted/40"
                      />
                      <input
                        placeholder="Longitude"
                        value={deviceForm.lng}
                        onChange={(e) =>
                          setDeviceForm((p) => ({ ...p, lng: e.target.value }))
                        }
                        className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-ink placeholder:text-muted/40"
                      />
                    </div>
                    <button
                      onClick={provisionDevice}
                      disabled={!deviceForm.deviceId.trim() || !deviceForm.name.trim()}
                      className="bg-primary text-white font-medium text-sm py-2 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Provision Device
                    </button>
                  </div>
                </div>
              )}

              {devices.length === 0 ? (
                <div className="bg-surface border border-border rounded-2xl p-6 text-center">
                  <p className="text-sm text-muted">No devices registered yet.</p>
                  <p className="text-xs text-muted/60 mt-1">
                    Click &quot;+ Add Device&quot; to provision your first sensor.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {devices.map((d) => (
                    <div
                      key={d.deviceId}
                      className="bg-surface border border-border rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full shrink-0 ${
                            d.status === "active"
                              ? "bg-bair-green"
                              : d.status === "provisioning"
                              ? "bg-amber-yellow"
                              : "bg-muted/30"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-ink">
                            {d.name}
                          </div>
                          <div className="text-xs text-muted">
                            {d.deviceId} · {d.location || "No location"}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            d.status === "active"
                              ? "text-bair-green"
                              : d.status === "provisioning"
                              ? "text-amber-yellow"
                              : "text-muted/50"
                          }`}
                        >
                          {d.status}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2 pt-2 border-t border-border">
                        {d.status !== "active" && (
                          <button
                            onClick={() =>
                              updateDeviceStatus(d.deviceId, "active")
                            }
                            className="text-xs text-bair-green hover:underline"
                          >
                            Activate
                          </button>
                        )}
                        {d.status === "active" && (
                          <button
                            onClick={() =>
                              updateDeviceStatus(d.deviceId, "inactive")
                            }
                            className="text-xs text-amber-yellow hover:underline"
                          >
                            Deactivate
                          </button>
                        )}
                        {me.role === "super_admin" && (
                          <button
                            onClick={() => removeDevice(d.deviceId)}
                            className="text-xs text-aqi-red hover:underline ml-auto"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Users tab */}
          {adminTab === "users" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-ink">
                  Users ({users.length})
                </h3>
              </div>

              {users.length === 0 ? (
                <div className="bg-surface border border-border rounded-2xl p-6 text-center">
                  <p className="text-sm text-muted">
                    No users yet. Users are auto-created on first login.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {users.map((u) => (
                    <div
                      key={u.userId}
                      className="bg-surface border border-border rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-ink">
                            {u.name || u.email}
                          </div>
                          <div className="text-xs text-muted">{u.email}</div>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${roleColor[u.role]}`}
                        >
                          {u.role.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2 pt-2 border-t border-border items-center">
                        <span className="text-xs text-muted mr-1">Role:</span>
                        {(
                          ["user", "admin", "super_admin"] as const
                        ).map((r) => (
                          <button
                            key={r}
                            onClick={() => changeUserRole(u.userId, r)}
                            disabled={
                              u.role === r ||
                              (r === "super_admin" &&
                                me.role !== "super_admin") ||
                              (r === "admin" &&
                                me.role !== "super_admin") ||
                              u.userId === me.userId
                            }
                            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                              u.role === r
                                ? "bg-primary/20 text-primary font-bold"
                                : "bg-bg text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
                            }`}
                          >
                            {r.replace("_", " ")}
                          </button>
                        ))}
                        {me.role === "super_admin" &&
                          u.userId !== me.userId && (
                            <button
                              onClick={() => removeUser(u.userId)}
                              className="text-xs text-aqi-red hover:underline ml-auto"
                            >
                              Delete
                            </button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
