# Tikko ⏳

Tikko is an iPhone app that asks what you did every hour, then shows where your time really goes.
Tikko is a little alarm-clock mascot whose mood follows your day.

Built with [Expo](https://expo.dev) (React Native + TypeScript), so it can be built and published without a Mac.

## Features

- **Hourly check-ins:** notifications during your waking hours with one-tap buttons
  (your 3 most-used activities + "Something else…").
- **Today (Home):** Tikko asks about the hour you haven't logged; one button logs it;
  your day as a single strip. Tap Tikko and it waves in its current mood.
- **Check-in:** 14 activities; after logging, an optional detail ("Which app?").
- **Your day:** hour-by-hour timeline with past days.
- **Insights:** focus score, biggest time sink (and what it mostly was), time per activity,
  7-day chart, danger hours.
- **End-of-day recap:** notification after your last check-in; focus vs your week,
  time sink, best stretch, one suggestion for tomorrow, "How did today feel?", streak.
- **Onboarding:** short quiz, "years of your life" moment, hold to wind up Tikko.
- **Subscriptions:** hard paywall with a 3-day free trial (yearly $39.99 / monthly $4.99)
  via RevenueCat; trial-ending reminder.
- **Analytics:** anonymous PostHog events (never what you type).
- **Ratings:** asks for an App Store rating at a happy moment.
- All check-ins stay on the phone.

## Where things live

| Folder / file | What it is |
|---|---|
| `src/app/` | Screens. Every file is a screen (`(tabs)/index.tsx` = Today). |
| `src/components/tikko.tsx` | The mascot: poses, moods and animation |
| `assets/mascot/` | Mascot pose images (see `docs/mascot.md`) |
| `src/lib/categories.ts` | Activities, their colours, Tikko's pose and detail question |
| `src/lib/stats.ts` | Streaks, moods and the numbers behind Insights |
| `src/lib/recap.ts` | End-of-day recap and its suggestion rules |
| `src/lib/notifications.ts` | Check-in, recap and trial notifications |
| `src/lib/purchases.ts` | Subscriptions (RevenueCat) |
| `src/lib/analytics.ts` | Analytics events (PostHog) |
| `src/constants/theme.ts` | Colours, fonts, spacing |
| `src/constants/links.ts` | Support, privacy and App Store links |
| `docs/app-store.md` | App Store listing and ASO |

## Running it from Windows

```
git pull
npm install
npx expo start --tunnel
```

Scan the QR code with the iPhone camera (Expo Go). Purchases and notification buttons only
work in a real build:

```
eas build --platform ios --profile production --auto-submit
```

Then open Tikko from TestFlight.
