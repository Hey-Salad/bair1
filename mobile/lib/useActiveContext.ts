import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { DEMO_LOCATION } from '@/lib/config';
import { useDeviceStore } from '@/lib/deviceStore';
import { useDevices, useLatestReadings } from '@/lib/hooks';
import type { Device } from '@/lib/types';

interface ActiveContext {
  devices: Device[];
  device: Device | null;
  /** True when no real device is connected and we are showing demo data. */
  isDemo: boolean;
  loading: boolean;
  isStale: boolean;
  cachedAt?: string;
  /** Resolved AQI for the active device (or demo). */
  aqi: number;
  /** Coordinates: device reading -> phone GPS -> demo location. */
  lat: number;
  lng: number;
  refetch: () => void;
}

// Lazily attempt to read device GPS without blocking render.
function useGps() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (Platform.OS === 'web') return () => {};
    let cancelled = false;
    void (async () => {
      try {
        const Location = await import('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED || cancelled) return;
        const pos = await Location.getCurrentPositionAsync({});
        if (!cancelled) setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        // ignore — fall back to demo location
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return coords;
}

export function useActiveContext(): ActiveContext {
  const { selectedDeviceId } = useDeviceStore();
  const devicesQuery = useDevices();
  const readingsQuery = useLatestReadings();
  const gps = useGps();

  const devices = devicesQuery.devices;
  const device = useMemo(() => {
    if (devices.length === 0) return null;
    return devices.find((d) => d.deviceId === selectedDeviceId) ?? devices[0];
  }, [devices, selectedDeviceId]);

  const latestFromRest = readingsQuery.data?.[0];

  const isDemo = devices.length === 0;
  const aqi = device?.latestReading?.aqi ?? latestFromRest?.aqi ?? 0;

  const lat =
    device?.latestReading?.lat ??
    device?.lat ??
    latestFromRest?.lat ??
    gps?.lat ??
    DEMO_LOCATION.lat;
  const lng =
    device?.latestReading?.lng ??
    device?.lng ??
    latestFromRest?.lng ??
    gps?.lng ??
    DEMO_LOCATION.lng;

  return {
    devices,
    device,
    isDemo,
    loading: devicesQuery.isLoading && readingsQuery.isLoading,
    isStale: devicesQuery.isStale,
    cachedAt: devicesQuery.cachedAt,
    aqi,
    lat,
    lng,
    refetch: () => {
      void devicesQuery.refetch();
      void readingsQuery.refetch();
    },
  };
}
