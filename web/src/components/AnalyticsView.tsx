"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  Cell,
} from "recharts";
import { getAqiColor } from "@/lib/aqi";

interface Props {
  deviceId?: string;
}

interface TimePoint {
  timestamp: string;
  aqi: number;
  gasVoltage: number | null;
  rssi: number | null;
}

type Range = "24h" | "7d" | "30d";

export default function AnalyticsView({ deviceId }: Props) {
  const [range, setRange] = useState<Range>("24h");
  const [data, setData] = useState<TimePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      const now = new Date();
      const hours = range === "24h" ? 24 : range === "7d" ? 168 : 720;
      const from = new Date(now.getTime() - hours * 3600000).toISOString();

      const query = `{
        timeSeries(deviceId: "${deviceId}", from: "${from}", to: "${now.toISOString()}") {
          timestamp aqi gasVoltage rssi
        }
      }`;

      try {
        const res = await fetch("/api/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const json = await res.json();
        setData(json.data?.timeSeries ?? []);
      } catch {
        setData([]);
      }
      setLoading(false);
    }

    fetchData();
  }, [deviceId, range]);

  if (loading) {
    return (
      <div className="tab-content-enter px-4 pb-28 flex items-center justify-center pt-12">
        <p className="text-sm text-muted">Loading analytics...</p>
      </div>
    );
  }

  if (!deviceId) {
    return (
      <div className="tab-content-enter px-4 pb-28 text-center pt-12">
        <p className="text-sm text-muted">Select a device to view analytics</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    time: new Date(d.timestamp).getTime(),
    label: formatTime(d.timestamp, range),
    aqi: d.aqi,
    gasVoltage: d.gasVoltage,
    rssi: d.rssi,
  }));

  // Downsample for display
  const maxPoints = 120;
  const step = Math.max(1, Math.floor(chartData.length / maxPoints));
  const sampled = chartData.filter((_, i) => i % step === 0);

  // Stats
  const aqis = data.map((d) => d.aqi);
  const avg = aqis.length ? Math.round(aqis.reduce((a, b) => a + b, 0) / aqis.length) : 0;
  const max = aqis.length ? Math.max(...aqis) : 0;
  const min = aqis.length ? Math.min(...aqis) : 0;

  // Distribution
  const buckets = [
    { label: "Good", range: "0-50", min: 0, max: 50, color: "#8DC44A", count: 0 },
    { label: "Moderate", range: "51-100", min: 51, max: 100, color: "#F5C542", count: 0 },
    { label: "Sensitive", range: "101-150", min: 101, max: 150, color: "#ED8B00", count: 0 },
    { label: "Unhealthy", range: "151-200", min: 151, max: 200, color: "#D63031", count: 0 },
    { label: "Very Unhealthy", range: "201+", min: 201, max: 999, color: "#6C3483", count: 0 },
  ];
  for (const a of aqis) {
    const bucket = buckets.find((b) => a >= b.min && a <= b.max);
    if (bucket) bucket.count++;
  }

  return (
    <div className="tab-content-enter px-4 pb-28">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-ink">Analytics</h2>
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-0.5">
          {(["24h", "7d", "30d"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                range === r ? "bg-primary text-white" : "text-muted hover:text-ink"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: "Readings", value: data.length },
          { label: "Avg AQI", value: avg, color: getAqiColor(avg) },
          { label: "Peak", value: max, color: getAqiColor(max) },
          { label: "Low", value: min, color: getAqiColor(min) },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-3 text-center">
            <div className="text-xl font-bold" style={{ color: s.color || "var(--color-ink)" }}>
              {s.value}
            </div>
            <div className="text-[10px] text-muted uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      {/* AQI over time */}
      {sampled.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4 mb-5">
          <div className="text-xs font-medium text-muted uppercase mb-3">AQI Over Time</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={sampled}>
              <defs>
                <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8DC44A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8DC44A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "var(--color-muted)" }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--color-muted)" }}
                domain={[0, "auto"]}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="aqi"
                stroke="#8DC44A"
                fill="url(#aqiGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Distribution */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-5">
        <div className="text-xs font-medium text-muted uppercase mb-3">AQI Distribution</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={buckets} barSize={32}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "var(--color-muted)" }}
            />
            <YAxis tick={{ fontSize: 10, fill: "var(--color-muted)" }} />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {buckets.map((b, i) => (
                <Cell key={i} fill={b.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* AQI vs Signal Strength scatter */}
      {sampled.some((d) => d.rssi != null) && (
        <div className="bg-surface border border-border rounded-2xl p-4 mb-5">
          <div className="text-xs font-medium text-muted uppercase mb-3">AQI vs Signal Strength</div>
          <ResponsiveContainer width="100%" height={160}>
            <ScatterChart>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="rssi"
                name="RSSI"
                tick={{ fontSize: 10, fill: "var(--color-muted)" }}
                label={{ value: "RSSI (dBm)", position: "bottom", fontSize: 10, fill: "var(--color-muted)" }}
              />
              <YAxis
                dataKey="aqi"
                name="AQI"
                tick={{ fontSize: 10, fill: "var(--color-muted)" }}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Scatter data={sampled.filter((d) => d.rssi != null)} fill="#8DC44A" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function formatTime(ts: string, range: Range): string {
  const d = new Date(ts);
  if (range === "24h") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (range === "7d") return d.toLocaleDateString([], { weekday: "short", hour: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
