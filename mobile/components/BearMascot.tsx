import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import type { AqiLevel } from '@/lib/aqi';
import { getAqiLevel } from '@/lib/aqi';

interface BearMascotProps {
  aqi: number;
  size?: number;
}

// Mouth path varies with mood: happy -> smile, danger -> frown.
function mouthPath(mood: AqiLevel['mood']): string {
  switch (mood) {
    case 'happy':
      return 'M40 66 Q50 76 60 66';
    case 'neutral':
      return 'M42 70 L58 70';
    case 'wary':
      return 'M42 72 Q50 66 58 72';
    case 'unwell':
      return 'M42 74 Q50 66 58 74';
    case 'sick':
      return 'M42 74 Q50 64 58 74';
    default:
      return 'M40 74 Q50 62 60 74';
  }
}

export function BearMascot({ aqi, size = 120 }: BearMascotProps) {
  const level = getAqiLevel(aqi);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Subtle 4s breathing pulse.
    scale.value = withRepeat(
      withTiming(1.04, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const fur = '#7A5C3E';
  const furDark = '#5C4630';
  const showSweat = level.mood === 'unwell' || level.mood === 'sick' || level.mood === 'danger';

  return (
    <Animated.View style={animatedStyle}>
      <View>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Ears */}
          <Circle cx={24} cy={26} r={14} fill={fur} />
          <Circle cx={76} cy={26} r={14} fill={fur} />
          <Circle cx={24} cy={26} r={7} fill={furDark} />
          <Circle cx={76} cy={26} r={7} fill={furDark} />
          {/* Head */}
          <Circle cx={50} cy={52} r={34} fill={fur} />
          {/* Snout */}
          <Ellipse cx={50} cy={62} rx={16} ry={12} fill="#E7D6BE" />
          {/* Eyes */}
          {level.mood === 'happy' ? (
            <>
              <Path
                d="M34 46 Q40 42 46 46"
                stroke="#2A2118"
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d="M54 46 Q60 42 66 46"
                stroke="#2A2118"
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
              />
            </>
          ) : (
            <>
              <Circle cx={40} cy={46} r={4} fill="#2A2118" />
              <Circle cx={60} cy={46} r={4} fill="#2A2118" />
            </>
          )}
          {/* Nose */}
          <Ellipse cx={50} cy={56} rx={5} ry={3.5} fill="#2A2118" />
          {/* Mouth */}
          <Path
            d={mouthPath(level.mood)}
            stroke="#2A2118"
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
          />
          {/* Sweat drop for poor air */}
          {showSweat ? <Path d="M78 40 q4 8 0 12 q-4 -4 0 -12" fill="#5AB6E8" /> : null}
        </Svg>
      </View>
    </Animated.View>
  );
}
