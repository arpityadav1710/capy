// Explains reminders before iPhone's permission popup, so the "Allow" makes sense.
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme';
import { CapyFace } from './CapyFace';
import { Pill, Text } from './ui';

type Props = { onAllow: () => void; onSkip: () => void };

export function RemindersIntro({ onAllow, onSkip }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[StyleSheet.absoluteFill, styles.page, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }]}>
      <Pressable onPress={onSkip} style={styles.skip} hitSlop={10} accessibilityRole="button" accessibilityLabel="Skip reminders">
        <Text style={styles.skipText}>SKIP</Text>
      </Pressable>

      <Text style={styles.title}>Gentle reminders</Text>
      <Text style={styles.body}>Capy nudges you after lunch and in the evening, so no expense slips by.</Text>

      <View style={styles.card} accessible accessibilityLabel="Example reminder: Anything spent today? Capy is waiting to hear.">
        <View style={styles.notif}>
          <View style={styles.notifIcon}>
            <CapyFace mood="calm" width={34} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.notifTitle}>Capy</Text>
            <Text style={styles.notifBody}>Anything spent today? Capy is waiting to hear.</Text>
          </View>
          <Text style={styles.notifTime}>9:00 PM</Text>
        </View>
        <View style={styles.capy}>
          <CapyFace mood="happy" width={240} />
        </View>
      </View>

      <Pill label="Remind me to log" icon="bell-outline" onPress={onAllow} style={{ marginHorizontal: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: '#FFFDF9' },
  skip: { alignSelf: 'flex-end', paddingHorizontal: 22, paddingVertical: 8 },
  skipText: { fontSize: 15, fontWeight: '800', color: colors.muted, letterSpacing: 0.5 },
  title: { fontSize: 34, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 8 },
  body: { fontSize: 16, color: colors.muted, textAlign: 'center', marginTop: 8, paddingHorizontal: 36, lineHeight: 22 },
  card: { flex: 1, margin: 24, borderRadius: 32, backgroundColor: colors.fur, overflow: 'hidden' },
  notif: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 14,
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,250,244,0.92)',
  },
  notifIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.fur, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  notifTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  notifBody: { fontSize: 14, color: colors.text },
  notifTime: { fontSize: 12, color: colors.muted, alignSelf: 'flex-start' },
  capy: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
