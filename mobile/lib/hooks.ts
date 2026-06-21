import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import {
  fetchEnvironment,
  fetchLatestReadings,
  fetchLocationTrail,
  fetchRegisteredDevices,
  fetchTimeSeries,
} from '@/lib/api';
import { readCache, writeCache } from '@/lib/cache';
import { DEMO_LOCATION, REFRESH_HOME_MS } from '@/lib/config';
import { isoFrom, nowIso } from '@/lib/time';
import type { Device, EnvironmentData, Reading, TimeSeriesPoint, TrailPoint } from '@/lib/types';

// ---------------------------------------------------------------------------
// Devices (GraphQL) with offline cache fallback
// ---------------------------------------------------------------------------

export function useDevices() {
  const [cached, setCached] = useState<{ data: Device[]; cachedAt: string } | null>(null);

  useEffect(() => {
    void readCache<Device[]>('devices').then((c) => {
      if (c) setCached(c);
    });
  }, []);

  const query = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const devices = await fetchRegisteredDevices();
      void writeCache('devices', devices);
      return devices;
    },
    refetchInterval: REFRESH_HOME_MS,
  });

  const data = query.data ?? cached?.data ?? [];
  const isStale = !query.data && Boolean(cached);
  return { ...query, devices: data, isStale, cachedAt: cached?.cachedAt };
}

// ---------------------------------------------------------------------------
// Latest readings (REST) — used for demo mode / aggregate map
// ---------------------------------------------------------------------------

export function useLatestReadings() {
  return useQuery({
    queryKey: ['latestReadings'],
    queryFn: fetchLatestReadings,
    refetchInterval: REFRESH_HOME_MS,
  });
}

// ---------------------------------------------------------------------------
// Environment data for given coordinates
// ---------------------------------------------------------------------------

export function useEnvironment(lat: number | null, lng: number | null) {
  const la = lat ?? DEMO_LOCATION.lat;
  const ln = lng ?? DEMO_LOCATION.lng;
  return useQuery<EnvironmentData>({
    queryKey: ['environment', la.toFixed(3), ln.toFixed(3)],
    queryFn: () => fetchEnvironment(la, ln),
    refetchInterval: REFRESH_HOME_MS * 5,
  });
}

// ---------------------------------------------------------------------------
// Time series for charts
// ---------------------------------------------------------------------------

export function useTimeSeries(deviceId: string | null, hours: number) {
  return useQuery<TimeSeriesPoint[]>({
    queryKey: ['timeSeries', deviceId, hours],
    queryFn: () => fetchTimeSeries(deviceId!, isoFrom(hours), nowIso()),
    enabled: Boolean(deviceId),
  });
}

// ---------------------------------------------------------------------------
// Location trail for the map
// ---------------------------------------------------------------------------

export function useLocationTrail(deviceId: string | null, hours: number, refetchMs?: number) {
  return useQuery<TrailPoint[]>({
    queryKey: ['trail', deviceId, hours],
    queryFn: () => fetchLocationTrail(deviceId!, isoFrom(hours), nowIso()),
    enabled: Boolean(deviceId),
    refetchInterval: refetchMs,
  });
}

export type { Reading };
