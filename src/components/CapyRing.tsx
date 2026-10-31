// Capy's round face inside a ring that fills with category colours as the day's spending adds up.
// The face changes expression with how much of the budget is gone, morphing smoothly between them.
import { useEffect, useId, useRef, useState } from 'react';
import { Animated } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { CATEGORY_STYLE } from '../categories';
import type { Band } from '../stats';
import { colors } from '../theme';
import { useReducedMotion } from '../useReducedMotion';
import { useTween } from '../useTween';

export type Expression = 'calm' | 'alert' | 'concerned' | 'worried' | 'crying' | 'happy';

/** Picks Capy's face from how much of the budget is spent (and whether you've checked in). */
export function expressionFor(ratio: number, checkedIn: boolean): Expression {
  if (checkedIn && ratio <= 1) return 'happy';
  if (ratio > 1) return 'crying';
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
  crying: 'in tears',
  happy: 'happy',
};

// Every expression is the same handful of numbers, so any face can morph into any other.
// open: eyes 0 closed .. 1 open · arc: closed-eye curve (-1 droopy .. 1 ^ happy) · size: eye size
// brow: worry tilt · browOn: brows shown · smile: -1 frown .. 1 smile · mouth: 0 closed .. 1 wide open
// blush, sweat, tears: 0 .. 1
type Face = { open: number; arc: number; size: number; brow: number; browOn: number; smile: number; mouth: number; blush: number; sweat: number; tears: number };

const FACES: Record<Expression, Face> = {
  calm: { open: 0, arc: -0.3, size: 1, brow: 0, browOn: 0, smile: 0.35, mouth: 0, blush: 0.85, sweat: 0, tears: 0 },
  alert: { open: 0.85, arc: 0, size: 1, brow: 0, browOn: 0, smile: 0.25, mouth: 0, blush: 0.7, sweat: 0, tears: 0 },
  concerned: { open: 0.95, arc: 0, size: 1, brow: 0.55, browOn: 1, smile: -0.35, mouth: 0.12, blush: 0.45, sweat: 0, tears: 0 },
  worried: { open: 1, arc: 0, size: 1.12, brow: 1, browOn: 1, smile: -0.6, mouth: 0.35, blush: 0.3, sweat: 1, tears: 0 },
  crying: { open: 0, arc: 0.55, size: 1, brow: 1, browOn: 1, smile: -0.2, mouth: 0.9, blush: 0.6, sweat: 0, tears: 1 },
  happy: { open: 0, arc: 1, size: 1, brow: 0, browOn: 0, smile: 1, mouth: 0.55, blush: 1, sweat: 0, tears: 0 },
};

const S = 240;
const C = S / 2;
const RING_R = 108;
const RING_W = 14;
const FACE_R = 90;
const GAP_DEG = 7;

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
};

