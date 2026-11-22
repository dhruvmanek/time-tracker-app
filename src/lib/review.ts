// Ask for an App Store rating at a happy moment. Ratings are one of the biggest
// App Store ranking factors. Apple shows the prompt at most 3 times a year and
// decides itself whether to show it; we only ask after real use, at most every 60 days.

import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

import { track } from './analytics';
import { getState, markReviewAsked } from './store';

const MIN_LOGGED_HOURS = 20;
const MIN_DAYS_BETWEEN = 60;

export async function maybeAskForReview(streakDays: number) {
  if (Platform.OS !== 'ios') return;
  const s = getState();
  const logged = Object.values(s.logs).reduce((n, day) => n + Object.keys(day).length, 0);
  const since = s.reviewAskedAt ? (Date.now() - s.reviewAskedAt) / 86_400_000 : Infinity;
  if (logged < MIN_LOGGED_HOURS || streakDays < 3 || since < MIN_DAYS_BETWEEN) return;
  if (!(await StoreReview.isAvailableAsync())) return;
  markReviewAsked();
  track('review_prompted', { logged_hours: logged, streak: streakDays });
  await StoreReview.requestReview();
}
