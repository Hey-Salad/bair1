import { ScrollView, View } from 'react-native';
import { Pressable } from 'react-native';
import { Text } from 'heroui-native';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { aqiColor } from '@/lib/aqi';
import { useDeviceStore } from '@/lib/deviceStore';
import type { Device } from '@/lib/types';

interface DeviceSelectorProps {
  devices: Device[];
  activeId: string | null;
}

export function DeviceSelector({ devices, activeId }: DeviceSelectorProps) {
  const selectDevice = useDeviceStore((s) => s.selectDevice);
  if (devices.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
    >
      {devices.map((d) => {
        const active = d.deviceId === activeId;
        const color = aqiColor(d.latestReading?.aqi ?? 0);
        return (
          <Pressable
            key={d.deviceId}
            onPress={() => {
              if (Platform.OS !== 'web') void Haptics.selectionAsync();
              selectDevice(d.deviceId);
            }}
            className={`flex-row items-center gap-2 rounded-full border px-3 py-2 ${
              active ? 'border-accent bg-accent/15' : 'border-border bg-surface'
            }`}
          >
            <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            <Text className={`text-sm ${active ? 'text-foreground font-semibold' : 'text-muted'}`}>
              {d.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
