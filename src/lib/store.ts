// A tiny app-wide store, saved on the phone with AsyncStorage.
// Everything stays on the device; there is no server.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import type { AppState, HourLog, Profile, Settings } from './types';

const STORAGE_KEY = 'tikk-state-v1';

export const DEFAULT_SETTINGS: Settings = {
  dayStart: 8,
  dayEnd: 23,
  interval: 1,
  notificationsOn: true,
};

const initialState: AppState = {
  onboarded: false,
  profile: {},
  settings: DEFAULT_SETTINGS,
  logs: {},
  handledResponses: [],
};

let state: AppState = initialState;
let hydrated = false;
const listeners = new Set<() => void>();

let resolveReady: () => void;
/** Resolves once saved data has been loaded from the phone. */
export const ready = new Promise<void>((r) => (resolveReady = r));

async function hydrate() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<AppState>;
      state = {
        ...initialState,
        ...saved,
        settings: { ...DEFAULT_SETTINGS, ...saved.settings },
        profile: { ...saved.profile },
      };
      const repaired = repairMisdatedLogs(state.logs);
      if (repaired !== state.logs) {
        state = { ...state, logs: repaired };
        persist();
      }
    }
  } catch (e) {
    console.warn('Could not load saved data', e);
  }
  hydrated = true;
  emit();
  resolveReady();
}
hydrate();

/**
 * An earlier version saved notification quick-logs under a 1970 date (iOS gives
 * notification times in seconds, not milliseconds). Each log also stores when it
 * was tapped, so move it back to that day. The hour itself was always correct;
 * an hour later than the tap time means it was the midnight check-in, so it
 * belongs to the day before.
 */
function repairMisdatedLogs(logs: AppState['logs']): AppState['logs'] {
  const bad = Object.keys(logs).filter((k) => k < '2000');
  if (bad.length === 0) return logs;
  const fixed = { ...logs };
  for (const key of bad) {
    for (const [hourStr, log] of Object.entries(logs[key])) {
      const hour = Number(hourStr);
      const tapped = new Date(log.loggedAt);
      if (hour > tapped.getHours()) tapped.setDate(tapped.getDate() - 1);
      const y = tapped.getFullYear();
      const m = String(tapped.getMonth() + 1).padStart(2, '0');
      const d = String(tapped.getDate()).padStart(2, '0');
      const target = `${y}-${m}-${d}`;
      // Don't overwrite an hour that was also logged inside the app.
      if (!fixed[target]?.[hour]) fixed[target] = { ...(fixed[target] ?? {}), [hour]: log };
    }
    delete fixed[key];
  }
  return fixed;
}

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((e) =>
    console.warn('Could not save data', e),
  );
}

function setState(update: (s: AppState) => AppState) {
  state = update(state);
  emit();
  persist();
}

export function getState(): AppState {
  return state;
}

export function useAppState(): AppState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => hydrated,
  );
}

// ---- Actions ----

/** Log every hour in [start, end) on the given day as one category. */
export function logHours(
  date: string,
  start: number,
  end: number,
  categoryId: string,
  note?: string,
) {
  const now = Date.now();
  setState((s) => {
    const day = { ...(s.logs[date] ?? {}) };
    for (let h = start; h < end; h++) {
      const entry: HourLog = { categoryId, loggedAt: now };
      if (note?.trim()) entry.note = note.trim();
      day[h] = entry;
    }
    return { ...s, logs: { ...s.logs, [date]: day } };
  });
}

export function clearHour(date: string, hour: number) {
  setState((s) => {
    const day = { ...(s.logs[date] ?? {}) };
    delete day[hour];
    return { ...s, logs: { ...s.logs, [date]: day } };
  });
}

export function updateSettings(patch: Partial<Settings>) {
  setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
}

export function updateProfile(patch: Partial<Profile>) {
  setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
}

/** Show the intro again (keeps all logs). */
export function replayOnboarding() {
  setState((s) => ({ ...s, onboarded: false }));
}

export function completeOnboarding() {
  setState((s) => ({ ...s, onboarded: true }));
}

/** Returns false if this notification response was already handled. */
export function markResponseHandled(key: string): boolean {
  if (state.handledResponses.includes(key)) return false;
  setState((s) => ({
    ...s,
    // Keep the list short; old keys can never come back.
    handledResponses: [...s.handledResponses, key].slice(-200),
  }));
  return true;
}

export function resetAll() {
  setState(() => ({ ...initialState }));
}