export function CapyRing({ bands, capacity, expression, size }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const reduce = useReducedMotion();
  const face = useTween(FACES[expression]);
  const total = bands.reduce((s, b) => s + b.amount, 0);
  const over = capacity > 0 && total > capacity;
  const fill = useTween({ p: capacity > 0 ? Math.min(1, total / capacity) : 0 }, 600).p;

  // A tiny squash on every expression change reads as Capy reacting, not just swapping faces.
  const pop = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduce) return;
    Animated.sequence([
      Animated.timing(pop, { toValue: 0.94, duration: 110, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, speed: 14, bounciness: 12, useNativeDriver: true }),
    ]).start();
  }, [expression]);

  // Blink now and then while the eyes are open.
  const [blink, setBlink] = useState(1);
  useEffect(() => {
    if (reduce) return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setBlink(0.08);
        t = setTimeout(() => {
          setBlink(1);
          loop();
        }, 130);
      }, 2800 + Math.random() * 2600);
    };
    loop();
    return () => clearTimeout(t);
  }, [reduce]);

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

  const open = face.open * blink;
  const eyeRy = 9 * face.size * open;
  const ink = colors.ink;

  const eye = (x: number, mirror: 1 | -1) => (
    <G key={x}>
      {/* closed eye: a curve that fades out as the eye opens */}
      <Path
        d={`M ${x - 13} ${100} Q ${x} ${100 - face.arc * 12} ${x + 13} ${100}`}
        stroke={ink}
        strokeWidth={5.5}
        strokeLinecap="round"
        fill="none"
        opacity={Math.max(0, 1 - open * 2.2)}
      />
      {/* open eye */}
      <Ellipse cx={x} cy={100} rx={7 * face.size} ry={Math.max(0.01, eyeRy)} fill={ink} opacity={Math.min(1, open * 2.2)} />
      <Circle cx={x + 2.5 * face.size} cy={96 - 2 * face.size} r={2.4 * face.size} fill="#fff" opacity={Math.max(0, open * 2 - 1)} />
      {/* brow: the inner end lifts as Capy worries */}
      <Path
        d={`M ${x - 12 * mirror} ${80 + face.brow * 3} L ${x + 12 * mirror} ${80 - face.brow * 7}`}
        stroke={ink}
        strokeWidth={4.5}
        strokeLinecap="round"
        opacity={face.browOn}
      />
      {/* tear stream */}
      <Rect x={x - 5} y={104} width={10} height={44 * face.tears} rx={5} fill="#8fd0f0" opacity={face.tears * 0.9} />
    </G>
  );

  const mouthY = 158;
  return (
    <Animated.View style={{ width: size, height: size, transform: [{ scale: pop }] }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${S} ${S}`}>
        <Defs>
          <RadialGradient id={`fur${uid}`} cx="50%" cy="46%" r="54%">
            <Stop offset="0" stopColor="#c4976f" />
            <Stop offset="0.7" stopColor="#d4ac86" />
            <Stop offset="1" stopColor="#e3c4a2" />
          </RadialGradient>
          <RadialGradient id={`cheek${uid}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.cheek} stopOpacity={0.95} />
            <Stop offset="1" stopColor={colors.cheek} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`nose${uid}`} cx="50%" cy="45%" r="55%">
            <Stop offset="0" stopColor="#8f5d3d" />
            <Stop offset="0.85" stopColor="#7d4f33" />
            <Stop offset="1" stopColor="#7d4f33" stopOpacity={0} />
          </RadialGradient>
        </Defs>

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

        {/* face */}
        <Circle cx={C} cy={C} r={FACE_R} fill={`url(#fur${uid})`} />
        <Circle cx={74} cy={128} r={22} fill={`url(#cheek${uid})`} opacity={face.blush} />
        <Circle cx={166} cy={128} r={22} fill={`url(#cheek${uid})`} opacity={face.blush} />
        {eye(84, 1)}
        {eye(156, -1)}

        {/* mouth: a smile line that opens into a pink mouth */}
        <Path
          d={`M ${108} ${mouthY - 4} Q ${C} ${mouthY - 4 + face.smile * 9} ${132} ${mouthY - 4}`}
          stroke="#5a3a28"
          strokeWidth={3.5}
          strokeLinecap="round"
          fill="none"
          opacity={Math.max(0, 1 - face.mouth * 3)}
        />
        <Ellipse
          cx={C}
          cy={mouthY + 2}
          rx={8 + face.mouth * 6}
          ry={Math.max(0.01, face.mouth * 11)}
          fill="#e48a83"
          stroke="#5a3a28"
          strokeWidth={3}
          opacity={Math.min(1, face.mouth * 3)}
        />

        {/* nose with the capybara Y */}
        <Ellipse cx={C} cy={134} rx={22} ry={19} fill={`url(#nose${uid})`} />
        <Path d="M 111 129 L 120 136 L 129 129 M 120 136 L 120 145" stroke="#3f281d" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* sweat drop */}
        <Path
          d="M 186 66 Q 194 80 186 86 Q 178 80 186 66 Z"
          fill="#8fd0f0"
          opacity={face.sweat}
          transform={`translate(0 ${(1 - face.sweat) * -6})`}
        />
      </Svg>
    </Animated.View>
  );
}
