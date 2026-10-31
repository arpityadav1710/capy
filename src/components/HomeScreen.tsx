// Capy's home: today's spend, Capy filling with colour, quick-add bar and the daily check-in.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { CATEGORY_STYLE } from '../categories';
import { CATEGORIES, type Category, formatINR } from '../parser';
import { type Band } from '../stats';
import { colors } from '../theme';
import { type BodyMood, CapyBody } from './CapyBody';
import { Pill, PressableScale, RoundButton, Text } from './ui';

type Props = {
  today: number;
  bands: Band[];
  budget: number | null;
  streak: number;
  /** Logged or checked in today. */
  activeToday: boolean;
  checkedInToday: boolean;
  onTalk: () => void;
  onQuickAdd: (c: Category) => void;
  onCheckIn: () => void;
  onOpenSummary: () => void;
  onOpenToday: () => void;
  onEditBudget: () => void;
};

export function HomeScreen(p: Props) {
  const insets = useSafeAreaInsets();
  const [bodyBox, setBodyBox] = useState({ w: 0, h: 0 });

  const ratio = p.budget ? p.today / p.budget : 0;
  const mood: BodyMood = p.checkedInToday ? 'happy' : ratio >= 0.9 ? 'worried' : 'calm';
  const bodyWidth = Math.min(bodyBox.w * 0.78, (bodyBox.h * 300) / 340);

  let subline = 'Tap to set a daily budget';
  if (p.budget) {
    subline =
      p.today > p.budget
        ? `${formatINR(p.today - p.budget)} over your ${formatINR(p.budget)} budget`
        : `${Math.round(ratio * 100)}% of your ${formatINR(p.budget)} budget`;
  }

  const capyLabel =
    p.bands.length === 0
      ? 'Capy is empty. Nothing spent yet today.'
      : `Capy is filled with today's spending: ${p.bands.map((b) => `${CATEGORY_STYLE[b.category].label} ${formatINR(b.amount)}`).join(', ')}.`;

  return (
    <View style={[styles.page, { paddingTop: insets.top + 6 }]}>
      <View style={styles.topRow}>
        <StreakBadge streak={p.streak} done={p.activeToday} onPress={p.onOpenSummary} />
        <RoundButton icon="chart-bar" onPress={p.onOpenSummary} label="Open summary" />
      </View>

      <Pressable
        onPress={p.onOpenToday}
        style={styles.hero}
        accessibilityRole="button"
        accessibilityLabel={`Spent today ${formatINR(p.today)}`}
        accessibilityHint="Shows today's expenses"
      >
        <Text style={styles.big} maxFontSizeMultiplier={1.3}>
          {formatINR(p.today)}
        </Text>
      </Pressable>
      <Pressable onPress={p.onEditBudget} hitSlop={8} accessibilityRole="button" accessibilityHint="Sets your daily budget">
        <Text maxFontSizeMultiplier={1.6} style={[styles.sub, !!p.budget && p.today > p.budget && { color: '#B3473E' }]}>
          Spent today · {subline}
        </Text>
      </Pressable>

      <View style={styles.bodyArea} onLayout={(e) => setBodyBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {bodyWidth > 0 && (
          <View accessible accessibilityRole="image" accessibilityLabel={capyLabel}>
            <CapyBody bands={p.bands} capacity={p.budget ?? 1000} mood={mood} width={bodyWidth} />
          </View>
        )}
      </View>

      <Pill label="Tell Capy" icon="microphone" onPress={p.onTalk} style={styles.talk} />

      <View style={styles.bar}>
        {CATEGORIES.map((c) => (
          <QuickAdd key={c} category={c} onPress={() => p.onQuickAdd(c)} />
        ))}
      </View>

      <PressableScale
        onPress={p.checkedInToday ? undefined : p.onCheckIn}
        scaleTo={p.checkedInToday ? 1 : 0.98}
        accessibilityRole="button"
        accessibilityState={{ disabled: p.checkedInToday }}
        style={[styles.checkin, { paddingBottom: insets.bottom + 14 }]}
      >
        <View style={styles.checkIcon}>
          <MaterialCommunityIcons name={p.checkedInToday ? 'check' : 'weather-night'} size={18} color={colors.brown} />
        </View>
        <Text style={styles.checkText}>
          {p.checkedInToday ? 'Checked in for today · see you tomorrow' : p.today > 0 ? "That's everything for today" : 'Nothing spent today'}
        </Text>
        {!p.checkedInToday && <MaterialCommunityIcons name="chevron-right" size={22} color={colors.brown} />}
      </PressableScale>
    </View>
  );
}

function StreakBadge({ streak, done, onPress }: { streak: number; done: boolean; onPress: () => void }) {
  const r = 21;
  const c = 2 * Math.PI * r;
  return (
    <PressableScale onPress={onPress} scaleTo={0.92} accessibilityRole="button" accessibilityLabel={`${streak} day streak`} accessibilityHint="Opens your summary" hitSlop={6}>
      <Svg width={52} height={52}>
        <Circle cx={26} cy={26} r={r} stroke={colors.chip} strokeWidth={5} fill="none" />
        <Circle
          cx={26}
          cy={26}
          r={r}
          stroke={colors.furDeep}
          strokeWidth={5}
          fill="none"
          strokeDasharray={`${c}`}
          strokeDashoffset={done ? 0 : c * 0.75}
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
        />
        <Circle cx={26} cy={26} r={16} fill={colors.brown} />
      </Svg>
      <Text style={styles.streakNum} maxFontSizeMultiplier={1}>
        {streak}
      </Text>
    </PressableScale>
  );
}

function QuickAdd({ category, onPress }: { category: Category; onPress: () => void }) {
  const s = CATEGORY_STYLE[category];
  return (
    <PressableScale onPress={onPress} scaleTo={0.92} style={styles.qa} accessibilityRole="button" accessibilityLabel={`Add ${s.label} expense`}>
      <View style={[styles.qaCircle, { backgroundColor: s.soft }]}>
        <MaterialCommunityIcons name={s.icon} size={24} color={s.ink} />
        <View style={[styles.qaPlus, { backgroundColor: s.ink }]}>
          <MaterialCommunityIcons name="plus" size={11} color="#fff" />
        </View>
      </View>
      <Text style={styles.qaLabel} numberOfLines={1} maxFontSizeMultiplier={1.2}>
        {s.label.toUpperCase()}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFDF9' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18 },
  hero: { alignItems: 'center', marginTop: 4 },
  big: { fontSize: 50, fontWeight: '800', color: colors.brown, letterSpacing: -1 },
  sub: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 2, paddingHorizontal: 20 },
  bodyArea: { flex: 1, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  talk: { alignSelf: 'center', paddingHorizontal: 30, marginBottom: 16 },
  bar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, marginBottom: 14 },
  qa: { alignItems: 'center', width: '16.6%' },
  qaCircle: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  qaPlus: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFDF9',
  },
  qaLabel: { fontSize: 11, fontWeight: '800', color: colors.muted, marginTop: 6, letterSpacing: 0.3 },
  checkin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F6E9DA',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  checkIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  checkText: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.brown },
  streakNum: { position: 'absolute', width: 52, top: 15, textAlign: 'center', color: '#fff', fontWeight: '800', fontSize: 15 },
});
