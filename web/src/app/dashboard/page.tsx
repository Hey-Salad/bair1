"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Logo from "@/components/Logo";
import AqiGauge from "@/components/AqiGauge";
import GuidanceStrip from "@/components/GuidanceStrip";
import EnvironmentCards from "@/components/EnvironmentCards";
import Navigation, { type Tab } from "@/components/Navigation";
import MapView from "@/components/MapView";
import AnalyticsView from "@/components/AnalyticsView";
import AIChatView from "@/components/AIChatView";
import AdminView from "@/components/AdminView";
import DataSourceBadge from "@/components/DataSourceBadge";
import { getAqiState } from "@/lib/aqi";

interface DeviceOption {
  deviceId: string;
  name: string;
  lat?: number | null;
  lng?: number | null;
}

export default function Dashboard() {
  const {
    isLoading,
    isAuthenticated,
    error,
    loginWithRedirect: login,
    logout: auth0Logout,
    user,
  } = useAuth0();

  const signup = () =>
    login({ authorizationParams: { screen_hint: "signup" } });

  const logout = () =>
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });

  const [tab, setTab] = useState<Tab>("home");
  const [aqi, setAqi] = useState(42);
  const [sensorId, setSensorId] = useState("64E83383EC74");
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [lastUpdatedText, setLastUpdatedText] = useState("Just now");
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [deviceLat, setDeviceLat] = useState<number | null>(null);
  const [deviceLng, setDeviceLng] = useState<number | null>(null);
  const [gasVoltage, setGasVoltage] = useState<number | null>(null);
  const [rssi, setRssi] = useState<number | null>(null);
  const [airState, setAirState] = useState<string | null>(null);
  const [uptimeMs, setUptimeMs] = useState<number | null>(null);
  const [pm1, setPm1] = useState<number | null>(null);
  const [pm25, setPm25] = useState<number | null>(null);
  const [pm4, setPm4] = useState<number | null>(null);
  const [pm10, setPm10] = useState<number | null>(null);
  const [sensorModel, setSensorModel] = useState<string | null>(null);
  const [board, setBoard] = useState<string | null>(null);
  const [firmwareVersion, setFirmwareVersion] = useState<string | null>(null);
  const [transport, setTransport] = useState<string | null>(null);

  const aqiState = getAqiState(aqi);

  // Fetch registered devices
  useEffect(() => {
    async function fetchDevices() {
      try {
        const query = `{
          registeredDevices { deviceId name status lat lng }
          activeDeviceIds
        }`;
        const res = await fetch("/api/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        if (!res.ok) return;
        const json = await res.json();
        const registered = json.data?.registeredDevices ?? [];
        const activeIds: string[] = json.data?.activeDeviceIds ?? [];

        const deviceMap = new Map<string, DeviceOption>();
        for (const d of registered) {
          deviceMap.set(d.deviceId, { deviceId: d.deviceId, name: d.name, lat: d.lat, lng: d.lng });
        }
        for (const id of activeIds) {
          if (!deviceMap.has(id)) {
            deviceMap.set(id, { deviceId: id, name: `Sensor ${id.slice(-4)}` });
          }
        }

        const list = Array.from(deviceMap.values());
        setDevices(list);
        if (list.length > 0 && !selectedDevice) {
          setSelectedDevice(list[0].deviceId);
          if (list[0].lat) setDeviceLat(list[0].lat);
          if (list[0].lng) setDeviceLng(list[0].lng);
        }
      } catch {}
    }
    fetchDevices();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch live data
  const fetchLive = useCallback(async () => {
    const deviceId = selectedDevice;
    if (!deviceId) return;

    try {
      const query = `{
        latestReading(deviceId: "${deviceId}") {
          deviceId timestamp aqi gasVoltage rssi airState uptimeMs
          pm1 pm25 pm4 pm10 sensorModel board firmwareVersion transport
        }
      }`;
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error("API unavailable");
      const json = await res.json();
      const reading = json.data?.latestReading;
      if (reading?.aqi !== undefined) {
        setAqi(reading.aqi);
        setSensorId(reading.deviceId);
        setGasVoltage(reading.gasVoltage);
        setRssi(reading.rssi);
        setAirState(reading.airState);
        setUptimeMs(reading.uptimeMs);
        setPm1(reading.pm1);
        setPm25(reading.pm25);
        setPm4(reading.pm4);
        setPm10(reading.pm10);
        setSensorModel(reading.sensorModel);
        setBoard(reading.board);
        setFirmwareVersion(reading.firmwareVersion);
        setTransport(reading.transport);
        setLastUpdated(new Date(reading.timestamp));
        setIsLive(true);
        setLastUpdatedText("Just now");
        return;
      }
      throw new Error("No reading");
    } catch {
      setIsLive(false);
    }
  }, [selectedDevice]);

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 60000);
    return () => clearInterval(interval);
  }, [fetchLive]);

  // Update device location when selection changes
  useEffect(() => {
    const dev = devices.find((d) => d.deviceId === selectedDevice);
    if (dev?.lat) setDeviceLat(dev.lat);
    if (dev?.lng) setDeviceLng(dev.lng);
  }, [selectedDevice, devices]);

  // Demo data when not live
  useEffect(() => {
    if (isLive) return;
    const interval = setInterval(() => {
      setAqi((prev) => Math.max(0, Math.min(500, prev + Math.floor(Math.random() * 11 - 5))));
      setLastUpdated(new Date());
      setLastUpdatedText("Just now");
    }, 60000);
    return () => clearInterval(interval);
  }, [isLive]);

  // Last updated text
  useEffect(() => {
    const tick = setInterval(() => {
      const secs = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      if (secs < 60) setLastUpdatedText("Just now");
      else setLastUpdatedText(`${Math.floor(secs / 60)}m ago`);
    }, 10000);
    return () => clearInterval(tick);
  }, [lastUpdated]);

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Logo />
          <p className="text-sm text-muted mt-4">Loading...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <Logo />
          <h1 className="text-2xl font-bold text-ink mt-6 mb-2">Your AI Air Bear</h1>
          <p className="text-sm text-muted mb-8">
            Sign in to meet your bear. Real-time air quality, honestly delivered.
          </p>
          {error && <p className="text-sm text-red-400 mb-4">Error: {error.message}</p>}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => login()}
              className="bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors text-sm"
            >
              Log in
            </button>
            <button
              onClick={signup}
              className="border border-border text-ink font-semibold px-6 py-3 rounded-lg hover:bg-surface transition-colors text-sm"
            >
              Sign up
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col">
      <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <a href="/"><Logo /></a>
          <div className="flex items-center gap-3">
            <select
              value={selectedDevice ?? ""}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="bg-surface border border-border rounded-lg px-2 py-1 text-xs text-ink max-w-[200px]"
            >
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.name} ({d.deviceId.slice(-4)})
                </option>
              ))}
            </select>
            <div className="text-right">
              <div className="text-xs font-medium text-ink/70">{user?.name ?? "Bair1"}</div>
              <div className="text-[10px] text-muted/60">{lastUpdatedText}</div>
            </div>
            <button
              onClick={logout}
              className="text-[10px] text-muted/60 hover:text-ink/70 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full pt-4">
        {tab === "home" && (
          <div className="tab-content-enter px-4 pb-28">
            {/* Desktop: two-column layout */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left column: Gauge + PM stats */}
              <div className="flex flex-col items-center gap-5 lg:w-1/2">
                <DataSourceBadge
                  isLive={isLive}
                  sensorId={sensorId}
                  source="Simulated readings"
                />

                <AqiGauge aqi={aqi} size={240} />
                <GuidanceStrip aqiState={aqiState} />

                {/* PM particulate stats */}
                {pm25 != null && (
                  <div className="w-full">
                    <div className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Particulate Matter</div>
                    <div className="grid grid-cols-4 gap-2 w-full">
                      <div className="bg-surface border border-border rounded-xl p-3 text-center">
                        <svg className="mx-auto mb-1 text-muted/40" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="2"/><circle cx="7" cy="8" r="1.5"/><circle cx="17" cy="9" r="1"/><circle cx="9" cy="16" r="1"/><circle cx="16" cy="15" r="1.5"/></svg>
                        <div className="text-lg font-bold text-ink">{pm1?.toFixed(1) ?? "—"}</div>
                        <div className="text-[10px] text-muted uppercase">PM1.0</div>
                        <div className="text-[9px] text-muted/50">µg/m³</div>
                      </div>
                      <div className="bg-surface border border-primary/40 rounded-xl p-3 text-center">
                        <svg className="mx-auto mb-1 text-primary/60" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><circle cx="6" cy="7" r="2"/><circle cx="18" cy="8" r="1.5"/><circle cx="8" cy="17" r="1.5"/><circle cx="17" cy="16" r="2"/></svg>
                        <div className="text-lg font-bold text-primary">{pm25?.toFixed(1) ?? "—"}</div>
                        <div className="text-[10px] text-muted uppercase">PM2.5</div>
                        <div className="text-[9px] text-muted/50">µg/m³</div>
                      </div>
                      <div className="bg-surface border border-border rounded-xl p-3 text-center">
                        <svg className="mx-auto mb-1 text-muted/40" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3.5"/><circle cx="5" cy="8" r="2.5"/><circle cx="19" cy="9" r="2"/><circle cx="7" cy="17" r="2"/><circle cx="18" cy="16" r="2.5"/></svg>
                        <div className="text-lg font-bold text-ink">{pm4?.toFixed(1) ?? "—"}</div>
                        <div className="text-[10px] text-muted uppercase">PM4.0</div>
                        <div className="text-[9px] text-muted/50">µg/m³</div>
                      </div>
                      <div className="bg-surface border border-border rounded-xl p-3 text-center">
                        <svg className="mx-auto mb-1 text-muted/40" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="4"/><circle cx="4" cy="7" r="3"/><circle cx="20" cy="8" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="19" cy="17" r="3"/></svg>
                        <div className="text-lg font-bold text-ink">{pm10?.toFixed(1) ?? "—"}</div>
                        <div className="text-[10px] text-muted uppercase">PM10</div>
                        <div className="text-[9px] text-muted/50">µg/m³</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sensor connectivity stats */}
                <div className="grid grid-cols-3 gap-2 w-full">
                  <div className="bg-surface border border-border rounded-xl p-3 text-center">
                    <svg className="mx-auto mb-1 text-muted/40" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 20V4"/></svg>
                    <div className="text-lg font-bold text-ink">{rssi ?? "—"}</div>
                    <div className="text-[10px] text-muted uppercase">RSSI dBm</div>
                  </div>
                  <div className="bg-surface border border-border rounded-xl p-3 text-center">
                    <svg className="mx-auto mb-1 text-muted/40" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <div className="text-lg font-bold text-ink">
                      {uptimeMs ? `${Math.floor(uptimeMs / 60000)}m` : "—"}
                    </div>
                    <div className="text-[10px] text-muted uppercase">Uptime</div>
                  </div>
                  <div className="bg-surface border border-border rounded-xl p-3 text-center">
                    <svg className="mx-auto mb-1 text-muted/40" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>
                    <div className="text-lg font-bold text-ink">{transport ?? "—"}</div>
                    <div className="text-[10px] text-muted uppercase">Transport</div>
                  </div>
                </div>

                {airState && (
                  <div className="w-full bg-surface border border-border rounded-xl px-4 py-2 text-center">
                    <span className="text-xs text-muted">Air State: </span>
                    <span className="text-xs font-medium text-ink">{airState}</span>
                  </div>
                )}
              </div>

              {/* Right column: Devices + Environmental */}
              <div className="flex flex-col gap-5 lg:w-1/2">
                {/* Devices list */}
                <div className="w-full">
                  <div className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Devices</div>
                  <div className="flex flex-col gap-2">
                    {devices.map((d) => {
                      const isSelected = d.deviceId === selectedDevice;
                      return (
                        <button
                          key={d.deviceId}
                          onClick={() => setSelectedDevice(d.deviceId)}
                          className={`w-full text-left bg-surface border rounded-xl px-4 py-3 transition-colors ${
                            isSelected ? "border-primary/60 bg-primary/5" : "border-border hover:border-border/80"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-ink">{d.name}</div>
                              <div className="text-[10px] text-muted/60 font-mono">{d.deviceId}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isSelected && isLive && (
                                <span className="text-[10px] text-green-400 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                  Live
                                </span>
                              )}
                              {isSelected && sensorModel && (
                                <span className="text-[10px] text-muted/60">{sensorModel}</span>
                              )}
                            </div>
                          </div>
                          {isSelected && (board || firmwareVersion) && (
                            <div className="flex gap-3 mt-1.5">
                              {board && (
                                <span className="text-[10px] text-muted/50">{board}</span>
                              )}
                              {firmwareVersion && (
                                <span className="text-[10px] text-muted/50">v{firmwareVersion}</span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                    {devices.length === 0 && (
                      <div className="bg-surface border border-border rounded-xl px-4 py-6 text-center">
                        <div className="text-sm text-muted">No devices registered</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Environmental data from Google APIs */}
                <div className="w-full">
                  <div className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Environmental Intelligence</div>
                  <EnvironmentCards lat={deviceLat} lng={deviceLng} />
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "map" && <MapView />}
        {tab === "analytics" && <AnalyticsView deviceId={selectedDevice ?? undefined} />}
        {tab === "ai" && (
          <AIChatView
            deviceId={selectedDevice ?? undefined}
            lat={deviceLat}
            lng={deviceLng}
          />
        )}
        {tab === "admin" && <AdminView />}
      </div>

      <Navigation active={tab} onChange={setTab} />
    </main>
  );
}
