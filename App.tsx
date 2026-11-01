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
import { BedtimeRitual } from './src/components/BedtimeRitual';
import { DayDetail } from './src/components/DayDetail';
import { FriendsAlbum } from './src/components/FriendsAlbum';
import { HomeScreen } from './src/components/HomeScreen';
import { RemindersIntro } from './src/components/RemindersIntro';
import { StreakSheet } from './src/components/StreakSheet';
import { SummaryScreen } from './src/components/SummaryScreen';
import { VoiceOverlay } from './src/components/VoiceOverlay';
import type { Category } from './src/parser';
import { askPermission, cancelReminders, onReminderTapped, scheduleReminders } from './src/reminders';
import { activeDays, bandsFor, bestStreak, dayKey, expensesOn, startOfDay, streak, sum } from './src/stats';
import { learn } from './src/learning';
import * as store from './src/storage';
import {
  applyChillDays,
  chillDays,
  chillUsed,
  foundIds,
  maybeEarnChill,
  nextRare,
  type Visitor,
  VISITORS,
  visitorOn,
  welcomeVisitor,
} from './src/visitors';

// Opening capy://listen (from a Shortcut, Back Tap, Siri or a reminder) jumps straight to the voice overlay.
const wantsListen = (url: string | null) => !!url && Linking.parse(url).hostname === 'listen';

type Entry = { category: Category; day?: number };
type Ritual = { visitor: Visitor; isNew: boolean; chillEarned: boolean; streak: number };

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
  const [ritual, setRitual] = useState<Ritual | null>(null);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [chillList, setChillList] = useState(chillUsed);
  const [notice, setNotice] = useState<string | null>(null);
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
  const active = useMemo(() => activeDays(expenses, checkins, chillList), [expenses, checkins, chillList]);
  const currentStreak = streak(active, now);
  const checkedInToday = checkins.includes(todayKey);
  const monthStart = new Date(new Date(now).getFullYear(), new Date(now).getMonth(), 1).getTime();
  const monthTotal = sum(expenses.filter((e) => e.createdAt >= monthStart));
  const tonightsVisitor = visitorOn(todayKey);

  // If you missed a day, a saved Chill Day quietly keeps your streak alive.
  useEffect(() => {
    const used = applyChillDays(activeDays(store.listExpenses(), store.listCheckins(), chillUsed()));
    if (used > 0) {
      setChillList(chillUsed());
      setNotice(used === 1 ? '🍊 A Chill Day saved your streak yesterday' : `🍊 ${used} Chill Days saved your streak`);
    }
  }, []);

  function tuckIn() {
    store.addCheckin(todayKey);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    refresh();
    const newStreak = streak(activeDays(store.listExpenses(), store.listCheckins(), chillList));
    const { visitor, isNew } = welcomeVisitor(todayKey, newStreak);
    setRitual({ visitor, isNew, chillEarned: maybeEarnChill(newStreak), streak: newStreak });
  }

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
        visitor={tonightsVisitor ?? undefined}
        notice={notice}
        onDismissNotice={() => setNotice(null)}
        onCheckIn={tuckIn}
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
          chillDays={chillDays()}
          found={foundIds().size}
          total={VISITORS.length}
          onOpenSummary={() => setSummaryOpen(true)}
          onOpenAlbum={() => setAlbumOpen(true)}
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

      {ritual && (
        <BedtimeRitual
          todayList={todayList}
          today={today}
          budget={budget}
          bands={bands}
          streak={ritual.streak}
          visitor={ritual.visitor}
          isNew={ritual.isNew}
          found={foundIds().size}
          total={VISITORS.length}
          chillEarned={ritual.chillEarned}
          nextRare={nextRare(ritual.streak)}
          onOpenAlbum={() => setAlbumOpen(true)}
          onClose={() => {
            setRitual(null);
            maybeAskReminders();
          }}
        />
      )}

      {albumOpen && <FriendsAlbum found={foundIds()} onClose={() => setAlbumOpen(false)} />}

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
            if (e.note) learn(e.note, e.category);
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

