// The end-of-day recap: the numbers for one day, plus one suggestion for
// tomorrow chosen from simple rules over the user's own recent data.
// Everything is computed on the phone; nothing is sent anywhere.

import { getCategory } from './categories';
import { energyFor, moodForEnergy, streak, summarize, topDetail, type DaySummary } from './stats';
import { addDays, dateKey, formatHour, formatRange } from './time';
import type { AppState, DayLog, Mood } from './types';

export type Suggestion = { type: string; headline: string; tip: string };

export type Recap = {
  date: string;
  summary: DaySummary;
  mood: Mood;
  verdict: string;
  /** Focus share of logged hours, 0–100, or null if nothing logged. */
  focusPct: number | null;
  /** Average focus share over the previous 7 logged days, or null. */
  avgFocusPct: number | null;
  sink: { categoryId: string; hours: number; detail: string | null } | null;
  best: { start: number; end: number; detail: string | null } | null;
  /** Hours that should have been logged (within the day window). */
  due: number;
  streak: number;
  suggestion: Suggestion;
};

const kindOf = (log?: { categoryId: string }) => (log ? getCategory(log.categoryId).kind : null);
const pct = (s: DaySummary) => (s.logged ? Math.round((s.focus / s.logged) * 100) : null);

/** Which day the recap is about: before your day starts, it's still yesterday's. */
export function recapDate(state: AppState, now = new Date()): string {
  return now.getHours() < state.settings.dayStart ? dateKey(addDays(now, -1)) : dateKey(now);
}

export function buildRecap(state: AppState, date: string, now = new Date()): Recap {
  const { dayStart, dayEnd } = state.settings;
  const day: DayLog = state.logs[date] ?? {};
  const summary = summarize([day]);
  const mood = moodForEnergy(energyFor(summary));
  const [y, m, d] = date.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const isToday = date === dateKey(now);
  const window = isToday ? Math.max(0, Math.min(now.getHours(), dayEnd) - dayStart) : dayEnd - dayStart;
  // Hours filled in early (the current hour) still count, so never show "15 of 14".
  const due = Math.max(window, summary.logged);

  // Previous 7 days with real data, for comparison.
  const prev: number[] = [];
  for (let i = 1; i <= 7; i++) {
    const s = summarize([state.logs[dateKey(addDays(dateObj, -i))]]);
    if (s.logged >= 4) prev.push(pct(s)!);
  }
  const avgFocusPct = prev.length ? Math.round(prev.reduce((a, b) => a + b, 0) / prev.length) : null;

  const drainTop = summary.byCategory.find(({ id }) => getCategory(id).kind === 'drain');
  const sink = drainTop
    ? { categoryId: drainTop.id, hours: drainTop.hours, detail: topDetail([day], drainTop.id)?.note ?? null }
    : null;

  // Longest run of consecutive focus hours (at least 2).
  let best: Recap['best'] = null;
  let runStart = -1;
  for (let h = dayStart; h <= dayEnd; h++) {
    if (h < dayEnd && kindOf(day[h]) === 'focus') {
      if (runStart < 0) runStart = h;
    } else if (runStart >= 0) {
      if (h - runStart >= 2 && (!best || h - runStart > best.end - best.start)) {
        const counts = new Map<string, number>();
        for (let k = runStart; k < h; k++) if (day[k]?.note) counts.set(day[k].note!, (counts.get(day[k].note!) ?? 0) + 1);
        const detail = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        best = { start: runStart, end: h, detail };
      }
      runStart = -1;
    }
  }

  const focusPct = pct(summary);
  return {
    date,
    summary,
    mood,
    verdict: verdictFor(mood, summary),
    focusPct,
    avgFocusPct,
    sink,
    best,
    due,
    streak: streak(state, dateObj),
    suggestion: suggest(state, dateObj, summary, focusPct, best, due),
  };
}

function verdictFor(mood: Mood, s: DaySummary): string {
  if (s.logged === 0) return 'A quiet day. Tikko missed you!';
  if (mood === 'radiant') return 'A focused day! Tikko is proud 💪';
  if (mood === 'happy') return 'A good, balanced day 🙂';
  if (mood === 'meh') return 'A so-so day. Tomorrow’s a fresh start.';
  return 'A tough day. That’s okay, tomorrow is new.';
}

/** Pick the single most useful suggestion. Rules are checked in priority order. */
function suggest(
  state: AppState,
  date: Date,
  s: DaySummary,
  focusPct: number | null,
  best: Recap['best'],
  due: number,
): Suggestion {
  const { dayStart } = state.settings;
  const week = Array.from({ length: 7 }, (_, i) => state.logs[dateKey(addDays(date, -i))]);

  // 1. Not enough data to say anything useful.
  if (due >= 4 && s.logged < due / 2) {
    return {
      type: 'log_more',
      headline: `You logged ${s.logged} of ${due} hours today.`,
      tip: 'Tomorrow, try answering every check-in, even with a quick tap. The more Tikko knows, the better its advice.',
    };
  }

  // 2. The same 2-hour window lost to distractions on 3+ days this week.
  let worst: { start: number; days: number } | null = null;
  for (let h = dayStart; h < 23; h++) {
    const days = week.filter((d) => d && kindOf(d[h]) === 'drain' && kindOf(d[h + 1]) === 'drain').length;
    if (days >= 3 && (!worst || days > worst.days)) worst = { start: h, days };
  }
  if (worst) {
    return {
      type: 'danger_window',
      headline: `You lost ${formatRange(worst.start, worst.start + 2)} to distractions on ${worst.days} days this week.`,
      tip: `Try putting your phone in another room at ${formatHour(worst.start)} tomorrow. Tikko will check how it went.`,
    };
  }

  // 3. A big time sink today, with a known app or detail.
  const drain = s.byCategory.find(({ id }) => getCategory(id).kind === 'drain');
  if (drain && drain.hours >= 3) {
    const detail = topDetail([week[0]], drain.id)?.note;
    const what = detail ?? getCategory(drain.id).name;
    return {
      type: 'big_sink',
      headline: `${what} took ${drain.hours} hours today.`,
      tip: detail
        ? `Try turning off ${detail} notifications tomorrow, or moving it off your home screen.`
        : 'Pick one hour tomorrow where your phone stays face down, and see how it feels.',
    };
  }

  // 4. Slow mornings: the first two hours weren't focused on 3 of the last 5 days.
  const slow = week
    .slice(0, 5)
    .filter((d) => d && d[dayStart] && d[dayStart + 1] && kindOf(d[dayStart]) !== 'focus' && kindOf(d[dayStart + 1]) !== 'focus').length;
  if (slow >= 3) {
    return {
      type: 'slow_mornings',
      headline: 'Your mornings have been starting slow.',
      tip: 'Tomorrow, try making your first hour a focused one. Decide tonight what it will be.',
    };
  }

  // 5. A great day worth repeating.
  if (focusPct !== null && focusPct >= 60 && best) {
    return {
      type: 'repeat_best',
      headline: `Your best stretch was ${formatRange(best.start, best.end)}.`,
      tip: 'Block the same time tomorrow and protect it. Great days are built on great stretches.',
    };
  }

  return {
    type: 'plan_first_hour',
    headline: 'Small steps make big days.',
    tip: 'Before bed, pick one thing you’ll focus on for the first hour tomorrow.',
  };
}
