// Your streak at a glance: this week's logged days, current and best streak, and a word from Capy.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { dayKey, startOfDay, thisWeek } from '../stats';
import { colors } from '../theme';
import { CapyFace } from './CapyFace';
import { BottomSheet, Pill, Text } from './ui';

type Props = {
  active: Set<string>;
  streak: number;
  best: number;
  checkedInToday: boolean;
  onOpenSummary: () => void;
  chillDays: number;
  found: number;
  total: number;
  onOpenAlbum: () => void;
  onClose: () => void;
};

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function StreakSheet({ active, streak, best, checkedInToday, onOpenSummary, chillDays, found, total, onOpenAlbum, onClose }: Props) {
  const today = startOfDay(Date.now());
  const loggedToday = active.has(dayKey(today));

  let message = 'Tell Capy one expense today to start a streak.';
  if (checkedInToday) message = "You're done for today. See you tomorrow!";
  else if (loggedToday) message = `Day ${streak} done. Check in tonight when you're finished.`;
  else if (streak > 0) message = `Log anything today to keep your ${streak}-day streak.`;

  return (
    <BottomSheet onClose={onClose}>
      {(close) => (
        <>
          <View style={styles.head}>
            <View style={styles.face}>
              <CapyFace mood={loggedToday ? 'happy' : 'calm'} width={64} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.big} maxFontSizeMultiplier={1.3} accessibilityRole="header">
                {streak} day streak
              </Text>
              <Text style={styles.message}>{message}</Text>
            </View>
          </View>

          <View style={styles.week}>
            {thisWeek(today).map((day, i) => {
              const done = active.has(dayKey(day));
              const isToday = day === today;
              const future = day > today;
              return (
                <View
                  key={day}
                  style={styles.dayCol}
                  accessible
                  accessibilityLabel={`${WEEKDAY_NAMES[i]}${isToday ? ', today' : ''}: ${future ? 'coming up' : done ? 'logged' : 'missed'}`}
                >
                  <Text style={[styles.dayLetter, isToday && { color: colors.brown }]}>{WEEKDAYS[i]}</Text>
                  <View style={[styles.dot, done && styles.dotDone, isToday && !done && styles.dotToday, future && styles.dotFuture]}>
                    {done && <MaterialCommunityIcons name="check" size={18} color="#fff" />}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.stats}>
            <Stat label="Current streak" value={`${streak} ${streak === 1 ? 'day' : 'days'}`} />
            <View style={styles.divider} />
            <Stat label="Best streak" value={`${best} ${best === 1 ? 'day' : 'days'}`} />
            <View style={styles.divider} />
            <Stat label="Chill Days" value={`🍊 ${chillDays}`} />
          </View>
          <Text style={styles.chillHint}>A Chill Day saves your streak if you forget a day. Earn one every 7 days.</Text>

          <Pill label={`Friends of Capy · ${found} of ${total}`} icon="paw" onPress={() => close(onOpenAlbum)} />
          <Pill label="See full summary" variant="light" icon="chart-bar" onPress={() => close(onOpenSummary)} style={{ marginTop: 10 }} />
        </>
      )}
    </BottomSheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  face: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.fur, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  big: { fontSize: 26, fontWeight: '800', color: colors.brown },
  message: { fontSize: 15, color: colors.muted, marginTop: 2, lineHeight: 20 },
  week: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 22, paddingVertical: 14, paddingHorizontal: 10 },
  dayCol: { alignItems: 'center', gap: 8, flex: 1 },
  dayLetter: { fontSize: 13, fontWeight: '800', color: colors.muted },
  dot: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: colors.brown },
  dotToday: { borderWidth: 2, borderColor: colors.brown, backgroundColor: '#fff' },
  dotFuture: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.line, borderStyle: 'dashed' },
  stats: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  chillHint: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 8, marginBottom: 16, lineHeight: 18 },
  divider: { width: 1, height: 36, backgroundColor: colors.line },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
