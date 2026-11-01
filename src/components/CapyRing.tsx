// Painted Capy inside a ring that fills with category colours as the day's spending adds up.
// Capy's pose follows how much of the budget is gone, cross-fading smoothly between paintings.
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { CAPY_ART, type CapyPose } from '../art';
import { CATEGORY_STYLE } from '../categories';
import type { Band } from '../stats';
import { colors, curves, fonts } from '../theme';
import { useReducedMotion } from '../useReducedMotion';
import { useTween } from '../useTween';
import type { Visitor } from '../visitors';
import { VisitorArt } from './VisitorArt';

export type Expression = 'calm' | 'alert' | 'concerned' | 'worried' | 'thoughtful' | 'happy' | 'sleepy';

/**
 * Picks Capy's mood from how much of the budget is spent. Once tucked in for the night Capy sleeps.
 * Going over budget makes Capy thoughtful, never upset: shame only makes people stop looking.
 */
export function expressionFor(ratio: number, tuckedIn: boolean): Expression {
  if (tuckedIn) return 'sleepy';
  if (ratio > 1) return 'thoughtful';
  if (ratio >= 0.9) return 'worried';
  if (ratio >= 0.7) return 'concerned';
  if (ratio >= 0.4) return 'alert';
  return 'calm';
}

export const EXPRESSION_WORDS: Record<Expression, string> = {
  calm: 'relaxed',
  alert: 'keeping an eye on things',
  concerned: 'a little concerned',
  worried: 'worried',
  thoughtful: 'thoughtful, tomorrow is a fresh start',
  happy: 'happy',
  sleepy: 'asleep',
};

// Which painting shows for each mood. Worried adds a sweat drop, sleepy adds z's.
const POSE: Record<Expression, CapyPose> = {
  calm: 'sitting',
  alert: 'sitting',
  concerned: 'thoughtful',
  worried: 'thoughtful',
  thoughtful: 'thoughtful',
  happy: 'happy',
  sleepy: 'sleepy',
};
const POSES: CapyPose[] = ['sitting', 'thoughtful', 'happy', 'sleepy'];

const S = 240;
const C = S / 2;
const RING_R = 108;
const RING_W = 14;
const INNER_R = 92;
const GAP_DEG = 7;
// Capy's painting as a share of the inner circle, and how far down it sits.
const ART = 0.8;
const ART_BOTTOM = 0.98;

const ease = Easing.bezier(...curves.out);

const point = (deg: number, r = RING_R) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return `${C + r * Math.cos(rad)} ${C + r * Math.sin(rad)}`;
};
const arc = (from: number, to: number) => `M ${point(from)} A ${RING_R} ${RING_R} 0 ${to - from > 180 ? 1 : 0} 1 ${point(to)}`;

type Props = {
  bands: Band[];
  /** The amount that fills the ring (the daily budget). */
  capacity: number;
  expression: Expression;
  size: number;
  /** Tonight's visitor sitting on Capy's head. */
  visitor?: Visitor;
};

