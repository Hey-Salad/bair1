import { useEffect } from 'react';
import { View } from 'react-native';
import { Text } from 'heroui-native';
import {
  createAnimatedComponent,
  useAnimatedProps,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { aqiColor, getAqiLevel } from '@/lib/aqi';

const AnimatedLine = createAnimatedComponent(Line);

const SIZE = 260;
const STROKE = 18;
const RADIUS = (SIZE - STROKE) / 2;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_AQI = 300; // gauge scale tops at 300 for readability

// Convert a polar angle (degrees, 180=left .. 0=right) to an arc path point.
function polar(angleDeg: number, r: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) };
}

// Semicircle background arc from 180deg to 0deg.
function arcPath(startDeg: number, endDeg: number, r: number) {
  const start = polar(startDeg, r);
  const end = polar(endDeg, r);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const sweep = endDeg < startDeg ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}

interface AqiGaugeProps {
  aqi: number;
}

export function AqiGauge({ aqi }: AqiGaugeProps) {
  const level = getAqiLevel(aqi);
  const color = aqiColor(aqi);
  const angle = useSharedValue(180); // start pointing left (0 AQI)

  useEffect(() => {
    const ratio = Math.max(0, Math.min(1, aqi / MAX_AQI));
    angle.value = withSpring(180 - ratio * 180, { damping: 14, stiffness: 90 });
  }, [aqi, angle]);

  const needleProps = useAnimatedProps(() => {
    const a = (angle.value * Math.PI) / 180;
    const len = RADIUS - 14;
    return {
      x2: CX + len * Math.cos(a),
      y2: CY - len * Math.sin(a),
    };
  });

  return (
    <View className="items-center">
      <Svg width={SIZE} height={SIZE / 2 + 30}>
        <Defs>
          <LinearGradient id="aqiTrack" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#8DC44A" />
            <Stop offset="0.33" stopColor="#F5C542" />
            <Stop offset="0.5" stopColor="#ED8B00" />
            <Stop offset="0.7" stopColor="#D63031" />
            <Stop offset="1" stopColor="#6C3483" />
          </LinearGradient>
        </Defs>
        {/* Track */}
        <Path
          d={arcPath(180, 0, RADIUS)}
          stroke="url(#aqiTrack)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          opacity={0.9}
        />
        <G>
          <AnimatedLine
            x1={CX}
            y1={CY}
            animatedProps={needleProps}
            stroke={color}
            strokeWidth={4}
            strokeLinecap="round"
          />
          <Circle cx={CX} cy={CY} r={10} fill={color} />
          <Circle cx={CX} cy={CY} r={4} fill="#191C18" />
        </G>
      </Svg>
      <View className="-mt-6 items-center">
        <Text className="text-foreground text-6xl font-bold">{Math.round(aqi)}</Text>
        <View className="mt-2 rounded-full px-3 py-1" style={{ backgroundColor: `${color}33` }}>
          <Text className="text-sm font-semibold" style={{ color }}>
            {level.label}
          </Text>
        </View>
        <Text className="text-muted mt-1 text-xs">US AQI</Text>
      </View>
    </View>
  );
}
