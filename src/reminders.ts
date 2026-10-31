// Local reminders after lunch and in the evening. No server or push service, so they're free.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { nextDay, startOfDay } from './stats';

const supported = Platform.OS !== 'web';
const DAYS_AHEAD = 7;

const LUNCH = [
  'Lunch money? Tell Capy before you forget.',
  'Anything for lunch today? Capy is listening.',
  'Quick one: what did lunch cost?',
];
const EVENING = [
  'Anything spent today? Capy is waiting to hear.',
  "Before bed: tell Capy today's spends and keep your streak.",
  'One minute with Capy keeps your streak alive.',
];

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

export async function askPermission(): Promise<boolean> {
  if (!supported) return true;
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
}

/** Re-plans the next week of reminders. Today's evening one is skipped once you've checked in. */
export async function scheduleReminders(checkedInToday: boolean): Promise<void> {
  if (!supported) return;
  const { granted } = await Notifications.getPermissionsAsync();
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!granted) return;

  const now = Date.now();
  let day = startOfDay(now);
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const at = (h: number, m: number) => day + (h * 60 + m) * 60 * 1000;
    const plan = [
      { when: at(14, 0), body: LUNCH[i % LUNCH.length] },
      { when: at(21, 0), body: EVENING[i % EVENING.length], skip: i === 0 && checkedInToday },
    ];
    for (const r of plan) {
      if (r.skip || r.when <= now) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Capy', body: r.body, data: { url: 'capy://listen' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.when },
      });
    }
    day = nextDay(day);
  }
}

export async function cancelReminders(): Promise<void> {
  if (supported) await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Tapping a reminder opens the voice overlay. */
export function onReminderTapped(open: () => void): () => void {
  if (!supported) return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener(() => open());
  return () => sub.remove();
}
