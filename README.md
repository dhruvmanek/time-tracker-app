# Tikk ⏳

Tikk is an iPhone app that asks you what you did every hour, then shows where your time really goes.
Tikk is a little alarm-clock critter living in its own world. Focused hours keep it charged and the
meadow sunny. Hours lost to scrolling drain its energy and turn the world dusky and wilted.

Built with [Expo](https://expo.dev) (React Native + TypeScript), so it can be built and published **without a Mac**.

## What works now (v0.2)

- **Hourly check-ins**: repeating notifications during your waking hours. Long-press one and tap a category button to log it.
- **Check-in screen**: pick a category for one or more hours, with an optional note.
- **Home**: Tikk in its world, a big energy %, today's focus/drain stats, level and streak, and a button for hours you haven't logged.
- **One-tap check-in**: your usual activities on top. Tapping one logs it instantly and shows a "+XP" reward screen.
- **Day**: the full hour-by-hour timeline, with arrows to look back at past days.
- **Insights**: focus score, biggest time sink, time per category, and a 7-day chart with your "danger hours".
- **Game rules**: +10 XP per logged hour, +5 for logging on time, a streak for every day with 4+ hours logged. Energy starts at 80% each day: +6 per focus hour, −12 per drain hour. Tikk earns a star badge at level 4 and a crown at level 8.
- **Settings**: day start/end, check-in every 1h or 2h, test notification.
- All data stays on the phone.

## Where things live

| Folder / file | What it is |
|---|---|
| `src/app/` | Screens. Every file is a screen (`(tabs)/index.tsx` = Today). |
| `src/components/tikk.tsx` | The Tikk character and its moods |
| `src/components/scene.tsx` | Tikk's world (changes with its mood) |
| `src/components/tab-bar.tsx` | Bottom bar with the raised Log button |
| `src/lib/stats.ts` | Game rules: XP, levels, streaks, mood |
| `src/lib/notifications.ts` | Check-in notifications |
| `src/lib/categories.ts` | The activity categories (names, emoji, colours) |
| `src/constants/theme.ts` | Colours, fonts and the sticker style |

## Running it from Windows (one-time setup)

1. Install **Node.js LTS** from https://nodejs.org and **Git** from https://git-scm.com.
2. Open **PowerShell** and run:
   ```
   git clone https://github.com/dhruvmanek/time-tracker-app.git
   cd time-tracker-app
   npm install
   ```

### Quick preview on your iPhone (Expo Go)

1. Install **Expo Go** from the App Store on your iPhone.
2. On your laptop run `npx expo start` and scan the QR code with the iPhone camera.
   The phone and laptop must be on the same Wi-Fi. If it doesn't connect, run `npx expo start --tunnel`.

Notification buttons may not behave exactly as in the real app inside Expo Go. Use TestFlight (below) to test those.

### Real app on your iPhone (TestFlight)

Needs an Apple Developer account ($99/year, https://developer.apple.com/programs/).

```
npm install -g eas-cli
eas login
eas build --platform ios --profile production --auto-submit
```

EAS builds the app on Expo's Macs and uploads it to App Store Connect.
When it finishes, install the **TestFlight** app on your iPhone and open Tikk from there.

## Roadmap

- [x] Week 1: check-ins, notifications, timeline, insights, XP/streaks, placeholder Tikk
- [x] Week 2: Brain Rot-inspired redesign: alarm-clock Tikk, living world, one-tap check-in, reward screen
- [ ] Next: polish from real-life use, morning intentions (planned vs. actual), unlockable worlds
- [ ] Week 3: illustrated and animated Tikk (Rive), more evolutions and unlockables
- [ ] Week 4: subscriptions (RevenueCat), paywall, analytics (PostHog), App Store listing
