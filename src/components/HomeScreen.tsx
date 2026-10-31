// Capy's home: today's spend, streak, this week by category, and recent expenses.
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { deleteExpense, type Expense, getOverview } from '../db';
import { formatINR } from '../parser';
import { colors } from '../theme';
import { CapyBadge } from './CapyFace';

type Props = { expenses: Expense[]; onTalk: () => void; onChanged: () => void };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function when(t: number) {
  const d = new Date(t);
  const today = new Date();
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  if (d.toDateString() === today.toDateString()) return time;
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${time}`;
}

export function HomeScreen({ expenses, onTalk, onChanged }: Props) {
  const insets = useSafeAreaInsets();
  const o = getOverview(expenses);
  const maxCat = Math.max(1, ...o.weekByCategory.map((c) => c.total));

  function confirmDelete(e: Expense) {
    Alert.alert('Delete this expense?', `${formatINR(e.amount)} · ${e.note || e.category}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteExpense(e.id);
          onChanged();
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.page }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40, paddingHorizontal: 18 }}
    >
      <View style={styles.header}>
        <CapyBadge size={52} />
        <View>
          <Text style={styles.muted}>{greeting()}</Text>
          <Text style={styles.title}>Capy</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.muted}>Spent today</Text>
        <Text style={styles.big}>{formatINR(o.today)}</Text>
        <Text style={styles.muted}>
          {o.streak > 0 ? `${o.streak} day streak · ` : ''}
          {formatINR(o.week)} this week
        </Text>
      </View>

      <Pressable onPress={onTalk} style={({ pressed }) => [styles.talk, pressed && { opacity: 0.85 }]}>
        <Text style={styles.talkText}>Tell Capy an expense</Text>
      </Pressable>

      {o.weekByCategory.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.section}>This week</Text>
          {o.weekByCategory.map((c) => (
            <View key={c.category} style={{ marginTop: 10 }}>
              <View style={styles.rowBetween}>
                <Text style={styles.body}>{c.category}</Text>
                <Text style={styles.body}>{formatINR(c.total)}</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { width: `${(c.total / maxCat) * 100}%` }]} />
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.section}>Recent</Text>
        {expenses.length === 0 ? (
          <Text style={[styles.muted, { marginTop: 8, lineHeight: 20 }]}>
            Double-tap the back of your phone, or tap the button above, and tell Capy what you spent. Like "chai with
            Rohit 40".
          </Text>
        ) : (
          expenses.slice(0, 30).map((e, i) => (
            <Pressable
              key={e.id}
              onLongPress={() => confirmDelete(e)}
              style={[styles.rowBetween, styles.item, i === 0 && { borderTopWidth: 0 }]}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.body} numberOfLines={1}>
                  {e.note || e.category}
                </Text>
                <Text style={styles.small}>
                  {e.category} · {when(e.createdAt)}
                </Text>
              </View>
              <Text style={styles.amount}>{formatINR(e.amount)}</Text>
            </Pressable>
          ))
        )}
        {expenses.length > 0 && <Text style={[styles.small, { marginTop: 10 }]}>Press and hold an expense to delete it.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  title: { fontSize: 22, fontWeight: '600', color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  small: { fontSize: 12, color: colors.muted, marginTop: 2 },
  body: { fontSize: 15, color: colors.text },
  big: { fontSize: 38, fontWeight: '600', color: colors.text, marginVertical: 2 },
  section: { fontSize: 16, fontWeight: '600', color: colors.text },
  amount: { fontSize: 15, fontWeight: '600', color: colors.text },
  card: { backgroundColor: colors.cream, borderRadius: 22, padding: 18, marginBottom: 14 },
  talk: {
    backgroundColor: colors.brown,
    borderRadius: 20,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  talkText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  item: { paddingVertical: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.chip, marginTop: 6, overflow: 'hidden' },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.furDeep },
});
