"use client";

import Image from "next/image";
import type { AqiState } from "@/lib/aqi";

interface BearOrbProps {
  aqiState: AqiState;
  aqi: number;
}

export default function BearOrb({ aqiState, aqi }: BearOrbProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Bear — the logo's built-in orb serves as the AQI indicator */}
      <div className="bear-breathe relative" aria-label={`Air quality: ${aqiState.level}`}>
        <Image
          src="/bear-logo.png"
          alt={`Bair1 bear — ${aqiState.level} air quality`}
          width={200}
          height={200}
          className="object-contain"
          priority
        />
      </div>

      {/* AQI number */}
      <div className="mt-5 text-center">
        <div className="text-6xl font-bold tracking-tight" style={{ color: aqiState.orbColor }}>
          {aqi}
        </div>
        <div className="text-sm font-medium text-forest-night/60 mt-1 uppercase tracking-widest">
          AQI
        </div>
      </div>

      {/* Level badge */}
      <div
        className="mt-3 px-4 py-1.5 rounded-full text-sm font-medium text-white"
        style={{ backgroundColor: aqiState.orbColor }}
      >
        {aqiState.level} ({aqiState.range})
      </div>
    </div>
  );
}
