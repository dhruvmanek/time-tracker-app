// Logging an hour, shared by the check-in screen and the notification buttons.

import { track } from './analytics';
import { getCategory } from './categories';
import { logHours } from './store';

/** Params for the reward screen (strings, because they travel in the URL). */
export type RewardParams = {
  categoryId: string;
  hours: string;
  date: string;
  /** First hour logged; with `hours`, the range an optional detail applies to. */
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
  logHours(date, start, end, categoryId, note);
  track('checkin_logged', {
    category: categoryId,
    kind: getCategory(categoryId).kind,
    hours: end - start,
    source,
    has_detail: !!note,
  });
  return { categoryId, hours: String(end - start), start: String(start), date };
}
