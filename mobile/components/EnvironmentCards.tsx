import { View } from 'react-native';
import { Skeleton, Text } from 'heroui-native';
import { Droplets, Flower2, Gauge, Thermometer, Wind } from 'lucide-react-native';

import { SectionCard } from '@/components/SectionCard';
import type { EnvironmentData } from '@/lib/types';

interface EnvironmentCardsProps {
  data?: EnvironmentData;
  loading: boolean;
  sensorAqi: number;
}

export function EnvironmentCards({ data, loading, sensorAqi }: EnvironmentCardsProps) {
  if (loading && !data) {
    return (
      <View className="gap-3">
        <Skeleton isLoading className="h-28 w-full rounded-2xl">
          <View />
        </Skeleton>
        <Skeleton isLoading className="h-28 w-full rounded-2xl">
          <View />
        </Skeleton>
      </View>
    );
  }

  const googleIndex =
    data?.airQuality?.indexes?.find((i) => i.code === 'uaqi') ?? data?.airQuality?.indexes?.[0];
  const weather = data?.weather;
  const grassPollen = data?.pollen?.[0]?.pollenTypeInfo?.find((p) => p.code === 'GRASS');

  return (
    <View className="gap-3">
      {/* Google AQI comparison */}
      <SectionCard title="Compare sources">
        <View className="flex-row gap-3">
          <Stat
            icon={<Gauge size={18} color="#6EAA3C" />}
            label="Your sensor"
            value={String(Math.round(sensorAqi))}
            hint="US AQI"
          />
          <Stat
            icon={<Gauge size={18} color="#8A8D87" />}
            label="Google"
            value={googleIndex ? googleIndex.aqiDisplay : '—'}
            hint={googleIndex?.displayName ?? 'Universal AQI'}
          />
        </View>
        {googleIndex?.category ? (
          <Text className="text-muted text-xs">{googleIndex.category}</Text>
        ) : null}
      </SectionCard>

      {/* Weather */}
      <SectionCard title="Weather">
        <View className="flex-row flex-wrap gap-x-6 gap-y-3">
          <MiniStat
            icon={<Thermometer size={16} color="#8A8D87" />}
            label="Temp"
            value={weather?.temperature ? `${Math.round(weather.temperature.degrees)}°C` : '—'}
          />
          <MiniStat
            icon={<Droplets size={16} color="#8A8D87" />}
            label="Humidity"
            value={weather?.relativeHumidity != null ? `${weather.relativeHumidity}%` : '—'}
          />
          <MiniStat
            icon={<Wind size={16} color="#8A8D87" />}
            label="Wind"
            value={weather?.wind?.speed ? `${Math.round(weather.wind.speed.value)} km/h` : '—'}
          />
        </View>
        {weather?.weatherCondition?.description?.text ? (
          <Text className="text-muted text-xs">{weather.weatherCondition.description.text}</Text>
        ) : null}
      </SectionCard>

      {/* Pollen */}
      <SectionCard title="Pollen today">
        <View className="flex-row items-center gap-3">
          <Flower2 size={20} color="#6EAA3C" />
          <View className="flex-1">
            <Text className="text-foreground font-semibold">
              {grassPollen?.indexInfo?.category ?? 'No data'}
            </Text>
            <Text className="text-muted text-xs">
              {grassPollen
                ? `Grass pollen · UPI ${grassPollen.indexInfo?.value ?? '—'}`
                : 'Pollen index unavailable'}
            </Text>
          </View>
        </View>
      </SectionCard>
    </View>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <View className="bg-default flex-1 gap-1 rounded-xl p-3">
      <View className="flex-row items-center gap-1.5">
        {icon}
        <Text className="text-muted text-xs">{label}</Text>
      </View>
      <Text className="text-foreground text-2xl font-bold">{value}</Text>
      {hint ? <Text className="text-muted text-[10px]">{hint}</Text> : null}
    </View>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="gap-1">
      <View className="flex-row items-center gap-1.5">
        {icon}
        <Text className="text-muted text-xs">{label}</Text>
      </View>
      <Text className="text-foreground text-base font-semibold">{value}</Text>
    </View>
  );
}
