// Capy sitting, filling up with a coloured band per category as the day's spending adds up.
import { useEffect, useId, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { CATEGORY_STYLE } from '../categories';
import type { Band } from '../stats';
import { colors } from '../theme';

export type BodyMood = 'calm' | 'happy' | 'worried';

const W = 300;
const H = 340;
const TOP = 48; // highest point of the ears
const BOTTOM = 336;

type Props = {
  bands: Band[];
  /** Amount that fills Capy to the top (the daily budget). */
  capacity: number;
  mood: BodyMood;
  width: number;
};

function Silhouette() {
  return (
    <>
      <Ellipse cx={86} cy={64} rx={18} ry={15} />
      <Ellipse cx={214} cy={64} rx={18} ry={15} />
      <Rect x={58} y={56} width={184} height={150} rx={74} />
      <Rect x={34} y={150} width={232} height={176} rx={96} />
      <Ellipse cx={102} cy={324} rx={34} ry={13} />
      <Ellipse cx={198} cy={324} rx={34} ry={13} />
    </>
  );
}

export function CapyBody({ bands, capacity, mood, width }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const pop = useRef(new Animated.Value(1)).current;
  const total = bands.reduce((s, b) => s + b.amount, 0);

  useEffect(() => {
    if (total === 0) return;
    Animated.sequence([
      Animated.spring(pop, { toValue: 1.06, speed: 40, bounciness: 12, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, speed: 14, bounciness: 10, useNativeDriver: true }),
    ]).start();
  }, [total]);

  useEffect(() => {
    if (mood !== 'happy') return;
    Animated.sequence([
      Animated.spring(pop, { toValue: 1.12, speed: 40, bounciness: 16, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, speed: 12, bounciness: 12, useNativeDriver: true }),
    ]).start();
  }, [mood]);

  // Stack the bands from the bottom; together they fill up to `total / capacity` of Capy's height.
  const fillHeight = (BOTTOM - TOP) * Math.min(1, capacity > 0 ? total / capacity : 0);
  let y = BOTTOM;
  const rects = bands.map((b) => {
    const h = total > 0 ? (b.amount / total) * fillHeight : 0;
    y -= h;
    return { ...b, y, h };
  });

  const eye = { stroke: colors.ink, strokeWidth: 6.5, strokeLinecap: 'round' as const, fill: 'none' };

  return (
    <Animated.View style={{ width, height: (width * H) / W, transform: [{ scale: pop }] }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <ClipPath id={`body${uid}`}>
            <Silhouette />
          </ClipPath>
          <RadialGradient id={`cheek${uid}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.cheek} stopOpacity={0.9} />
            <Stop offset="1" stopColor={colors.cheek} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <G clipPath={`url(#body${uid})`}>
          <Rect x={0} y={0} width={W} height={H} fill={colors.silhouette} />
          {rects.map((r) => (
            <Rect key={r.category} x={0} y={r.y} width={W} height={r.h + 0.5} fill={CATEGORY_STYLE[r.category].color} />
          ))}
          {rects.slice(1).map((r) => (
            <Rect key={`gap-${r.category}`} x={0} y={r.y + r.h - 1.5} width={W} height={3} fill="#ffffff" opacity={0.55} />
          ))}
        </G>

        <Circle cx={86} cy={146} r={26} fill={`url(#cheek${uid})`} />
        <Circle cx={214} cy={146} r={26} fill={`url(#cheek${uid})`} />

        {mood === 'calm' && (
          <>
            <Path d="M92 112 Q108 113 124 120" {...eye} />
            <Path d="M176 120 Q192 113 208 112" {...eye} />
          </>
        )}
        {mood === 'happy' && (
          <>
            <Path d="M94 122 Q108 102 122 122" {...eye} />
            <Path d="M178 122 Q192 102 206 122" {...eye} />
          </>
        )}
        {mood === 'worried' && (
          <>
            <Path d="M94 112 L122 118" {...eye} />
            <Path d="M178 118 L206 112" {...eye} />
            <Path d="M236 86 Q244 100 236 106 Q228 100 236 86 Z" fill="#7cc4e8" />
          </>
        )}

        <Circle cx={150} cy={146} r={22} fill={colors.nose} />
        <Path
          d="M140 139 L150 147 L160 139 M150 147 L150 158"
          stroke="#3f281d"
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}
