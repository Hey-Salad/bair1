import { useMemo, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { Skeleton, Text } from 'heroui-native';

import { AreaChart, BarChart, ScatterChart } from '@/components/Charts';
import { SectionCard } from '@/components/SectionCard';
import { SegmentedControl } from '@/components/SegmentedControl';
import { AQI_LEVELS, getAqiLevel } from '@/lib/aqi';
import { ANALYTICS_RANGES } from '@/lib/config';
import { useTimeSeries } from '@/lib/hooks';
import { downsample } from '@/lib/time';
import { useActiveContext } from '@/lib/useActiveContext';

export default function AnalyticsScreen() {
  const ctx = useActiveContext();
  const { width } = useWindowDimensions();
  const [rangeLabel, setRangeLabel] = useState<string>('24h');
  const hours = ANALYTICS_RANGES.find((r) => r.label === rangeLabel)?.hours ?? 24;
  const activeId = ctx.device?.deviceId ?? null;
  const series = useTimeSeries(activeId, hours);

  const chartW = width - 32 - 32; // screen - page padding - card padding
  const points = useMemo(() => downsample(series.data ?? [], 120), [series.data]);
  const aqis = points.map((p) => p.aqi);

  const stats = useMemo(() => {
    if (aqis.length === 0) return null;
    const sum = aqis.reduce((a, b) => a + b, 0);
    return {
      count: series.data?.length ?? 0,
      avg: Math.round(sum / aqis.length),
      peak: Math.max(...aqis),
      low: Math.min(...aqis),
    };
  }, [aqis, series.data]);

  const distribution = useMemo(() => {
    const buckets = AQI_LEVELS.map((l) => ({ label: l.label, value: 0, color: l.color }));
    for (const a of aqis) {
      const level = getAqiLevel(a);
      const idx = AQI_LEVELS.findIndex((l) => l.label === level.label);
      if (idx >= 0) buckets[idx].value += 1;
    }
    return buckets;
  }, [aqis]);

  const scatter = useMemo(
    () =>
      points
        .filter((p): p is typeof p & { rssi: number } => p.rssi != null)
        .map((p) => ({ aqi: p.aqi, rssi: p.rssi })),
    [points],
  );

  if (!activeId) {
    return (
      <View className="bg-background flex-1 items-center justify-center p-8">
        <Text className="text-foreground text-center text-base font-semibold">
          No device connected
        </Text>
        <Text className="text-muted mt-2 text-center text-sm">
          Analytics needs a registered device with historical readings. Connect a Bair1 sensor to
          see trends here.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="bg-background"
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
    >
      <SegmentedControl
        options={ANALYTICS_RANGES.map((r) => ({ label: r.label }))}
        value={rangeLabel}
        onChange={setRangeLabel}
      />

      {/* Stats row */}
      <View className="flex-row gap-3">
        <StatBox
          label="Readings"
          value={stats ? String(stats.count) : '—'}
          loading={series.isLoading}
        />
        <StatBox
          label="Avg AQI"
          value={stats ? String(stats.avg) : '—'}
          loading={series.isLoading}
        />
        <StatBox label="Peak" value={stats ? String(stats.peak) : '—'} loading={series.isLoading} />
        <StatBox label="Low" value={stats ? String(stats.low) : '—'} loading={series.isLoading} />
      </View>

      <SectionCard title="AQI over time">
        {series.isLoading ? (
          <Skeleton isLoading className="h-44 w-full rounded-xl">
            <View />
          </Skeleton>
        ) : (
          <AreaChart values={aqis} width={chartW} height={180} />
        )}
      </SectionCard>

      <SectionCard title="AQI distribution">
        <BarChart data={distribution} width={chartW} height={160} />
        <View className="flex-row flex-wrap gap-x-4 gap-y-1">
          {distribution.map((d) => (
            <View key={d.label} className="flex-row items-center gap-1.5">
              <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <Text className="text-muted text-[11px]">{d.label}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Signal vs AQI">
        <ScatterChart points={scatter} width={chartW} height={160} />
        <Text className="text-muted text-xs">
          AQI (vertical) vs signal strength RSSI (horizontal, dBm)
        </Text>
      </SectionCard>
    </ScrollView>
  );
}

function StatBox({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <View className="bg-surface border-border flex-1 gap-1 rounded-xl border p-3">
      {loading ? (
        <Skeleton isLoading className="h-6 w-10 rounded-md">
          <View />
        </Skeleton>
      ) : (
        <Text className="text-foreground text-xl font-bold">{value}</Text>
      )}
      <Text className="text-muted text-[10px]">{label}</Text>
    </View>
  );
}
