"use client";

import type { AqiState } from "@/lib/aqi";

export default function GuidanceStrip({ aqiState }: { aqiState: AqiState }) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-sm mx-auto">
      {aqiState.guidance.map((tip, i) => (
        <div
          key={i}
          className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3"
        >
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: aqiState.orbColor }}
          />
          <span className="text-sm font-medium text-ink/80">{tip}</span>
        </div>
      ))}
    </div>
  );
}
