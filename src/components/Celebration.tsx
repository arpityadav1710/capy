// Day-complete celebration: confetti, a playful headline and happy Capy.
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CATEGORY_STYLE } from '../categories';
import { CATEGORIES, formatINR } from '../parser';
import { type Band, dayHeadline } from '../stats';
import { colors } from '../theme';
import { CapyBody } from './CapyBody';
import { Pill, Text } from './ui';

const { width: SW, height: SH } = Dimensions.get('window');
const PIECES = 46;
const CONFETTI = [...CATEGORIES.map((c) => CATEGORY_STYLE[c].color), colors.cheek];

type Props = { today: number; budget: number | null; bands: Band[]; streak: number; onClose: () => void };

export function Celebration({ today, budget, bands, streak, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const fall = useRef(new Animated.Value(0)).current;
  const pieces = useMemo(
    () =>
      [...Array(PIECES)].map((_, i) => ({
        x: Math.random() * SW,
        delay: Math.random() * 0.35,
        drift: (Math.random() - 0.5) * 80,
        spin: Math.random() * 720 - 360,
        w: 6 + Math.random() * 6,
        h: 10 + Math.random() * 8,
        color: CONFETTI[i % CONFETTI.length],
      })),
    [],
  );

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    Animated.timing(fall, { toValue: 1, duration: 3200, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, []);

  const over = budget != null && today > budget;
  let line = today === 0 ? 'Nothing spent today. Capy is proud of you.' : `${formatINR(today)} spent today`;
  if (today > 0 && budget) line += over ? ` · ${formatINR(today - budget)} over budget, but you tracked it all` : ` · ${Math.round((today / budget) * 100)}% of budget`;

  const close = () => Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true }).start(onClose);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.page, { opacity: fade, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.headline}>{dayHeadline(Date.now(), over)}</Text>
      <Text style={styles.line}>{line}</Text>
      <View style={styles.streak}>
        <Text style={styles.streakText}>{streak} day streak</Text>
      </View>

      <View style={styles.body}>
        <CapyBody bands={bands} capacity={budget ?? 1000} mood="happy" width={Math.min(SW * 0.7, 300)} />
      </View>

      <Pill label="See you tomorrow" onPress={close} style={{ alignSelf: 'center', paddingHorizontal: 34 }} />

      {pieces.map((p, i) => {
        const t = fall.interpolate({ inputRange: [0, p.delay, 1], outputRange: [0, 0, 1] });
        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: p.x,
              top: -30,
              width: p.w,
              height: p.h,
              borderRadius: 2,
              backgroundColor: p.color,
              transform: [
                { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, SH + 60] }) },
                { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
                { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
              ],
            }}
          />
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: '#FFFDF9', alignItems: 'stretch' },
  headline: { fontSize: 40, fontWeight: '800', color: colors.brown, textAlign: 'center', paddingHorizontal: 16, letterSpacing: -0.5 },
  line: { fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: 6, paddingHorizontal: 28, lineHeight: 21 },
  streak: { alignSelf: 'center', marginTop: 14, backgroundColor: colors.chip, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 },
  streakText: { fontSize: 14, fontWeight: '700', color: colors.chipText },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
