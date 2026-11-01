// Painted Capy with tonight's visitor dropping onto its head. Rare visitors arrive with a golden glow.
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { CAPY_ART, type CapyPose } from '../art';
import { useReducedMotion } from '../useReducedMotion';
import type { Visitor } from '../visitors';
import { VisitorArt } from './VisitorArt';

type Props = { pose: CapyPose; size: number; visitor?: Visitor };

// Where Capy's head is in the painted art, as a share of the picture's size.
const HEAD_TOP = 0.1;
const VISITOR = 0.36;
const SPARKLES = [
  { x: 0.08, y: 0.2, s: 1 },
  { x: 0.86, y: 0.12, s: 0.8 },
  { x: 0.78, y: 0.72, s: 0.65 },
  { x: 0.16, y: 0.78, s: 0.7 },
];

export function CapyScene({ pose, size, visitor }: Props) {
  const reduce = useReducedMotion();
  const drop = useRef(new Animated.Value(visitor ? 1 : 0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(new Animated.Value(0)).current;
  const last = useRef(visitor?.id);

  useEffect(() => {
    if (visitor && visitor.id !== last.current) {
      drop.setValue(reduce ? 1 : 0);
      if (!reduce) Animated.spring(drop, { toValue: 1, speed: 8, bounciness: 13, useNativeDriver: true }).start();
    }
    last.current = visitor?.id;
  }, [visitor?.id]);

  useEffect(() => {
    if (reduce || !visitor) return;
    const loops = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(bob, { toValue: -4, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(bob, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(twinkle, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(twinkle, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [reduce, visitor?.id]);

  const v = size * VISITOR;
  const rare = !!visitor?.rareAt;

  return (
    <View style={{ width: size, height: size + v * 0.75 }}>
      <Image
        source={CAPY_ART[pose]}
        style={{ position: 'absolute', bottom: 0, width: size, height: size }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      {visitor && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: (size - v) / 2,
            top: v * 0.75 + size * HEAD_TOP - v * 0.9,
            width: v,
            height: v,
            opacity: drop.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
            transform: [
              { translateY: Animated.add(drop.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.45, 0] }), bob) },
              { scale: drop.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
            ],
          }}
        >
          {rare && (
            <Animated.View style={{ position: 'absolute', left: -v * 0.35, top: -v * 0.35, opacity: reduce ? 0.9 : twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) }}>
              <Svg width={v * 1.7} height={v * 1.7}>
                <Defs>
                  <RadialGradient id="rareGlow" cx="50%" cy="55%" r="50%">
                    <Stop offset="0" stopColor="#FFE7A3" stopOpacity={0.95} />
                    <Stop offset="0.6" stopColor="#FFD36E" stopOpacity={0.35} />
                    <Stop offset="1" stopColor="#FFD36E" stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Circle cx={v * 0.85} cy={v * 0.9} r={v * 0.85} fill="url(#rareGlow)" />
                {SPARKLES.map((s, i) => {
                  const r = v * 0.09 * s.s;
                  const x = v * 1.7 * s.x;
                  const y = v * 1.7 * s.y;
                  return <Path key={i} d={`M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z`} fill="#FFF3C4" />;
                })}
              </Svg>
            </Animated.View>
          )}
          <VisitorArt visitor={visitor} size={v} />
        </Animated.View>
      )}
    </View>
  );
}
