// One day's expenses: delete mistakes safely, or add one you forgot.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CATEGORY_STYLE } from '../categories';
import { formatINR } from '../parser';
import { dayKey, expensesOn, startOfDay, sum } from '../stats';
import type { Expense } from '../types';
import { colors } from '../theme';
import { ConfirmDialog, Pill, Screen, Text } from './ui';

type Props = {
  day: number;
  expenses: Expense[];
  checkins: string[];
  budget: number | null;
  onDelete: (id: number) => void;
  onAddMissed: (day: number) => void;
  onClose: () => void;
};

const time = (t: number) => new Date(t).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

export function DayDetail({ day, expenses, checkins, budget, onDelete, onAddMissed, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [pending, setPending] = useState<Expense | null>(null);
  const list = expensesOn(expenses, day).sort((a, b) => a.createdAt - b.createdAt);
  const total = sum(list);
  const isToday = startOfDay(Date.now()) === startOfDay(day);
  const title = isToday
    ? 'Today'
    : new Date(day).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <Screen onClose={onClose}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.total}>{formatINR(total)}</Text>
          <View style={styles.badges}>
            {budget != null && <Badge text={`${Math.round((total / budget) * 100)}% of ${formatINR(budget)} budget`} />}
            {checkins.includes(dayKey(day)) && <Badge text="Checked in" icon="check" />}
            <Badge text={`${list.length} ${list.length === 1 ? 'expense' : 'expenses'}`} />
          </View>

          {list.length === 0 ? (
            <Text style={styles.empty}>Nothing logged on this day.</Text>
          ) : (
            <View style={styles.card}>
              {list.map((e, i) => {
                const s = CATEGORY_STYLE[e.category];
                return (
                  <View key={e.id} style={[styles.row, i > 0 && styles.rowBorder]} accessible={false}>
                    <View style={[styles.icon, { backgroundColor: s.soft }]}>
                      <MaterialCommunityIcons name={s.icon} size={20} color={s.ink} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name} numberOfLines={1}>
                        {e.note || e.category}
                      </Text>
                      <Text style={styles.meta}>
                        {CATEGORY_STYLE[e.category].label} · {time(e.createdAt)}
                      </Text>
                    </View>
                    <Text style={styles.amount}>{formatINR(e.amount)}</Text>
                    <Pressable onPress={() => setPending(e)} hitSlop={8} style={styles.minus} accessibilityRole="button" accessibilityLabel={`Delete ${e.note || e.category}, ${formatINR(e.amount)}`}>
                      <MaterialCommunityIcons name="minus" size={16} color={colors.muted} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
        <View style={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 16 }}>
          <Pill label="Add a missed expense" icon="plus" onPress={() => onAddMissed(day)} />
        </View>
      </View>

      <ConfirmDialog
        visible={pending != null}
        title="Delete this expense?"
        body={pending ? `${formatINR(pending.amount)} · ${pending.note || pending.category}. This can't be undone.` : ''}
        confirmLabel="Delete"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) onDelete(pending.id);
          setPending(null);
        }}
      />
    </Screen>
  );
}

function Badge({ text, icon }: { text: string; icon?: 'check' }) {
  return (
    <View style={styles.badge}>
      {icon && <MaterialCommunityIcons name={icon} size={14} color={colors.chipText} />}
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 17, fontWeight: '700', color: colors.muted, textAlign: 'center' },
  total: { fontSize: 46, fontWeight: '800', color: colors.brown, textAlign: 'center', letterSpacing: -1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 6, marginBottom: 20 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.chip, borderRadius: 14, paddingHorizontal: 10, height: 28 },
  badgeText: { fontSize: 13, fontWeight: '600', color: colors.chipText },
  empty: { textAlign: 'center', color: colors.muted, fontSize: 15, marginTop: 30 },
  card: { backgroundColor: colors.cream, borderRadius: 24, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '800', color: colors.text },
  minus: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
});
