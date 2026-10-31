// Pick a daily budget, the amount that fills Capy to the top.
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { formatINR } from '../parser';
import { colors } from '../theme';
import { BottomSheet, Pill, Text } from './ui';

const PRESETS = [500, 1000, 1500, 2000, 3000, 5000];

type Props = { current: number | null; onSave: (budget: number | null) => void; onClose: () => void };

export function BudgetSheet({ current, onSave, onClose }: Props) {
  const [value, setValue] = useState(current ? String(current) : '');
  const [error, setError] = useState('');

  function save(close: (after?: () => void) => void) {
    const n = Number(value);
    if (!n || n <= 0) return setError('Pick or type an amount, or choose No budget.');
    close(() => onSave(Math.round(n)));
  }

  return (
    <BottomSheet onClose={onClose}>
      {(close) => (
        <>
          <Text style={styles.title} accessibilityRole="header">
            Daily budget
          </Text>
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
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
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
            accessibilityLabel="Daily budget in rupees"
            style={styles.input}
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pill label="Save budget" onPress={() => save(close)} />
          <Pressable onPress={() => close(() => onSave(null))} style={styles.skip} accessibilityRole="button">
            <Text style={styles.skipText}>No budget</Text>
          </Pressable>
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  body: { fontSize: 15, color: colors.muted, marginTop: 4, marginBottom: 16, lineHeight: 21 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  preset: { width: '31%', height: 48, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  presetOn: { backgroundColor: colors.brown },
  presetText: { fontSize: 16, fontWeight: '700', color: colors.text },
  input: { height: 48, borderRadius: 16, backgroundColor: '#fff', paddingHorizontal: 14, fontSize: 16, color: colors.text, marginBottom: 12 },
  error: { color: '#B3473E', marginBottom: 8, fontSize: 14 },
  skip: { alignItems: 'center', paddingVertical: 14 },
  skipText: { fontSize: 15, fontWeight: '700', color: colors.muted },
});
