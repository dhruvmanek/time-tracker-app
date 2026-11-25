// Ask for an App Store rating at a happy moment. Ratings are one of the biggest
// App Store ranking factors. Apple shows the prompt at most 3 times a year and
// decides itself whether to show it; we only ask after real use, at most every 60 days.
// First choice: right after someone rates their day 4 or 5. Backup: after a check-in on a streak.

import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

import { track } from './analytics';
import { getState, markReviewAsked } from './store';

const MIN_LOGGED_HOURS = 20;
const MIN_HOURS_FOR_GOOD_DAY = 6;
const MIN_DAYS_BETWEEN = 60;

function loggedHours() {
  return Object.values(getState().logs).reduce((n, day) => n + Object.keys(day).length, 0);
}

function askedRecently() {
  const at = getState().reviewAskedAt;
  return at ? (Date.now() - at) / 86_400_000 < MIN_DAYS_BETWEEN : false;
}

async function ask(reason: string, props: Record<string, number>) {
  if (!(await StoreReview.isAvailableAsync())) return;
  markReviewAsked();
  track('review_prompted', { reason, ...props });
  await StoreReview.requestReview();
}

/** The happiest moment: someone just said their day felt good (4 or 5 out of 5). */
export async function maybeAskAfterGoodDay(rating: number) {
  if (Platform.OS !== 'ios' || rating < 4 || askedRecently()) return;
  const logged = loggedHours();
  if (logged < MIN_HOURS_FOR_GOOD_DAY) return;
  await ask('good_day', { rating, logged_hours: logged });
}

export async function maybeAskForReview(streakDays: number) {
  if (Platform.OS !== 'ios') return;
  const logged = loggedHours();
  if (logged < MIN_LOGGED_HOURS || streakDays < 3 || askedRecently()) return;
  await ask('streak', { logged_hours: logged, streak: streakDays });
}
