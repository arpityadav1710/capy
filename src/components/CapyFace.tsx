// Capy's face, drawn in code so each part can move on its own.
// It is a placeholder: the animations can later be swapped for AI-generated video loops.
import { useEffect, useId, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { colors } from '../theme';

export type CapyMood = 'calm' | 'thinking' | 'happy' | 'meh';

const MOODS: CapyMood[] = ['calm', 'thinking', 'happy', 'meh'];
const VIEWBOX = '0 0 440 240';
const EYE = { stroke: colors.ink, strokeWidth: 9, strokeLinecap: 'round' as const, fill: 'none' };

type Props = {
  mood: CapyMood;
  /** Voice loudness from 0 (silent) to 1 (loud). Makes the cheeks puff and nose bob. */
  level?: Animated.Value;
  width: number;
};

export function CapyFace({ mood, level, width }: Props) {
  const height = (width * 240) / 440;
  const fallbackLevel = useRef(new Animated.Value(0)).current;
  const voice = level ?? fallbackLevel;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  const eyeOpacity = useRef(
    Object.fromEntries(MOODS.map((m) => [m, new Animated.Value(m === mood ? 1 : 0)])) as Record<CapyMood, Animated.Value>,
  ).current;
  const look = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel(
      MOODS.map((m) =>
        Animated.timing(eyeOpacity[m], { toValue: m === mood ? 1 : 0, duration: 220, useNativeDriver: true }),
      ),
    ).start();

    if (mood === 'happy') {
      Animated.sequence([
        Animated.spring(pop, { toValue: 1.14, speed: 40, bounciness: 14, useNativeDriver: true }),
        Animated.spring(pop, { toValue: 1, speed: 14, bounciness: 12, useNativeDriver: true }),
      ]).start();
    } else if (mood === 'meh') {
      Animated.timing(pop, { toValue: 0.94, duration: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(pop, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [mood]);

  useEffect(() => {
    const glance = Animated.loop(
      Animated.sequence([
        Animated.timing(look, { toValue: 1, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(look, { toValue: -1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(look, { toValue: 0, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    const breath = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    glance.start();
    breath.start();
    return () => {
      glance.stop();
      breath.stop();
    };
  }, []);

  const scale = Animated.multiply(pop, breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] }));
  const cheekScale = voice.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22], extrapolate: 'clamp' });
  const noseLift = voice.interpolate({ inputRange: [0, 1], outputRange: [0, -(height * 0.03)], extrapolate: 'clamp' });
  const lookX = look.interpolate({ inputRange: [-1, 1], outputRange: [-width * 0.03, width * 0.03] });

  const layer = (children: React.ReactNode) => (
    <Svg width={width} height={height} viewBox={VIEWBOX} style={StyleSheet.absoluteFill}>
      {children}
    </Svg>
  );

  return (
    <Animated.View style={{ width, height, transform: [{ scale }] }}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: cheekScale }] }]}>
        {layer(
          <>
            <Defs>
              <RadialGradient id={`cheek${uid}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={colors.cheek} stopOpacity={0.95} />
                <Stop offset="0.55" stopColor={colors.cheek} stopOpacity={0.6} />
                <Stop offset="1" stopColor={colors.cheek} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={92} cy={152} r={60} fill={`url(#cheek${uid})`} />
            <Circle cx={348} cy={152} r={60} fill={`url(#cheek${uid})`} />
          </>,
        )}
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: eyeOpacity.calm }]}>
        {layer(
          <>
            <Path d="M95 78 Q128 80 160 92" {...EYE} />
            <Path d="M280 92 Q312 80 345 78" {...EYE} />
          </>,
        )}
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: eyeOpacity.thinking, transform: [{ translateX: lookX }] }]}>
        {layer(
          <>
            <Circle cx={128} cy={86} r={11} fill={colors.ink} />
            <Circle cx={312} cy={86} r={11} fill={colors.ink} />
          </>,
        )}
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: eyeOpacity.happy }]}>
        {layer(
          <>
            <Path d="M98 96 Q128 62 158 96" {...EYE} />
            <Path d="M282 96 Q312 62 342 96" {...EYE} />
          </>,
        )}
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: eyeOpacity.meh }]}>
        {layer(
          <>
            <Path d="M100 90 L158 90" {...EYE} />
            <Path d="M282 90 L340 90" {...EYE} />
          </>,
        )}
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: noseLift }] }]}>
        {layer(
          <>
            <Defs>
              <RadialGradient id={`nose${uid}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={colors.nose} stopOpacity={1} />
                <Stop offset="0.85" stopColor={colors.nose} stopOpacity={1} />
                <Stop offset="1" stopColor={colors.nose} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={220} cy={152} r={50} fill={`url(#nose${uid})`} />
            <Path
              d="M199 139 L220 156 L241 139 M220 156 L220 178"
              stroke="#3f281d"
              strokeWidth={7}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </>,
        )}
      </Animated.View>
    </Animated.View>
  );
}

/** A small round Capy for headers and buttons. */
export function CapyBadge({ size = 56 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.fur,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <CapyFace mood="calm" width={size * 0.95} />
    </View>
  );
}
