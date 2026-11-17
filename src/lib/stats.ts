// The game rules and the numbers behind the Insights screen.
// Design rule: XP comes from logging honestly, never from being "productive".
// Productivity only changes Tikko's mood.

import { CATEGORIES, getCategory } from './categories';
import { addDays, dateKey } from './time';
import type { AppState, DayLog, Mood, Settings } from './types';

export const XP_PER_HOUR = 10;
/** Bonus for logging within 90 minutes of the hour ending (fresh memory = better data). */
export const ON_TIME_BONUS = 5;
/** A day counts toward your streak once you log at least this many hours. */
export const STREAK_MIN_HOURS = 4;

export type DaySummary = {
  logged: number;
  focus: number;
  neutral: number;
  drain: number;
  byCategory: { id: string; hours: number }[];
  /** Share of active hours that were focus, 0–1. null if nothing focus/drain logged. */
  focusRatio: number | null;
};

export function summarize(days: (DayLog | undefined)[]): DaySummary {
  const counts = new Map<string, number>();
  let focus = 0;
  let neutral = 0;
  let drain = 0;
  for (const day of days) {
    if (!day) continue;
    for (const log of Object.values(day)) {
      counts.set(log.categoryId, (counts.get(log.categoryId) ?? 0) + 1);
      const kind = getCategory(log.categoryId).kind;
      if (kind === 'focus') focus++;
      else if (kind === 'drain') drain++;
      else neutral++;
    }
  }
  const byCategory = [...counts.entries()]
    .map(([id, hours]) => ({ id, hours }))
    .sort((a, b) => b.hours - a.hours);
  return {
    logged: focus + neutral + drain,
    focus,
    neutral,
    drain,
    byCategory,
    focusRatio: focus + drain === 0 ? null : focus / (focus + drain),
  };
}

function hourXp(date: string, hour: number, loggedAt: number): number {
  const [y, m, d] = date.split('-').map(Number);
  const hourEnd = new Date(y, m - 1, d, hour + 1).getTime();
  const onTime = loggedAt - hourEnd <= 90 * 60 * 1000;
  return XP_PER_HOUR + (onTime ? ON_TIME_BONUS : 0);
}

export function totalXp(state: AppState): number {
  let xp = 0;
  for (const [date, day] of Object.entries(state.logs)) {
    for (const [hour, log] of Object.entries(day)) {
      xp += hourXp(date, Number(hour), log.loggedAt);
    }
  }
  return xp;
}

/** Level n needs 50·n·(n−1) XP in total: L2 = 100, L3 = 300, L4 = 600, ... */
export function levelInfo(xp: number) {
  let level = 1;
  while (xp >= 50 * (level + 1) * level) level++;
  const floor = 50 * level * (level - 1);
  const next = 50 * (level + 1) * level;
  return { level, xpIntoLevel: xp - floor, xpForLevel: next - floor };
}

/** Tikko grows as you level up: 1 = sprout, 2 = buddy, 3 = radiant elder. */
export function stageForLevel(level: number): 1 | 2 | 3 {
  if (level >= 8) return 3;
  if (level >= 4) return 2;
  return 1;
}

export function streak(state: AppState, today = new Date()): number {
  const qualifies = (d: Date) =>
    Object.keys(state.logs[dateKey(d)] ?? {}).length >= STREAK_MIN_HOURS;
  // Today doesn't break the streak until it's over.
  let cursor = qualifies(today) ? today : addDays(today, -1);
  let count = 0;
  while (qualifies(cursor)) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

/**
 * Tikko's energy for a day, 0–100. Starts at 80 each morning.
 * Focus hours charge it (+6), drain hours run it down (−12), neutral hours do nothing.
 * Energy is only about how the day went. XP (for logging honestly) is separate.
 */
export const ENERGY_START = 80;
export function energyFor(summary: DaySummary): number {
  const e = ENERGY_START + summary.focus * 6 - summary.drain * 12;
  return Math.max(0, Math.min(100, e));
}

export function moodForEnergy(energy: number): Mood {
  if (energy >= 85) return 'radiant';
  if (energy >= 60) return 'happy';
  if (energy >= 40) return 'meh';
  return 'drained';
}

export const MOOD_LINES: Record<Mood, string> = {
  radiant: 'Tikko is ringing with energy!',
  happy: 'Tikko is ticking along nicely',
  meh: 'Tikko is slowing down…',
  drained: 'Tikko is running down…',
};

/** Hours on the clock when check-ins happen, e.g. [9, 10, ..., 23]. */
export function checkInHours(settings: Settings): number[] {
  const hours: number[] = [];
  for (let h = settings.dayStart + settings.interval; h <= settings.dayEnd; h += settings.interval) {
    hours.push(h);
  }
  return hours;
}

/**
 * The block the next check-in should cover: from the earliest unlogged hour
 * (within today's window) up to the current hour.
 */
export function pendingRange(
  state: AppState,
  now = new Date(),
): { start: number; end: number } | null {
  const { dayStart, dayEnd } = state.settings;
  const end = Math.min(now.getHours(), dayEnd);
  const day = state.logs[dateKey(now)] ?? {};
  // Walk back from the last finished hour through the unlogged stretch (max 4h).
  let start = end;
  while (start - 1 >= dayStart && !day[start - 1] && end - start < 4) start--;
  if (start === end) return null;
  return { start, end };
}

/** The 4 most-used categories over the last two weeks, for notification buttons. */
export function topCategoryIds(state: AppState, fallback: string[], today = new Date()): string[] {
  const counts = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    const day = state.logs[dateKey(addDays(today, -i))];
    if (!day) continue;
    for (const log of Object.values(day)) {
      counts.set(log.categoryId, (counts.get(log.categoryId) ?? 0) + 1);
    }
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const valid = new Set(CATEGORIES.map((c) => c.id));
  // Before there's history, put the user's biggest time sink (from onboarding) near the top.
  const sink = state.profile?.sinks?.[0];
  const result = [...ranked, ...(sink ? [fallback[0], sink] : []), ...fallback].filter((id, i, arr) => valid.has(id) && arr.indexOf(id) === i);
  return result.slice(0, 4);
}

/** For each hour of the day, the share of logged days where it was a drain hour. */
export function drainByHour(state: AppState, days: number, today = new Date()) {
  const result: { hour: number; drain: number; total: number }[] = [];
  for (let h = 0; h < 24; h++) result.push({ hour: h, drain: 0, total: 0 });
  for (let i = 0; i < days; i++) {
    const day = state.logs[dateKey(addDays(today, -i))];
    if (!day) continue;
    for (const [hour, log] of Object.entries(day)) {
      const slot = result[Number(hour)];
      slot.total++;
      if (getCategory(log.categoryId).kind === 'drain') slot.drain++;
    }
  }
  return result;
}

/** How many check-in slots of today have already passed (for "6/9 check-ins"). */
export function hoursDueToday(settings: Settings, now = new Date()): number {
  const end = Math.min(now.getHours(), settings.dayEnd);
  return Math.max(0, end - settings.dayStart);
}