export function CapyRing({ bands, capacity, expression, size, visitor }: Props) {
  const reduce = useReducedMotion();
  const total = bands.reduce((s, b) => s + b.amount, 0);
  const over = capacity > 0 && total > capacity;
  const fill = useTween({ p: capacity > 0 ? Math.min(1, total / capacity) : 0 }, 600).p;
  const pose = POSE[expression];
  const extras = useTween({ sweat: expression === 'worried' ? 1 : 0, zzz: expression === 'sleepy' ? 1 : 0 });

  // Each painting has its own opacity; changing mood cross-fades to the new one.
  const shown = useRef(Object.fromEntries(POSES.map((p) => [p, new Animated.Value(p === pose ? 1 : 0)])) as Record<CapyPose, Animated.Value>).current;
  useEffect(() => {
    Animated.parallel(
      POSES.map((p) => Animated.timing(shown[p], { toValue: p === pose ? 1 : 0, duration: reduce ? 0 : 420, easing: ease, useNativeDriver: true })),
    ).start();
  }, [pose, reduce]);

  // A tiny squash on every mood change reads as Capy reacting, not just swapping pictures.
  const pop = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduce) return;
    Animated.sequence([
      Animated.timing(pop, { toValue: 0.95, duration: 110, easing: ease, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, speed: 14, bounciness: 12, useNativeDriver: true }),
    ]).start();
  }, [expression]);

  // Capy breathes gently while awake or asleep.
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce]);

  // A visitor drops onto Capy's head, then bobs gently while it sits there.
  const arrive = useRef(new Animated.Value(visitor ? 1 : 0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const lastVisitor = useRef(visitor?.id);
  useEffect(() => {
    if (visitor && visitor.id !== lastVisitor.current) {
      arrive.setValue(reduce ? 1 : 0);
      if (!reduce) Animated.spring(arrive, { toValue: 1, speed: 9, bounciness: 14, useNativeDriver: true }).start();
    }
    lastVisitor.current = visitor?.id;
  }, [visitor?.id]);
  useEffect(() => {
    if (reduce || !visitor) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -3, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, visitor?.id]);

  // Ring segments, in the order the categories were first spent today.
  const sweep = fill * 360;
  const gaps = bands.length > 1 ? GAP_DEG : 0;
  const usable = Math.max(0, sweep - gaps * bands.length);
  let at = 0;
  const segments = bands.map((b) => {
    const len = total > 0 ? (b.amount / total) * usable : 0;
    const seg = { category: b.category, from: at + gaps / 2, to: at + gaps / 2 + len };
    at += len + gaps;
    return seg;
  });

  // Layout of the painting inside the inner circle, in points.
  const unit = size / S;
  const inner = INNER_R * 2 * unit;
  const innerTop = (C - INNER_R) * unit;
  const art = inner * ART;
  const artTop = inner * ART_BOTTOM - art;
  const headTop = innerTop + artTop + art * 0.06;
  const v = size * 0.27;

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ scale: pop }] }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${S} ${S}`} style={{ position: 'absolute' }}>
        {/* ring track, then the coloured spend segments */}
        <Circle cx={C} cy={C} r={RING_R} stroke={over ? '#F3CFC9' : colors.chip} strokeWidth={RING_W} fill="none" />
        {segments.map(
          (s) =>
            s.to - s.from > 0.5 && (
              <Path
                key={s.category}
                d={arc(s.from, Math.min(s.to, s.from + 359.9))}
                stroke={CATEGORY_STYLE[s.category].color}
                strokeWidth={RING_W}
                strokeLinecap="round"
                fill="none"
              />
            ),
        )}
        <Circle cx={C} cy={C} r={INNER_R} fill="#F7EDE1" />
      </Svg>

      {/* the painting, clipped to the inner circle */}
      <View
        style={{ position: 'absolute', left: innerTop, top: innerTop, width: inner, height: inner, borderRadius: inner / 2, overflow: 'hidden' }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            left: (inner - art) / 2,
            top: artTop,
            width: art,
            height: art,
            transform: [{ scaleY: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] }) }, { translateY: breathe.interpolate({ inputRange: [0, 1], outputRange: [0, -art * 0.006] }) }],
          }}
        >
          {POSES.map((p) => (
            <Animated.Image
              key={p}
              source={CAPY_ART[p]}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
              style={{ position: 'absolute', width: art, height: art, opacity: shown[p] }}
            />
          ))}
        </Animated.View>
      </View>

      {/* sweat drop and sleepy z's on top */}
      <Svg width="100%" height="100%" viewBox={`0 0 ${S} ${S}`} style={{ position: 'absolute' }} pointerEvents="none">
        <Path d="M 168 62 Q 176 76 168 82 Q 160 76 168 62 Z" fill="#8fd0f0" opacity={extras.sweat} transform={`translate(0 ${(1 - extras.sweat) * -6})`} />
        <G opacity={extras.zzz}>
          <SvgText x={178} y={104} fontSize={20} fontFamily={fonts.heavy} fill={colors.brown}>
            z
          </SvgText>
          <SvgText x={192} y={86} fontSize={14} fontFamily={fonts.heavy} fill={colors.brown}>
            z
          </SvgText>
        </G>
      </Svg>

      {visitor && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: (size - v) / 2,
            top: headTop - v * 0.9,
            width: v,
            height: v,
            opacity: arrive,
            transform: [
              { translateY: Animated.add(arrive.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.35, 0] }), bob) },
              { scale: arrive.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
            ],
          }}
          accessibilityElementsHidden
        >
          <VisitorArt visitor={visitor} size={v} />
        </Animated.View>
      )}
    </Animated.View>
  );
}
