// Logging an hour and working out the reward, shared by the check-in screen
// and the notification buttons.

import { levelInfo, totalXp } from './stats';
import { getState, logHours } from './store';

/** Params for the reward screen (strings, because they travel in the URL). */
export type RewardParams = {
  categoryId: string;
  hours: string;
  xp: string;
  levelUp: string;
  date: string;
};

export function recordLog(
  date: string,
  start: number,
  end: number,
  categoryId: string,
  note?: string,
): RewardParams {
  const before = getState();
  const xpBefore = totalXp(before);
  logHours(date, start, end, categoryId, note);
  const after = getState();
  const xpAfter = totalXp(after);
  const levelBefore = levelInfo(xpBefore).level;
  const levelAfter = levelInfo(xpAfter).level;
  return {
    categoryId,
    hours: String(end - start),
    xp: String(Math.max(0, xpAfter - xpBefore)),
    levelUp: levelAfter > levelBefore ? String(levelAfter) : '',
    date,
  };
}
