"use client";

import { useState } from "react";
import { getAqiColor, getAqiState } from "@/lib/aqi";

interface AlertHistoryItem {
  time: string;
  message: string;
  aqi: number;
}

const mockAlerts: AlertHistoryItem[] = [
  { time: "Today, 8:12am", message: "AQI rose above 50 near Old Street", aqi: 67 },
  { time: "Yesterday, 3:45pm", message: "Spike detected: AQI 112 on Mile End Road", aqi: 112 },
  { time: "Jun 12, 7:00am", message: "Morning briefing: Good air quality expected", aqi: 32 },
  { time: "Jun 11, 2:30pm", message: "AQI dropped back to Good near you", aqi: 38 },
];

export default function AlertsView() {
  const [thresholds, setThresholds] = useState({ above50: true, above100: true, above150: false });
  const [morningBriefing, setMorningBriefing] = useState(true);

  const currentState = getAqiState(42);

  return (
    <div className="tab-content-enter px-4 pb-28">
      <h2 className="text-xl font-bold text-ink mb-1">Alerts</h2>
      <p className="text-sm text-muted mb-5">Get notified when air quality changes</p>

      {/* Current status */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-5">
        <div className="text-xs font-medium text-muted mb-2 uppercase tracking-wider">
          Right now
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: currentState.orbColor }}
          >
            42
          </div>
          <div>
            <div className="text-sm font-bold text-ink">{currentState.level}</div>
            <div className="text-xs text-muted">{currentState.guidance[0]}</div>
          </div>
        </div>
      </div>

      {/* Threshold selectors */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-5">
        <div className="text-sm font-bold text-ink mb-3">Alert Thresholds</div>
        {[
          { key: "above50" as const, label: "Above 50 — Moderate", color: "#F5C542" },
          { key: "above100" as const, label: "Above 100 — Sensitive", color: "#ED8B00" },
          { key: "above150" as const, label: "Above 150 — Unhealthy", color: "#D63031" },
        ].map((t) => (
          <label
            key={t.key}
            className="flex items-center justify-between py-2.5 border-b border-border last:border-0 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
              <span className="text-sm text-ink/80">{t.label}</span>
            </div>
            <button
              onClick={() => setThresholds((p) => ({ ...p, [t.key]: !p[t.key] }))}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                thresholds[t.key] ? "bg-primary" : "bg-muted/30"
              }`}
              role="switch"
              aria-checked={thresholds[t.key]}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  thresholds[t.key] ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>
        ))}

        {/* Morning briefing */}
        <label className="flex items-center justify-between pt-3 mt-1 border-t border-border cursor-pointer">
          <div>
            <div className="text-sm font-medium text-ink">Morning Briefing</div>
            <div className="text-xs text-muted">Daily summary at 7am</div>
          </div>
          <button
            onClick={() => setMorningBriefing((p) => !p)}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              morningBriefing ? "bg-primary" : "bg-muted/30"
            }`}
            role="switch"
            aria-checked={morningBriefing}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                morningBriefing ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </label>
      </div>

      {/* Alert history */}
      <div className="text-sm font-bold text-ink mb-3">Recent Alerts</div>
      <div className="flex flex-col gap-2">
        {mockAlerts.map((alert, i) => (
          <div key={i} className="flex items-start gap-3 bg-surface border border-border rounded-xl px-4 py-3">
            <div
              className="w-3 h-3 rounded-full shrink-0 mt-1"
              style={{ backgroundColor: getAqiColor(alert.aqi) }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-ink">{alert.message}</div>
              <div className="text-xs text-muted mt-0.5">{alert.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
