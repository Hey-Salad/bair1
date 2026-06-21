"use client";

import { getAqiColor } from "@/lib/aqi";

interface AqiGaugeProps {
  aqi: number;
  size?: number;
}

export default function AqiGauge({ aqi, size = 200 }: AqiGaugeProps) {
  const color = getAqiColor(aqi);
  const maxAqi = 500;
  const percentage = Math.min(aqi / maxAqi, 1);
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius; // semi-circle
  const strokeDashoffset = circumference * (1 - percentage);
  const cx = size / 2;
  const cy = size / 2 + 10;

  const getLabel = (aqi: number) => {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Sensitive";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very Unhealthy";
    return "Hazardous";
  };

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size * 0.7 }}>
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.6}`}>
        {/* Background track */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={12}
          strokeLinecap="round"
        />
        {/* Color segments for reference */}
        {[
          { pct: 0.1, c: "#8DC44A" },
          { pct: 0.2, c: "#F5C542" },
          { pct: 0.3, c: "#ED8B00" },
          { pct: 0.4, c: "#D63031" },
          { pct: 0.6, c: "#6C3483" },
          { pct: 1.0, c: "#4A4A4A" },
        ].map((seg, i, arr) => {
          const start = i === 0 ? 0 : arr[i - 1].pct;
          const startAngle = Math.PI + start * Math.PI;
          const endAngle = Math.PI + seg.pct * Math.PI;
          const x1 = cx + radius * Math.cos(startAngle);
          const y1 = cy + radius * Math.sin(startAngle);
          const x2 = cx + radius * Math.cos(endAngle);
          const y2 = cy + radius * Math.sin(endAngle);
          const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
              fill="none"
              stroke={seg.c}
              strokeWidth={12}
              strokeLinecap="butt"
              opacity={0.2}
            />
          );
        })}
        {/* Active arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
        {/* Needle indicator */}
        {(() => {
          const angle = Math.PI + percentage * Math.PI;
          const nx = cx + (radius - 20) * Math.cos(angle);
          const ny = cy + (radius - 20) * Math.sin(angle);
          return (
            <circle
              cx={nx}
              cy={ny}
              r={6}
              fill={color}
              stroke="white"
              strokeWidth={2}
              className="drop-shadow-lg"
            />
          );
        })()}
      </svg>
      {/* Center text */}
      <div className="absolute bottom-0 text-center">
        <div className="text-5xl font-bold tracking-tight" style={{ color }}>
          {aqi}
        </div>
        <div className="text-xs font-medium text-muted uppercase tracking-widest mt-0.5">
          {getLabel(aqi)}
        </div>
      </div>
    </div>
  );
}
