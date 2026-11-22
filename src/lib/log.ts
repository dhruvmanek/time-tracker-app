// Logging an hour and working out the reward, shared by the check-in screen
// and the notification buttons.

import { WORLDS } from '@/components/scene';

import { track } from './analytics';
import { getCategory } from './categories';
import { levelInfo, totalXp, unlockedWorlds } from './stats';
import { getState, logHours } from './store';

/** Params for the reward screen (strings, because they travel in the URL). */
export type RewardParams = {
  categoryId: string;
  hours: string;
  xp: string;
  levelUp: string;
  /** Id of a world unlocked by this check-in, if any. */
  newWorld: string;
  date: string;
  /** First hour logged; with `hours`, the range a detail chip applies to. */
  start: string;
};

export function recordLog(
  date: string,
  start: number,
  end: number,
  categoryId: string,
  note?: string,
  source: 'app' | 'notification' | 'same_as_before' = 'app',
): RewardParams {
  const before = getState();
  const xpBefore = totalXp(before);
  const worldsBefore = unlockedWorlds(before);
  logHours(date, start, end, categoryId, note);
  track('checkin_logged', {
    category: categoryId,
    kind: getCategory(categoryId).kind,
    hours: end - start,
    source,
    has_detail: !!note,
  });
  const after = getState();
  const xpAfter = totalXp(after);
  const levelBefore = levelInfo(xpBefore).level;
  const levelAfter = levelInfo(xpAfter).level;
  return {
    categoryId,
    hours: String(end - start),
    start: String(start),
    xp: String(Math.max(0, xpAfter - xpBefore)),
    levelUp: levelAfter > levelBefore ? String(levelAfter) : '',
    newWorld: WORLDS.find((w) => unlockedWorlds(after).includes(w.id) && !worldsBefore.includes(w.id))?.id ?? '',
    date,
  };
}
