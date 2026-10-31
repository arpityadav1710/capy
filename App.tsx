import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AmountSheet } from './src/components/AmountSheet';
import { BudgetSheet } from './src/components/BudgetSheet';
import { Celebration } from './src/components/Celebration';
import { DayDetail } from './src/components/DayDetail';
import { HomeScreen } from './src/components/HomeScreen';
import { RemindersIntro } from './src/components/RemindersIntro';
import { StreakSheet } from './src/components/StreakSheet';
import { SummaryScreen } from './src/components/SummaryScreen';
import { VoiceOverlay } from './src/components/VoiceOverlay';
import type { Category } from './src/parser';
import { askPermission, cancelReminders, onReminderTapped, scheduleReminders } from './src/reminders';
import { activeDays, bandsFor, bestStreak, dayKey, expensesOn, startOfDay, streak, sum } from './src/stats';
import * as store from './src/storage';

// Opening capy://listen (from a Shortcut, Back Tap, Siri or a reminder) jumps straight to the voice overlay.
const wantsListen = (url: string | null) => !!url && Linking.parse(url).hostname === 'listen';

type Entry = { category: Category; day?: number };

export default function App() {
  const [fontsLoaded] = useFonts({ Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold });

  const [expenses, setExpenses] = useState(store.listExpenses);
  const [checkins, setCheckins] = useState(store.listCheckins);
  const [budget, setBudget] = useState(() => Number(store.getSetting('budget')) || null);

  const [listening, setListening] = useState(false);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [editingBudget, setEditingBudget] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [streakOpen, setStreakOpen] = useState(false);
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [askReminders, setAskReminders] = useState(false);

  const refresh = useCallback(() => {
    setExpenses(store.listExpenses());
    setCheckins(store.listCheckins());
  }, []);

  const now = Date.now();
  const todayKey = dayKey(now);
  const todayList = useMemo(() => expensesOn(expenses, now), [expenses, todayKey]);
  const today = sum(todayList);
  const bands = useMemo(() => bandsFor(todayList), [todayList]);
  const active = useMemo(() => activeDays(expenses, checkins), [expenses, checkins]);
  const currentStreak = streak(active, now);
  const checkedInToday = checkins.includes(todayKey);
  const monthStart = new Date(new Date(now).getFullYear(), new Date(now).getMonth(), 1).getTime();
  const monthTotal = sum(expenses.filter((e) => e.createdAt >= monthStart));

  useEffect(() => {
    Linking.getInitialURL().then((url) => wantsListen(url) && setListening(true));
    const sub = Linking.addEventListener('url', ({ url }) => wantsListen(url) && setListening(true));
    const unTap = onReminderTapped(() => setListening(true));
    return () => {
      sub.remove();
      unTap();
    };
  }, []);

  useEffect(() => {
    if (store.getSetting('reminders') === 'on') scheduleReminders(checkedInToday);
  }, [checkedInToday]);

  // After the first thing you log, offer reminders once.
  const maybeAskReminders = () => {
    if (store.getSetting('remindersAsked') == null) setAskReminders(true);
  };

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#FFFDF9' }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <HomeScreen
        today={today}
        bands={bands}
        budget={budget}
        streak={currentStreak}
        activeToday={active.has(todayKey)}
        checkedInToday={checkedInToday}
        onTalk={() => setListening(true)}
        onQuickAdd={(category) => setEntry({ category })}
        onCheckIn={() => {
          store.addCheckin(todayKey);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          refresh();
          setCelebrating(true);
        }}
        onOpenSummary={() => setSummaryOpen(true)}
        onOpenStreak={() => setStreakOpen(true)}
        onOpenToday={() => setOpenDay(startOfDay(now))}
        onEditBudget={() => setEditingBudget(true)}
      />

      {streakOpen && (
        <StreakSheet
          active={active}
          streak={currentStreak}
          best={bestStreak(active)}
          checkedInToday={checkedInToday}
          onOpenSummary={() => setSummaryOpen(true)}
          onClose={() => setStreakOpen(false)}
        />
      )}

      {summaryOpen && (
        <SummaryScreen
          expenses={expenses}
          active={active}
          checkins={checkins}
          today={today}
          monthTotal={monthTotal}
          budget={budget}
          streak={currentStreak}
          onOpenDay={setOpenDay}
          onClose={() => setSummaryOpen(false)}
        />
      )}

      {openDay != null && (
        <DayDetail
          day={openDay}
          expenses={expenses}
          checkins={checkins}
          budget={budget}
          onDelete={(id) => {
            store.deleteExpense(id);
            refresh();
          }}
          onAddMissed={(day) => setEntry({ category: 'Food', day })}
          onClose={() => setOpenDay(null)}
        />
      )}

      {celebrating && (
        <Celebration
          today={today}
          budget={budget}
          bands={bands}
          streak={currentStreak}
          onClose={() => {
            setCelebrating(false);
            maybeAskReminders();
          }}
        />
      )}

      {askReminders && (
        <RemindersIntro
          onAllow={async () => {
            store.setSetting('remindersAsked', 'yes');
            setAskReminders(false);
            if (await askPermission()) {
              store.setSetting('reminders', 'on');
              scheduleReminders(checkedInToday);
            }
          }}
          onSkip={() => {
            store.setSetting('remindersAsked', 'skipped');
            store.setSetting('reminders', 'off');
            cancelReminders();
            setAskReminders(false);
          }}
        />
      )}

      {listening && (
        <VoiceOverlay
          onClose={() => {
            setListening(false);
            if (store.listExpenses().length > 0) maybeAskReminders();
          }}
          onSaved={refresh}
          onTypeInstead={() => setEntry({ category: 'Food' })}
        />
      )}

      {entry && (
        <AmountSheet
          category={entry.category}
          day={entry.day}
          onClose={() => setEntry(null)}
          onSave={(e) => {
            store.addExpense(e);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setEntry(null);
            refresh();
            if (!entry.day) maybeAskReminders();
          }}
        />
      )}

      {editingBudget && (
        <BudgetSheet
          current={budget}
          onClose={() => setEditingBudget(false)}
          onSave={(b) => {
            store.setSetting('budget', b ? String(b) : '');
            setBudget(b);
            setEditingBudget(false);
          }}
        />
      )}
    </SafeAreaProvider>
  );
}

