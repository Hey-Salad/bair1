"use client";

import { useState, useEffect } from "react";
import { getAqiColor } from "@/lib/aqi";

interface DayData {
  day: string;
  date: string;
  peak: number;
  avg: number;
  count: number;
}

interface Props {
  deviceId?: string;
}

export default function HistoryView({ deviceId }: Props) {
  const [history, setHistory] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!deviceId) {
        setLoading(false);
        return;
      }

      try {
        const now = new Date();
        const from = new Date(now);
        from.setDate(from.getDate() - 7);

        const query = `{
          timeSeries(
            deviceId: "${deviceId}"
            from: "${from.toISOString()}"
            to: "${now.toISOString()}"
          ) { timestamp aqi }
        }`;

        const res = await fetch("/api/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        const points: { timestamp: string; aqi: number }[] =
          json.data?.timeSeries ?? [];

        if (points.length === 0) {
          setLoading(false);
          return;
        }

        // Group by day
        const dayMap = new Map<
          string,
          { peaks: number[]; day: string; date: string }
        >();
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const monthNames = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ];

        for (const p of points) {
          const d = new Date(p.timestamp);
          const key = d.toISOString().slice(0, 10);
          if (!dayMap.has(key)) {
            dayMap.set(key, {
              peaks: [],
              day: dayNames[d.getDay()],
              date: `${monthNames[d.getMonth()]} ${d.getDate()}`,
            });
          }
          dayMap.get(key)!.peaks.push(p.aqi);
        }

        const days: DayData[] = Array.from(dayMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, v]) => ({
            day: v.day,
            date: v.date,
            peak: Math.max(...v.peaks),
            avg: Math.round(
              v.peaks.reduce((a, b) => a + b, 0) / v.peaks.length
            ),
            count: v.peaks.length,
          }));

        setHistory(days);
      } catch {
        // silently fail — will show empty state
      }
      setLoading(false);
    }

    fetchHistory();
  }, [deviceId]);

  if (loading) {
    return (
      <div className="tab-content-enter px-4 pb-28 flex items-center justify-center pt-12">
        <p className="text-sm text-muted">Loading history...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="tab-content-enter px-4 pb-28">
        <h2 className="text-xl font-bold text-ink mb-1">7-Day History</h2>
        <p className="text-sm text-muted mb-6">Air quality trends for your sensor</p>
        <div className="bg-surface border border-border rounded-2xl p-6 text-center">
          <p className="text-sm text-muted">No historical data available yet.</p>
          <p className="text-xs text-muted/60 mt-1">
            Data will appear here once your sensor has been active for a while.
          </p>
        </div>
      </div>
    );
  }

  const maxPeak = Math.max(...history.map((d) => d.peak));
  const best = history.reduce((a, b) => (a.peak < b.peak ? a : b));
  const worst = history.reduce((a, b) => (a.peak > b.peak ? a : b));

  return (
    <div className="tab-content-enter px-4 pb-28">
      <h2 className="text-xl font-bold text-ink mb-1">7-Day History</h2>
      <p className="text-sm text-muted mb-6">Air quality trends for your sensor</p>

      {/* Bar chart */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-5">
        <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
          {history.map((d, i) => {
            const height = Math.max((d.peak / maxPeak) * 130, 12);
            return (
              <div key={i} className="flex flex-col items-center flex-1 gap-1.5">
                <span className="text-xs font-medium text-muted">{d.peak}</span>
                <div
                  className="bar-grow w-full rounded-t-lg"
                  style={{
                    height,
                    backgroundColor: getAqiColor(d.peak),
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
                <span className="text-xs text-muted/60">{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Callouts */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-clean-air/15 border border-clean-air/20 rounded-xl p-3">
          <div className="text-xs font-medium text-bair-green mb-1">Best Day</div>
          <div className="text-sm font-bold text-ink">
            {best.day} — AQI {best.peak}
          </div>
        </div>
        <div className="bg-aqi-orange/15 border border-aqi-orange/20 rounded-xl p-3">
          <div className="text-xs font-medium text-aqi-orange mb-1">Worst Spike</div>
          <div className="text-sm font-bold text-ink">
            {worst.day} — AQI {worst.peak}
          </div>
        </div>
      </div>

      {/* Daily log */}
      <div className="flex flex-col gap-2">
        {history.map((d, i) => (
          <div
            key={i}
            className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3"
          >
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: getAqiColor(d.peak) }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ink">
                {d.day}, {d.date}
              </div>
              <div className="text-xs text-muted truncate">
                Avg AQI {d.avg} · {d.count} readings
              </div>
            </div>
            <div
              className="text-sm font-bold"
              style={{ color: getAqiColor(d.peak) }}
            >
              {d.peak}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
