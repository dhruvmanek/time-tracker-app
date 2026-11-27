# Tikko: current status

The single source of truth for what is live right now. Update it whenever a version or
over-the-air (OTA) update ships, or prices, keywords or links change. For history, see
`CHANGELOG.md`.

_Last updated: 2026-11-27_

## Live versions
| | |
|---|---|
| App Store version | **1.0.1** (iOS) |
| Last OTA update | **2026-11-27** to channel `production` (runtime version 1.0.1): "Rate Tikko" opens the App Store review page; gettikko.com links |
| OTA reaches | 1.0.1 builds only. Version 1.0 has no OTA support |
| Bundle ID / Apple ID | `com.dhruvmanek.tikk` / `6835830059` |

## Prices (RevenueCat entitlement `premium`, offering `default`)
| Plan | Product ID | Price | Trial |
|---|---|---|---|
| Yearly | `tikko_premium_yearly` | $39.99/year | 3 days free (new subscribers) |
| Monthly | `tikko_premium_monthly` | $4.99/month | none |

Hard paywall: the app can't be used without a subscription or trial. Offer codes can be
redeemed from "Have a code?" on the paywall.

## App Store listing (English, U.S.)
- **Name:** Tikko: Hourly Time Tracker
- **Subtitle:** Focus & Habit Check-ins
- **Keywords:** `productivity,screen,distraction,log,diary,journal,procrastination,routine,detox,adhd,study,audit`
- **Spanish (Mexico) keywords:** `tiempo,productividad,hábitos,rutina,enfoque,pantalla,registro,horas,diario,estudio,planificador`
- **Category:** Productivity (secondary: Health & Fitness)
- Full listing text and screenshots: `docs/app-store.md`, `docs/store/screenshots/`

## Links
- Privacy policy: https://gettikko.com/privacy
- Support: https://gettikko.com/support
- Terms of use: Apple standard EULA, https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
- Support email: tikko.app.help@gmail.com
- App Store: https://apps.apple.com/app/id6835830059

## Analytics and subscriptions
- PostHog (US host): onboarding funnel, check-ins, paywall and trial events. Acquisition source is `heard_from` on `onboarding_completed`.
- RevenueCat: subscriptions; the acquisition source is saved as **Media source**; linked to PostHog via `$posthogUserId`.
