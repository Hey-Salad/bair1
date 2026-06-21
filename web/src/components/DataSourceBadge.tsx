"use client";

interface DataSourceBadgeProps {
  isLive: boolean;
  sensorId?: string;
  source?: string;
}

export default function DataSourceBadge({ isLive, sensorId, source }: DataSourceBadgeProps) {
  if (isLive) {
    return (
      <div className="flex items-center gap-2 bg-bair-green/10 border border-bair-green/20 rounded-full px-3 py-1.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bair-green opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-bair-green" />
        </span>
        <span className="text-xs font-medium text-bair-green">
          Live — Sensor {sensorId?.slice(-4) ?? ""}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-amber-yellow/10 border border-amber-yellow/30 rounded-full px-3 py-1.5">
      <span className="relative flex h-2.5 w-2.5">
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-yellow" />
      </span>
      <span className="text-xs font-medium text-amber-yellow/90">
        Demo Data{source ? ` — ${source}` : ""}
      </span>
    </div>
  );
}
