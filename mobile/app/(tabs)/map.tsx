import { useMemo, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Text } from 'heroui-native';
import * as Haptics from 'expo-haptics';
import { Crosshair, Radio } from 'lucide-react-native';

import MapView from '@/components/MapView';
import type { MapMarker, MapPolyline, MapRegion } from '@/components/MapView';
import { SegmentedControl } from '@/components/SegmentedControl';
import { aqiColor, aqiMarkerColor, getAqiLevel } from '@/lib/aqi';
import { MAP_RANGES, REFRESH_MAP_MS } from '@/lib/config';
import { useLocationTrail } from '@/lib/hooks';
import { timeAgo } from '@/lib/time';
import { useActiveContext } from '@/lib/useActiveContext';
import type { Device } from '@/lib/types';

function deviceCoords(d: Device): { lat: number; lng: number } | null {
  const lat = d.latestReading?.lat ?? d.lat;
  const lng = d.latestReading?.lng ?? d.lng;
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

export default function MapScreen() {
  const ctx = useActiveContext();
  const [rangeLabel, setRangeLabel] = useState<string>('6h');
  const [live, setLive] = useState(false);
  const [region, setRegion] = useState<MapRegion | null>(null);
  const [selected, setSelected] = useState<Device | null>(null);

  const hours = MAP_RANGES.find((r) => r.label === rangeLabel)?.hours ?? 6;
  const activeId = ctx.device?.deviceId ?? null;
  const trail = useLocationTrail(activeId, hours, live ? REFRESH_MAP_MS : undefined);

  const center = useMemo<MapRegion>(
    () => ({
      latitude: ctx.lat,
      longitude: ctx.lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }),
    [ctx.lat, ctx.lng],
  );

  const activeRegion = live ? center : (region ?? center);

  const markers = useMemo<MapMarker[]>(() => {
    const result: MapMarker[] = [];
    for (const d of ctx.devices) {
      const c = deviceCoords(d);
      if (!c) continue;
      const aqi = d.latestReading?.aqi ?? 0;
      result.push({
        id: d.deviceId,
        coordinate: { latitude: c.lat, longitude: c.lng },
        title: d.name,
        description: `AQI ${Math.round(aqi)} · ${getAqiLevel(aqi).label}`,
        color: aqiMarkerColor(aqi),
      });
    }
    return result;
  }, [ctx.devices]);

  const polylines = useMemo<MapPolyline[]>(() => {
    const pts = trail.data ?? [];
    if (pts.length < 2) return [];
    return [
      {
        id: 'trail',
        coordinates: pts.map((p) => ({ latitude: p.lat, longitude: p.lng })),
        strokeColor: '#6EAA3C',
        strokeWidth: 3,
      },
    ];
  }, [trail.data]);

  const handleCenter = () => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    setRegion(center);
  };

  const toggleLive = () => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLive((v) => !v);
  };

  return (
    <View className="bg-background flex-1">
      {/* Map fills the screen */}
      <MapView
        style={{ flex: 1 }}
        mapType="standard"
        region={activeRegion}
        onRegionChangeComplete={live ? undefined : setRegion}
        markers={markers}
        polylines={polylines}
        onMarkerPress={(m) => {
          const d = ctx.devices.find((x) => x.deviceId === m.id);
          setSelected(d ?? null);
          if (Platform.OS !== 'web') void Haptics.selectionAsync();
        }}
      />

      {/* Top controls: range picker */}
      <View className="absolute top-4 right-4 left-4 gap-2" pointerEvents="box-none">
        <View className="bg-surface/95 border-border rounded-full border p-1">
          <SegmentedControl
            options={MAP_RANGES.map((r) => ({ label: r.label }))}
            value={rangeLabel}
            onChange={setRangeLabel}
          />
        </View>
      </View>

      {/* Right-side action buttons */}
      <View className="absolute right-4 bottom-32 gap-3" pointerEvents="box-none">
        <Pressable
          onPress={toggleLive}
          className={`h-12 w-12 items-center justify-center rounded-full border ${
            live ? 'bg-accent border-accent' : 'bg-surface border-border'
          }`}
        >
          <Radio size={20} color={live ? '#191C18' : '#EFF0ED'} />
        </Pressable>
        <Pressable
          onPress={handleCenter}
          className="bg-surface border-border h-12 w-12 items-center justify-center rounded-full border"
        >
          <Crosshair size={20} color="#EFF0ED" />
        </Pressable>
      </View>

      {/* Live badge */}
      {live ? (
        <View className="bg-accent absolute top-20 left-4 flex-row items-center gap-1.5 rounded-full px-3 py-1">
          <View className="h-2 w-2 rounded-full bg-[#191C18]" />
          <Text className="text-xs font-bold text-[#191C18]">LIVE · follows device</Text>
        </View>
      ) : null}

      {/* Selected device popup */}
      {selected ? (
        <Pressable
          onPress={() => setSelected(null)}
          className="bg-surface border-border absolute right-4 bottom-28 left-4 rounded-2xl border p-4"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-foreground text-base font-semibold">{selected.name}</Text>
            <View
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: `${aqiColor(selected.latestReading?.aqi ?? 0)}33` }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: aqiColor(selected.latestReading?.aqi ?? 0) }}
              >
                AQI {Math.round(selected.latestReading?.aqi ?? 0)}
              </Text>
            </View>
          </View>
          <Text className="text-muted mt-1 text-xs">{selected.location || 'Location unknown'}</Text>
          {deviceCoords(selected) ? (
            <Text className="text-muted mt-0.5 text-xs">
              {deviceCoords(selected)!.lat.toFixed(4)}, {deviceCoords(selected)!.lng.toFixed(4)}
            </Text>
          ) : null}
          {selected.latestReading?.timestamp ? (
            <Text className="text-muted mt-0.5 text-xs">
              Updated {timeAgo(selected.latestReading.timestamp)}
            </Text>
          ) : null}
        </Pressable>
      ) : null}
    </View>
  );
}
