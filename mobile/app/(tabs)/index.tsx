import { useCallback, useState } from 'react';
import { Platform, RefreshControl, ScrollView, View } from 'react-native';
import { Skeleton, Text } from 'heroui-native';
import * as Haptics from 'expo-haptics';
import { useThemeColor } from 'heroui-native';
import { Lightbulb } from 'lucide-react-native';

import { AqiGauge } from '@/components/AqiGauge';
import { DeviceSelector } from '@/components/DeviceSelector';
import { EnvironmentCards } from '@/components/EnvironmentCards';
import { SectionCard } from '@/components/SectionCard';
import { StaleBadge } from '@/components/StaleBadge';
import { getGuidance } from '@/lib/aqi';
import { useDeviceStore } from '@/lib/deviceStore';
import { useEnvironment } from '@/lib/hooks';
import { timeAgo } from '@/lib/time';
import { useActiveContext } from '@/lib/useActiveContext';

export default function HomeScreen() {
  const ctx = useActiveContext();
  const { selectedDeviceId } = useDeviceStore();
  const env = useEnvironment(ctx.lat, ctx.lng);
  const [accent] = useThemeColor(['accent']);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRefreshing(true);
    ctx.refetch();
    void env.refetch();
    setTimeout(() => setRefreshing(false), 800);
  }, [ctx, env]);

  const guidance = getGuidance(ctx.aqi);
  const activeId = selectedDeviceId ?? ctx.device?.deviceId ?? null;
  const lastReadingTime = ctx.device?.latestReading?.timestamp;

  return (
    <ScrollView
      className="bg-background"
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />
      }
    >
      {ctx.isStale ? <StaleBadge cachedAt={ctx.cachedAt} /> : null}

      {ctx.isDemo ? (
        <View className="bg-accent/15 self-center rounded-full px-3 py-1">
          <Text className="text-bair-green text-xs font-semibold">
            Demo mode · live public sensor
          </Text>
        </View>
      ) : null}

      <DeviceSelector devices={ctx.devices} activeId={activeId} />

      {/* Gauge + mascot */}
      <SectionCard className="items-center">
        {ctx.loading ? (
          <Skeleton isLoading className="h-44 w-64 rounded-2xl">
            <View />
          </Skeleton>
        ) : (
          <>
            <AqiGauge aqi={ctx.aqi} />
            <Text className="text-muted mt-2 text-xs">
              {ctx.device?.name ?? 'Bair1 public sensor'}
              {lastReadingTime ? ` · updated ${timeAgo(lastReadingTime)}` : ''}
            </Text>
          </>
        )}
      </SectionCard>

      {/* Guidance */}
      <SectionCard title="What this means">
        {guidance.map((tip) => (
          <View key={tip} className="flex-row items-start gap-2">
            <Lightbulb size={16} color="#6EAA3C" style={{ marginTop: 2 }} />
            <Text className="text-foreground flex-1 text-sm leading-5">{tip}</Text>
          </View>
        ))}
      </SectionCard>

      {/* Environment */}
      <EnvironmentCards data={env.data} loading={env.isLoading} sensorAqi={ctx.aqi} />

      {ctx.lat && env.data?.address ? (
        <Text className="text-muted text-center text-xs">{env.data.address}</Text>
      ) : null}
    </ScrollView>
  );
}
