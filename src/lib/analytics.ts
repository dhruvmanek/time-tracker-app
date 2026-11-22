// Product analytics with PostHog: where people drop off in onboarding, how many
// start a trial, and how they actually use check-ins.
//
// Setup: put the PostHog project API key (starts with "phc_") in app.json under
// expo.extra.posthogKey, and expo.extra.posthogHost if the project is in the EU
// (https://eu.i.posthog.com). With no key, every call here does nothing.
//
// Privacy: events are anonymous. We never send what people type (details) or
// their quiz free text, only categories and counts.

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import PostHog from 'posthog-react-native';

type Extra = { posthogKey?: string; posthogHost?: string } | undefined;
const extra = Constants.expoConfig?.extra as Extra;
const KEY = extra?.posthogKey ?? '';
const HOST = extra?.posthogHost || 'https://us.i.posthog.com';

export const posthog: PostHog | null =
  KEY && Platform.OS !== 'web'
    ? new PostHog(KEY, { host: HOST, captureAppLifecycleEvents: true, personProfiles: 'identified_only' })
    : null;

type Props = Record<string, string | number | boolean | null | undefined>;

export function track(event: Event, props?: Props) {
  if (!posthog) {
    if (__DEV__) console.log('[analytics]', event, props ?? '');
    return;
  }
  const clean: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(props ?? {})) if (v !== undefined && v !== null) clean[k] = v;
  posthog.capture(event, clean);
}

export function trackScreen(path: string) {
  posthog?.screen(path);
}

/** Anonymous id, shared with RevenueCat so revenue can be matched to behaviour. */
export function analyticsId(): string | null {
  return posthog ? posthog.getDistinctId() : null;
}

/** Every event we send, in one place. */
export type Event =
  | 'onboarding_step_viewed'
  | 'onboarding_completed'
  | 'paywall_viewed'
  | 'paywall_plan_selected'
  | 'trial_started'
  | 'subscribed'
  | 'purchase_cancelled'
  | 'purchase_failed'
  | 'restore_tapped'
  | 'checkin_logged'
  | 'checkin_detail_added'
  | 'mascot_tapped'
  | 'day_opened'
  | 'insights_viewed'
  | 'notification_opened';
