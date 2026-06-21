"use client";

interface PmStatsProps {
  pm25: number;
  pm10: number;
}

export default function PmStats({ pm25, pm10 }: PmStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-sm mx-auto">
      <div className="bg-surface border border-border rounded-xl px-4 py-3 text-center">
        <div className="text-xs font-medium text-muted uppercase tracking-wider">PM2.5</div>
        <div className="text-2xl font-bold text-ink mt-0.5">{pm25}</div>
        <div className="text-xs text-muted/60">µg/m³</div>
      </div>
      <div className="bg-surface border border-border rounded-xl px-4 py-3 text-center">
        <div className="text-xs font-medium text-muted uppercase tracking-wider">PM10</div>
        <div className="text-2xl font-bold text-ink mt-0.5">{pm10}</div>
        <div className="text-xs text-muted/60">µg/m³</div>
      </div>
    </div>
  );
}
