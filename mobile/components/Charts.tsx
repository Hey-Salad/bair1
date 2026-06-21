import { View } from 'react-native';
import { Text } from 'heroui-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { aqiColor } from '@/lib/aqi';

const PADDING = { top: 12, right: 12, bottom: 22, left: 30 };

interface AreaChartProps {
  values: number[];
  width: number;
  height: number;
  color?: string;
}

// AQI area/line chart.
export function AreaChart({ values, width, height, color = '#6EAA3C' }: AreaChartProps) {
  if (values.length < 2) return <EmptyChart height={height} />;
  const innerW = width - PADDING.left - PADDING.right;
  const innerH = height - PADDING.top - PADDING.bottom;
  const max = Math.max(...values, 50);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const x = (i: number) => PADDING.left + (i / (values.length - 1)) * innerW;
  const y = (v: number) => PADDING.top + innerH - ((v - min) / range) * innerH;

  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
  const area = `${line} L ${x(values.length - 1)} ${PADDING.top + innerH} L ${x(0)} ${
    PADDING.top + innerH
  } Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.35} />
          <Stop offset="1" stopColor={color} stopOpacity={0.02} />
        </LinearGradient>
      </Defs>
      {[0, 0.5, 1].map((t) => (
        <Line
          key={t}
          x1={PADDING.left}
          x2={width - PADDING.right}
          y1={PADDING.top + innerH * t}
          y2={PADDING.top + innerH * t}
          stroke="#2E3429"
          strokeWidth={1}
        />
      ))}
      <Path d={area} fill="url(#areaFill)" />
      <Path d={line} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

interface BarDatum {
  label: string;
  value: number;
  color: string;
}

export function BarChart({
  data,
  width,
  height,
}: {
  data: BarDatum[];
  width: number;
  height: number;
}) {
  if (data.length === 0) return <EmptyChart height={height} />;
  const innerW = width - PADDING.left - PADDING.right;
  const innerH = height - PADDING.top - PADDING.bottom;
  const max = Math.max(...data.map((d) => d.value), 1);
  const slot = innerW / data.length;
  const barW = slot * 0.6;

  return (
    <Svg width={width} height={height}>
      {data.map((d, i) => {
        const h = (d.value / max) * innerH;
        const bx = PADDING.left + i * slot + (slot - barW) / 2;
        const by = PADDING.top + innerH - h;
        return (
          <Rect
            key={d.label}
            x={bx}
            y={by}
            width={barW}
            height={Math.max(h, 1)}
            rx={3}
            fill={d.color}
          />
        );
      })}
      <Line
        x1={PADDING.left}
        x2={width - PADDING.right}
        y1={PADDING.top + innerH}
        y2={PADDING.top + innerH}
        stroke="#2E3429"
      />
    </Svg>
  );
}

interface ScatterPoint {
  aqi: number;
  rssi: number;
}

// AQI (y) vs RSSI (x) scatter. RSSI is negative dBm (e.g. -113..-50).
export function ScatterChart({
  points,
  width,
  height,
}: {
  points: ScatterPoint[];
  width: number;
  height: number;
}) {
  if (points.length === 0) return <EmptyChart height={height} />;
  const innerW = width - PADDING.left - PADDING.right;
  const innerH = height - PADDING.top - PADDING.bottom;
  const rssis = points.map((p) => p.rssi);
  const minR = Math.min(...rssis, -113);
  const maxR = Math.max(...rssis, -50);
  const rRange = maxR - minR || 1;
  const maxA = Math.max(...points.map((p) => p.aqi), 50);

  const x = (r: number) => PADDING.left + ((r - minR) / rRange) * innerW;
  const y = (a: number) => PADDING.top + innerH - (a / maxA) * innerH;

  return (
    <Svg width={width} height={height}>
      {[0, 0.5, 1].map((t) => (
        <Line
          key={t}
          x1={PADDING.left}
          x2={width - PADDING.right}
          y1={PADDING.top + innerH * t}
          y2={PADDING.top + innerH * t}
          stroke="#2E3429"
        />
      ))}
      {points.map((p, i) => (
        // eslint-disable-next-line react/no-array-index-key -- scatter points have no natural id
        <Circle
          key={`scatter-${p.rssi}-${p.aqi}-${String(i)}`}
          cx={x(p.rssi)}
          cy={y(p.aqi)}
          r={3}
          fill={aqiColor(p.aqi)}
          opacity={0.8}
        />
      ))}
    </Svg>
  );
}

function EmptyChart({ height }: { height: number }) {
  return (
    <View style={{ height }} className="items-center justify-center">
      <Text className="text-muted text-sm">Not enough data yet</Text>
    </View>
  );
}
