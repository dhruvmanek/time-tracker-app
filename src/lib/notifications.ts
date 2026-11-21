// Hourly check-in notifications.
//
// Each check-in is a repeating daily notification (e.g. every day at 3 PM asking
// about 2–3 PM). Long-pressing it shows buttons for your most-used categories,
// so you can log without typing. Tapping the notification itself opens the
// check-in screen.

import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { DEFAULT_QUICK_IDS, getCategory } from './categories';
import { recordLog, type RewardParams } from './log';
import { getState, markResponseHandled, ready } from './store';
import { checkInHours, topCategoryIds } from './stats';
import { dateKey, formatHour } from './time';

const CATEGORY_ID = 'checkin';
const TRIAL_REMINDER_ID = 'trial-reminder';
const ACTION_PREFIX = 'log:';
const OTHER_ACTION = 'other';
const supported = Platform.OS !== 'web';

const PROMPTS = [
  'What did you do since {start}?',
  'Quick one: how was {start}–{end}?',
  'Tikko wants to know: where did {start}–{end} go?',
  'Check in! What filled {start}–{end}?',
];

if (supported) {
  // Show the banner even if the app is open.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestPermission(): Promise<boolean> {
  if (!supported) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/**
 * Notification buttons: your 3 most-used activities, plus "Something else",
 * which opens the full check-in screen. Refreshed each app launch.
 */
async function registerActions() {
  const ids = topCategoryIds(getState(), DEFAULT_QUICK_IDS).slice(0, 3);
  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
    ...ids.map((id) => {
      const c = getCategory(id);
      return {
        identifier: ACTION_PREFIX + id,
        buttonTitle: `${c.emoji} ${c.name}`,
        // iOS only delivers button taps to a closed app if it opens the app.
        // The app opens straight onto the "+XP" reward screen.
        options: { opensAppToForeground: true },
      };
    }),
    { identifier: OTHER_ACTION, buttonTitle: '✏️ Something else…', options: { opensAppToForeground: true } },
  ]);
}

/** iOS reports a notification's time in seconds, Android in milliseconds. */
function notificationTime(date: number): Date {
  return new Date(date < 1e12 ? date * 1000 : date);
}

let queue: Promise<void> = Promise.resolve();

/** Cancel and re-create all check-in notifications from current settings. */
export function rescheduleAll(): Promise<void> {
  // Run one at a time so two quick setting changes can't interleave.
  queue = queue.then(doReschedule).catch((e) => console.warn('Scheduling failed', e));
  return queue;
}

async function doReschedule() {
  if (!supported) return;
  // Cancel only the hourly check-ins; keep one-off reminders such as the trial reminder.
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier !== TRIAL_REMINDER_ID)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  const { settings } = getState();
  if (!settings.notificationsOn) return;
  const granted = (await Notifications.getPermissionsAsync()).granted;
  if (!granted) return;

  await registerActions();
  const hours = checkInHours(settings);
  for (const [i, hour] of hours.entries()) {
    const start = hour - settings.interval;
    const body = PROMPTS[i % PROMPTS.length]
      .replace('{start}', formatHour(start))
      .replace('{end}', formatHour(hour));
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Tikko ⏳',
        body: `${body} Hold to log in one tap.`,
        categoryIdentifier: CATEGORY_ID,
        data: { start, end: hour },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        // A day that ends at midnight rings at hour 0 (iOS only accepts 0–23).
        hour: hour % 24,
        minute: 0,
      },
    });
  }
}

export async function sendTestNotification() {
  if (!supported) return;
  await registerActions();
  const now = new Date().getHours();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Tikko ⏳ (test)',
      body: `What did you do since ${formatHour(Math.max(now - 1, 0))}? Hold to log in one tap.`,
      categoryIdentifier: CATEGORY_ID,
      data: { start: Math.max(now - 1, 0), end: Math.max(now, 1) },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 },
  });
}

/** Called when the user taps a notification or one of its buttons. */
async function handleResponse(
  response: Notifications.NotificationResponse,
  onQuickLog: (reward: RewardParams) => void,
) {
  await ready;
  const { notification, actionIdentifier } = response;
  const key = `${notification.request.identifier}@${notification.date}:${actionIdentifier}`;
  if (!markResponseHandled(key)) return;

  const data = notification.request.content.data as { start?: number; end?: number };
  if (typeof data?.start !== 'number' || typeof data?.end !== 'number') return;
  // The midnight check-in arrives on the next calendar day but is about the day before.
  const firedAt = notificationTime(notification.date);
  if (firedAt.getHours() < data.start) firedAt.setDate(firedAt.getDate() - 1);
  const date = dateKey(firedAt);

  if (actionIdentifier.startsWith(ACTION_PREFIX)) {
    const categoryId = actionIdentifier.slice(ACTION_PREFIX.length);
    onQuickLog(recordLog(date, data.start, data.end, categoryId));
  } else {
    router.push({
      pathname: '/check-in',
      params: { date, start: String(data.start), end: String(data.end) },
    });
  }
}

/** Start listening for notification taps. Returns a cleanup function. */
export function listenForResponses(onQuickLog: (reward: RewardParams) => void) {
  if (!supported) return () => {};
  // The tap that launched the app (if it was closed).
  const last = Notifications.getLastNotificationResponse();
  if (last) handleResponse(last, onQuickLog);
  const sub = Notifications.addNotificationResponseReceivedListener((r) =>
    handleResponse(r, onQuickLog),
  );
  return () => sub.remove();
}

/** "Your trial ends tomorrow": promised on the paywall, sent one day before the trial ends. */
export async function scheduleTrialReminder(trialDays: number) {
  if (!supported || trialDays < 2) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  await Notifications.cancelScheduledNotificationAsync(TRIAL_REMINDER_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: TRIAL_REMINDER_ID,
    content: {
      title: 'Tikko ⏳',
      body: 'Your free trial ends tomorrow. You can cancel anytime in Settings → Apple ID → Subscriptions.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: (trialDays - 1) * 24 * 60 * 60,
    },
  });
}
