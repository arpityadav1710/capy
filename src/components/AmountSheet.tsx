// Bottom sheet for typing an expense: pick a category, tap the amount, optional note and time.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CATEGORY_STYLE } from '../categories';
import { CATEGORIES, type Category, formatINR } from '../parser';
import { startOfDay } from '../stats';
import type { NewExpense } from '../types';
import { colors } from '../theme';
import { Pill, Text } from './ui';

type Props = {
  category: Category;
  /** When set, the expense is added to this past day and a time picker is shown. */
  day?: number;
  onSave: (e: NewExpense) => void;
  onClose: () => void;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫'];

export function AmountSheet({ category: initial, day, onSave, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<Category>(initial);
  const [digits, setDigits] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const now = new Date();
  const [hour, setHour] = useState(day ? 13 : now.getHours());
  const [minute, setMinute] = useState(day ? 0 : now.getMinutes() - (now.getMinutes() % 5));

  const amount = Number(digits || '0');

  function press(k: string) {
    setError('');
    if (k === '⌫') return setDigits((d) => d.slice(0, -1));
    setDigits((d) => (d.length >= 7 ? d : (d + k).replace(/^0+/, '')));
  }

  function save() {
    if (amount <= 0) return setError('Enter an amount first.');
    const at = day ? startOfDay(day) + (hour * 60 + minute) * 60 * 1000 : undefined;
    onSave({ amount, category, note: note.trim(), spoken: '', createdAt: at });
  }

  const hh = String(hour % 12 || 12);
  const mm = String(minute).padStart(2, '0');

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grabber} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIES.map((c) => {
            const s = CATEGORY_STYLE[c];
            const on = c === category;
            return (
              <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, { backgroundColor: on ? s.color : s.soft }]}>
                <MaterialCommunityIcons name={s.icon} size={16} color={on ? '#fff' : s.color} />
                <Text style={[styles.chipText, { color: on ? '#fff' : colors.text }]}>{c}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.amount}>{formatINR(amount)}</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="What was it? (optional)"
          placeholderTextColor={colors.muted}
          style={styles.note}
          returnKeyType="done"
        />

        {day != null && (
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Time</Text>
            <Stepper label={hh} onMinus={() => setHour((h) => (h + 23) % 24)} onPlus={() => setHour((h) => (h + 1) % 24)} />
            <Text style={styles.timeLabel}>:</Text>
            <Stepper label={mm} onMinus={() => setMinute((m) => (m + 55) % 60)} onPlus={() => setMinute((m) => (m + 5) % 60)} />
            <Pressable onPress={() => setHour((h) => (h + 12) % 24)} style={styles.ampm}>
              <Text style={styles.ampmText}>{hour < 12 ? 'AM' : 'PM'}</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.pad}>
          {KEYS.map((k) => (
            <Pressable key={k} onPress={() => press(k)} style={({ pressed }) => [styles.key, pressed && { backgroundColor: colors.chip }]}>
              <Text style={styles.keyText}>{k}</Text>
            </Pressable>
          ))}
        </View>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Pill label={`Save ${category}${amount > 0 ? ` · ${formatINR(amount)}` : ''}`} icon="plus" onPress={save} />
      </View>
    </Modal>
  );
}

function Stepper({ label, onMinus, onPlus }: { label: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onMinus} hitSlop={6} style={styles.stepBtn}>
        <MaterialCommunityIcons name="minus" size={16} color={colors.text} />
      </Pressable>
      <Text style={styles.stepText}>{label}</Text>
      <Pressable onPress={onPlus} hitSlop={6} style={styles.stepBtn}>
        <MaterialCommunityIcons name="plus" size={16} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(40,25,15,0.35)' },
  sheet: { backgroundColor: colors.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10 },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line, marginBottom: 12 },
  chips: { gap: 8, paddingBottom: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 18, paddingHorizontal: 12, height: 36 },
  chipText: { fontSize: 14, fontWeight: '600' },
  amount: { fontSize: 46, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 14 },
  note: {
    marginTop: 6,
    marginBottom: 6,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginVertical: 6 },
  timeLabel: { fontSize: 15, color: colors.muted, fontWeight: '600' },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, height: 40, paddingHorizontal: 4 },
  stepBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  stepText: { minWidth: 26, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text },
  ampm: { backgroundColor: colors.chip, borderRadius: 12, paddingHorizontal: 12, height: 36, justifyContent: 'center' },
  ampmText: { fontWeight: '700', color: colors.chipText },
  pad: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 6 },
  key: { width: '33.33%', height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  keyText: { fontSize: 24, fontWeight: '600', color: colors.text },
  error: { color: '#B3473E', textAlign: 'center', marginBottom: 6, fontSize: 14 },
});
