// Tucking Capy in for the night: a one-line story of your day, then tonight's visitor arrives.
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { formatINR } from '../parser';
import type { Band } from '../stats';
import { curves } from '../theme';
import type { Expense } from '../types';
import { useReducedMotion } from '../useReducedMotion';
import type { Visitor } from '../visitors';
import { CapyScene } from './CapyScene';
import { VisitorArt } from './VisitorArt';
import { Pill, Text } from './ui';

const { width: SW, height: SH } = Dimensions.get('window');
const easeOut = Easing.bezier(...curves.out);
const NIGHT = '#FFF6EC';
const NIGHT_MUTED = '#E9D6C6';
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// A few fixed stars so the sky looks the same every night.
const STARS = [...Array(18)].map((_, i) => ({ x: (i * 97) % 100, y: (i * 53) % 45, r: 0.8 + (i % 3) * 0.5 }));

type Props = {
  todayList: Expense[];
  today: number;
  budget: number | null;
  bands: Band[];
  streak: number;
  visitor: Visitor;
  isNew: boolean;
  found: number;
  total: number;
  chillEarned: boolean;
  nextRare: Visitor | null;
  onOpenAlbum: () => void;
  onClose: () => void;
};

/** "3 chais, 1 auto" from the day's notes. */
function storyOf(list: Expense[]): string {
  const counts = new Map<string, number>();
  for (const e of list) {
    const key = (e.note || e.category).toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const parts = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, n]) => (n > 1 ? `${n} ${name.endsWith('s') ? name : `${name}s`}` : name));
  const more = counts.size > 3 ? ` and ${counts.size - 3} more` : '';
  return parts.join(', ') + more;
}

export function BedtimeRitual(p: Props) {
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef([0, 1, 2, 3, 4, 5].map(() => new Animated.Value(0))).current;
  const [visitorShown, setVisitorShown] = useState(false);

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, easing: easeOut, useNativeDriver: true }).start();
    const step = (i: number) => Animated.timing(rise[i], { toValue: 1, duration: 480, easing: easeOut, useNativeDriver: true });
    Animated.stagger(90, [step(0), step(1), step(2)]).start();
    // The visitor arrives a beat after Capy settles, then the rest of the story follows.
    const t = setTimeout(() => {
      setVisitorShown(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.stagger(120, [step(3), step(4), step(5)]).start();
    }, reduce ? 300 : 1100);
    return () => clearTimeout(t);
  }, []);

  const enter = (i: number) =>
    reduce
      ? { opacity: rise[i] }
      : { opacity: rise[i], transform: [{ translateY: rise[i].interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] };

  const close = (after?: () => void) =>
    Animated.timing(fade, { toValue: 0, duration: 240, easing: easeOut, useNativeDriver: true }).start(() => {
      p.onClose();
      after?.();
    });

  const over = p.budget != null && p.today > p.budget;
  const story = p.todayList.length === 0 ? 'No spending today.' : `${storyOf(p.todayList)} · ${formatINR(p.today)}`;
  const verdict =
    p.todayList.length === 0
      ? 'A calm day. Capy loves those.'
      : over
        ? "Big day! Tomorrow's a fresh spring."
        : p.budget
          ? `Easy day. ${formatINR(p.budget - p.today)} left unspent.`
          : 'All logged. Sleep easy.';

  const daysToRare = p.nextRare?.rareAt ? p.nextRare.rareAt - p.streak : null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
      <Svg width={SW} height={SH} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#2B2546" />
            <Stop offset="0.55" stopColor="#5B4566" />
            <Stop offset="1" stopColor="#B77E6E" />
          </LinearGradient>
        </Defs>
        <Rect width={SW} height={SH} fill="url(#dusk)" />
        {STARS.map((s, i) => (
          <Circle key={i} cx={(s.x / 100) * SW} cy={(s.y / 100) * SH} r={s.r} fill="#fff" opacity={0.35 + (i % 4) * 0.15} />
        ))}
      </Svg>

      <View style={[styles.page, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
        <Animated.View style={enter(0)}>
          <Text style={styles.kicker}>{WEEKDAYS[new Date().getDay()]} night 🌙</Text>
          <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={1.3}>
            Goodnight, Capy
          </Text>
        </Animated.View>
        <Animated.View style={enter(1)}>
          <Text style={styles.story}>{story}</Text>
          <Text style={styles.verdict}>{verdict}</Text>
        </Animated.View>

        <Animated.View style={[styles.capy, enter(2)]} accessible accessibilityLabel={`Capy is asleep with ${p.visitor.name} on its head`}>
          <CapyScene pose="sleepy" size={Math.min(SW * 0.6, 250)} visitor={visitorShown ? p.visitor : undefined} />
        </Animated.View>

        <Animated.View style={[styles.card, styles.cardRow, enter(3)]} accessible>
          <VisitorArt visitor={p.visitor} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>
              {p.visitor.name} {p.isNew ? 'came to visit!' : 'is back to say hi'}
            </Text>
            <Text style={styles.cardBody}>{p.visitor.story}</Text>
            <Text style={styles.cardMeta}>
              {p.visitor.rareAt ? 'Rare friend · ' : p.isNew ? 'New friend · ' : ''}
              {p.found} of {p.total} friends found
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.chips, enter(4)]}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>🔥 {p.streak} day streak</Text>
          </View>
          {p.chillEarned && (
            <View style={[styles.chip, styles.chipGold]}>
              <Text style={styles.chipText}>🍊 You earned a Chill Day</Text>
            </View>
          )}
          {daysToRare != null && daysToRare > 0 && daysToRare <= 3 && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                ❔ Someone rare visits in {daysToRare} {daysToRare === 1 ? 'day' : 'days'}
              </Text>
            </View>
          )}
        </Animated.View>

        <Animated.View style={[styles.buttons, enter(5)]}>
          <Pill label="Goodnight, Capy" variant="light" textColor="#2B2546" onPress={() => close()} style={styles.primary} />
          <Pill label="See all friends" variant="light" textColor={NIGHT} onPress={() => close(p.onOpenAlbum)} style={styles.secondary} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 22 },
  kicker: { fontSize: 14, fontWeight: '800', color: NIGHT_MUTED, textAlign: 'center', letterSpacing: 0.4 },
  title: { fontSize: 34, fontWeight: '800', color: NIGHT, textAlign: 'center', marginTop: 4 },
  story: { fontSize: 17, fontWeight: '700', color: NIGHT, textAlign: 'center', marginTop: 12 },
  verdict: { fontSize: 15, color: NIGHT_MUTED, textAlign: 'center', marginTop: 4 },
  capy: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: 'rgba(255,246,236,0.12)', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: 'rgba(255,246,236,0.18)' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: NIGHT },
  cardBody: { fontSize: 15, color: NIGHT_MUTED, marginTop: 4, lineHeight: 20 },
  cardMeta: { fontSize: 13, fontWeight: '700', color: '#F3C98B', marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 14 },
  chip: { backgroundColor: 'rgba(255,246,236,0.14)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipGold: { backgroundColor: 'rgba(243,201,139,0.28)' },
  chipText: { fontSize: 14, fontWeight: '700', color: NIGHT },
  buttons: { gap: 10, marginTop: 16 },
  primary: { backgroundColor: '#FFF6EC', borderColor: '#FFF6EC' },
  secondary: { backgroundColor: 'transparent', borderColor: 'rgba(255,246,236,0.4)' },
});
