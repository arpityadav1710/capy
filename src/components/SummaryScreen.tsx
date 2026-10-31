// Summary: big KPI circle, Days/Weeks/Months stacked bars by category, and a calendar of logged days.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { CATEGORY_STYLE } from '../categories';
import { formatINR } from '../parser';
import { chartColumns, dayKey, legendFor, type Range, startOfDay } from '../stats';
import type { Expense } from '../types';
import { colors } from '../theme';
import { Screen, Text } from './ui';

type Props = {
  expenses: Expense[];
  active: Set<string>;
  checkins: string[];
  today: number;
  monthTotal: number;
  budget: number | null;
  streak: number;
  onOpenDay: (day: number) => void;
  onClose: () => void;
};

const RANGES: { key: Range; label: string; title: string }[] = [
  { key: 'days', label: 'Days', title: 'Last 7 days' },
  { key: 'weeks', label: 'Weeks', title: 'Daily average · last 4 weeks' },
  { key: 'months', label: 'Months', title: 'Last 6 months' },
];

const short = (n: number) => (n >= 1000 ? `₹${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : formatINR(n));

export function SummaryScreen(p: Props) {
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<Range>('days');
  const cols = chartColumns(p.expenses, range);
  const legend = legendFor(cols);
  const max = Math.max(1, ...cols.map((c) => c.total));
  const meta = RANGES.find((r) => r.key === range)!;

  let kpiBig = formatINR(p.today);
  let kpiSmall = 'SPENT TODAY';
  let kpiFill = 0;
  if (range === 'days' && p.budget) {
    kpiBig = `${Math.round((p.today / p.budget) * 100)}%`;
    kpiSmall = "OF TODAY'S BUDGET";
    kpiFill = Math.min(1, p.today / p.budget);
  } else if (range === 'weeks') {
    kpiBig = String(p.streak);
    kpiSmall = 'DAY STREAK';
    kpiFill = Math.min(1, p.streak / 7);
  } else if (range === 'months') {
    kpiBig = short(p.monthTotal);
    kpiSmall = 'THIS MONTH';
    kpiFill = 1;
  }

  return (
    <Screen onClose={p.onClose}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 40 }}>
        <Kpi big={kpiBig} small={kpiSmall} fill={kpiFill} />

        <View style={styles.card}>
          <View style={styles.segment}>
            {RANGES.map((r) => (
              <Pressable key={r.key} onPress={() => setRange(r.key)} style={[styles.segItem, range === r.key && styles.segOn]}>
                <Text style={[styles.segText, range === r.key && { color: colors.text }]}>{r.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.cardTitle}>{meta.title}</Text>

          <View style={styles.chart}>
            {cols.map((c, i) => (
              <View key={i} style={styles.col}>
                <Text style={[styles.colTotal, c.total === 0 && { opacity: 0 }]}>{short(c.total)}</Text>
                <View style={[styles.stack, { height: Math.max(4, (c.total / max) * 150) }]}>
                  {c.total === 0 ? (
                    <View style={[styles.seg, { flex: 1, backgroundColor: colors.line }]} />
                  ) : (
                    [...c.bands].reverse().map((b) => (
                      <View key={b.category} style={[styles.seg, { flex: b.amount, backgroundColor: CATEGORY_STYLE[b.category].color }]} />
                    ))
                  )}
                </View>
                <Text style={[styles.colLabel, c.highlight && { color: colors.brown }]}>{c.label}</Text>
              </View>
            ))}
          </View>

          {legend.length > 0 ? (
            <View style={styles.legend}>
              {legend.map((l) => (
                <View key={l.category} style={[styles.legendChip, { backgroundColor: CATEGORY_STYLE[l.category].soft }]}>
                  <Text style={[styles.legendPct, { color: CATEGORY_STYLE[l.category].color }]}>{Math.round(l.share)}%</Text>
                  <Text style={styles.legendName}>{l.category}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>Nothing logged in this range yet.</Text>
          )}
        </View>

        <Calendar active={p.active} checkins={p.checkins} expenses={p.expenses} onOpenDay={p.onOpenDay} />
      </ScrollView>
    </Screen>
  );
}

function Kpi({ big, small, fill }: { big: string; small: string; fill: number }) {
  const r = 74;
  const c = 2 * Math.PI * r;
  return (
    <View style={styles.kpi}>
      <Svg width={170} height={170} style={StyleSheet.absoluteFill}>
        <Circle cx={85} cy={85} r={r} stroke={colors.chip} strokeWidth={9} fill="none" />
        <Circle
          cx={85}
          cy={85}
          r={r}
          stroke={colors.furDeep}
          strokeWidth={9}
          fill="none"
          strokeDasharray={`${c}`}
          strokeDashoffset={c * (1 - fill)}
          strokeLinecap="round"
          transform="rotate(-90 85 85)"
        />
        <Circle cx={85} cy={85} r={64} fill={colors.brown} />
      </Svg>
      <Text style={styles.kpiBig} numberOfLines={1} adjustsFontSizeToFit>
        {big}
      </Text>
      <Text style={styles.kpiSmall}>{small}</Text>
    </View>
  );
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function Calendar({
  active,
  checkins,
  expenses,
  onOpenDay,
}: {
  active: Set<string>;
  checkins: string[];
  expenses: Expense[];
  onOpenDay: (day: number) => void;
}) {
  const now = new Date();
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const first = month.getDay();
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const spentDays = new Set(expenses.map((e) => dayKey(e.createdAt)));
  const todayKey = dayKey(Date.now());
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <View style={{ marginTop: 26 }}>
      <View style={styles.calHead}>
        <Pressable onPress={() => shift(-1)} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.calTitle}>
          {MONTHS[month.getMonth()]} {month.getFullYear() !== now.getFullYear() ? month.getFullYear() : ''}
        </Text>
        <Pressable onPress={() => shift(1)} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-right" size={26} color={colors.text} />
        </Pressable>
      </View>
      <View style={styles.calGrid}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Text key={i} style={styles.calWeekday}>
            {d}
          </Text>
        ))}
        {cells.map((d, i) => {
          if (d == null) return <View key={i} style={styles.calCell} />;
          const t = startOfDay(new Date(month.getFullYear(), month.getMonth(), d).getTime());
          const key = dayKey(t);
          const future = t > Date.now();
          const spent = spentDays.has(key);
          const noSpend = !spent && checkins.includes(key);
          return (
            <Pressable key={i} style={styles.calCell} disabled={future} onPress={() => onOpenDay(t)}>
              <View style={[styles.calDay, key === todayKey && styles.calToday]}>
                <Text style={[styles.calNum, future && { color: colors.line }, key === todayKey && { color: '#fff' }]}>{d}</Text>
              </View>
              <View style={[styles.dot, spent && { backgroundColor: colors.furDeep }, noSpend && styles.dotRing, !active.has(key) && { opacity: 0 }]} />
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.calHint}>Filled dot: you logged spending · Ring: checked in with nothing spent</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kpi: { width: 170, height: 170, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  kpiBig: { color: '#fff', fontSize: 34, fontWeight: '800', maxWidth: 116 },
  kpiSmall: { color: '#F3E2CC', fontSize: 10, fontWeight: '800', letterSpacing: 0.6, textAlign: 'center', maxWidth: 110 },
  card: { backgroundColor: colors.cream, borderRadius: 26, padding: 16 },
  segment: { flexDirection: 'row', backgroundColor: colors.chip, borderRadius: 16, padding: 4 },
  segItem: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  segOn: { backgroundColor: '#fff' },
  segText: { fontSize: 15, fontWeight: '700', color: colors.muted },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center', marginTop: 16 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 210, marginTop: 10 },
  col: { alignItems: 'center', flex: 1 },
  colTotal: { fontSize: 11, fontWeight: '800', color: colors.brown, marginBottom: 4 },
  stack: { width: 30, borderRadius: 8, overflow: 'hidden', gap: 2 },
  seg: { width: '100%', borderRadius: 4 },
  colLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, marginTop: 6 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.line },
  legendChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 14, paddingHorizontal: 10, height: 28 },
  legendPct: { fontSize: 12, fontWeight: '800' },
  legendName: { fontSize: 13, fontWeight: '600', color: colors.text },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 14, fontSize: 14 },
  calHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  calTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  calWeekday: { width: '14.28%', textAlign: 'center', fontSize: 12, fontWeight: '800', color: colors.furDeep, marginBottom: 8 },
  calCell: { width: '14.28%', alignItems: 'center', marginBottom: 8 },
  calDay: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  calToday: { backgroundColor: colors.brown },
  calNum: { fontSize: 15, fontWeight: '600', color: colors.text },
  dot: { width: 7, height: 7, borderRadius: 4, marginTop: 2 },
  dotRing: { borderWidth: 1.5, borderColor: colors.furDeep },
  calHint: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 6 },
});
