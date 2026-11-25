/** How an activity affects Tikko. Focus feeds it, drain makes it melt, neutral does neither. */
export type CategoryKind = 'focus' | 'neutral' | 'drain';

export type Category = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  kind: CategoryKind;
};

/** One logged hour, e.g. 14:00–15:00 was "Deep work". */
export type HourLog = {
  categoryId: string;
  note?: string;
  /** When the user logged it (ms). Used to reward on-time check-ins. */
  loggedAt: number;
};

/** All logs for one day, keyed by hour of day (0–23). */
export type DayLog = Record<number, HourLog>;

export type Settings = {
  /** First hour Tikko asks about (e.g. 8 = 8 AM). */
  dayStart: number;
  /** Hour the day ends (e.g. 23 = last check-in at 11 PM, covering 10–11 PM). */
  dayEnd: number;
  /** Check-in every 1 or 2 hours. */
  interval: 1 | 2;
  notificationsOn: boolean;
};

/** Answers from the onboarding quiz. Used to personalise the app. */
export type Profile = {
  goal?: string;
  /** Category ids of the user's biggest time sinks (e.g. 'scroll', 'tv'). */
  sinks?: string[];
  persona?: string;
  /** Where they heard about Tikko (e.g. 'tiktok'). */
  heardFrom?: string;
  ageGroup?: string;
  /** Self-estimated hours lost per day. */
  hoursLost?: number;
  /** What they'd do with time won back (e.g. 'Learning'). */
  dream?: string;
};

export type AppState = {
  onboarded: boolean;
  /** Has an active subscription or trial (cached from RevenueCat, so it works offline). */
  premium: boolean;
  /** When we last asked for an App Store rating (ms). */
  reviewAskedAt?: number;
  /** How each day felt (1–5), keyed by date, from the evening recap. */
  dayRatings?: Record<string, number>;
  profile: Profile;
  settings: Settings;
  /** Logs keyed by local date "YYYY-MM-DD". */
  logs: Record<string, DayLog>;
  /** Notification responses already processed, so a tap is never counted twice. */
  handledResponses: string[];
};

export type Mood = 'drained' | 'meh' | 'happy' | 'radiant';
