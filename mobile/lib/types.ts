// ---------------------------------------------------------------------------
// Bair1 domain types — mirror the existing backend (DO NOT REBUILD)
// ---------------------------------------------------------------------------

export interface Reading {
  deviceId: string;
  timestamp: string; // ISO 8601
  aqi: number; // 0-500
  gasRaw: number | null;
  gasVoltage: number | null;
  airState: string | null; // "Good" | "Moderate" | "Poor" | "Bad"
  rssi: number | null; // negative dBm
  firmwareVersion: string | null;
  uptimeMs: number | null;
  sample: number | null;
  transport: string | null; // "sim800l" | "wifi"
  lat: number | null;
  lng: number | null;
}

export type DeviceStatus = 'active' | 'inactive' | 'provisioning';

export interface LatestReading {
  aqi: number;
  timestamp: string;
  lat: number | null;
  lng: number | null;
  gasVoltage: number | null;
  rssi: number | null;
}

export interface Device {
  deviceId: string;
  name: string;
  location: string;
  lat: number | null;
  lng: number | null;
  status: DeviceStatus;
  latestReading?: LatestReading | null;
}

export interface TimeSeriesPoint {
  timestamp: string;
  aqi: number;
  gasVoltage: number | null;
  rssi: number | null;
  lat: number | null;
  lng: number | null;
}

export interface TrailPoint {
  timestamp: string;
  lat: number;
  lng: number;
  aqi: number;
  accuracy: number | null;
}

// --- Environment (Google AQI / weather / pollen) --------------------------

export interface EnvironmentData {
  airQuality?: {
    indexes?: {
      code: string;
      displayName: string;
      aqi: number;
      aqiDisplay: string;
      category: string;
      dominantPollutant?: string;
    }[];
    pollutants?: {
      code: string;
      displayName: string;
      fullName: string;
      concentration: { value: number; units: string };
    }[];
    healthRecommendations?: Record<string, string>;
  };
  pollen?: {
    date: { year: number; month: number; day: number };
    pollenTypeInfo: {
      code: string;
      displayName: string;
      inSeason: boolean;
      indexInfo?: { value: number; category: string };
    }[];
  }[];
  weather?: {
    weatherCondition?: { description?: { text: string }; type?: string };
    temperature?: { degrees: number; unit: string };
    feelsLikeTemperature?: { degrees: number };
    relativeHumidity?: number;
    wind?: { speed?: { value: number; unit: string }; direction?: { cardinal: string } };
    uvIndex?: number;
    isDaytime?: boolean;
  };
  address?: string;
  timestamp?: string;
}

// --- Auth / admin ----------------------------------------------------------

export type Role = 'super_admin' | 'admin' | 'user';

export interface AdminMe {
  id?: string;
  email: string;
  name: string;
  role: Role;
  devices?: Device[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface VoiceBriefing {
  audio?: string; // base64
  text: string;
}
