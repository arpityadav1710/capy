// Pick a daily budget, the amount that fills Capy to the top.
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatINR } from '../parser';
import { colors } from '../theme';
import { Pill, Text } from './ui';

const PRESETS = [500, 1000, 1500, 2000, 3000, 5000];

type Props = { current: number | null; onSave: (budget: number | null) => void; onClose: () => void };

export function BudgetSheet({ current, onSave, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(current ? String(current) : '');
  const [error, setError] = useState('');

  function save() {
    const n = Number(value);
    if (!n || n <= 0) return setError('Pick or type an amount, or choose No budget.');
    onSave(Math.round(n));
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.title}>Daily budget</Text>
        <Text style={styles.body}>Capy fills up as you spend. When Capy is full, you've used today's budget.</Text>
        <View style={styles.grid}>
          {PRESETS.map((p) => {
            const on = Number(value) === p;
            return (
              <Pressable
                key={p}
                onPress={() => {
                  setValue(String(p));
                  setError('');
                }}
                style={[styles.preset, on && styles.presetOn]}
              >
                <Text style={[styles.presetText, on && { color: '#fff' }]}>{formatINR(p)}</Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          value={value}
          onChangeText={(t) => {
            setValue(t.replace(/[^0-9]/g, ''));
            setError('');
          }}
          keyboardType="number-pad"
          placeholder="Or type your own amount"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Pill label="Save budget" onPress={save} />
        <Pressable onPress={() => onSave(null)} style={styles.skip}>
          <Text style={styles.skipText}>No budget</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(40,25,15,0.35)' },
  sheet: { backgroundColor: colors.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  body: { fontSize: 15, color: colors.muted, marginTop: 4, marginBottom: 16, lineHeight: 21 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  preset: { width: '31%', height: 48, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  presetOn: { backgroundColor: colors.brown },
  presetText: { fontSize: 16, fontWeight: '700', color: colors.text },
  input: { height: 48, borderRadius: 16, backgroundColor: '#fff', paddingHorizontal: 14, fontSize: 16, color: colors.text, marginBottom: 12 },
  error: { color: '#B3473E', marginBottom: 8, fontSize: 14 },
  skip: { alignItems: 'center', paddingVertical: 14 },
  skipText: { fontSize: 15, fontWeight: '600', color: colors.muted },
});
