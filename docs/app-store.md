# Tikko: App Store listing and ASO

Copy each field into **App Store Connect → your app → App Information** (name,
subtitle, category) and the **version page** (promotional text, description,
keywords, screenshots, URLs). Character counts are checked against Apple's limits.

## How App Store search works (short version)
- **Only three fields are searched:** the **name**, the **subtitle** and the hidden
  **keywords** field. The description is *not* used for ranking on the App Store.
- Words in the name count the most, then the subtitle, then keywords.
- **Never repeat a word** across those three fields; it wastes space. Apple combines
  them, so "time" in the name plus "tracker" in the name already covers "time tracker".
- After launch, ranking mostly depends on **downloads, ratings and how many people who
  see the listing actually install** (the icon and first two screenshots do that work).

---

## English (U.S.): primary language

**Name** (26/30)
```
Tikko: Hourly Time Tracker
```

**Subtitle** (23/30)
```
Focus & Habit Check-ins
```

**Keywords** (99/100). Commas, no spaces, no words already in the name or subtitle.
```
productivity,screen,distraction,planner,diary,journal,procrastination,routine,detox,adhd,study,work
```

**Promotional text** (153/170). Can be changed any time without a new app version.
```
Where did your day go? Tikko checks in every hour, you answer in one tap, and at night you see exactly where your time went. Start your 3-day free trial.
```

**Description**
```
Ever reach the end of the day and wonder where it went? Tikko helps you find out, one hour at a time.

Every hour, Tikko (a little alarm clock with a lot of heart) asks a simple question: what did you just do? Press and hold the notification, tap your answer, done. Two seconds. At night, you see exactly where your time went, so you can spend tomorrow on what matters.

HOW IT WORKS
• Hourly check-ins during your waking hours. Choose every 1 or 2 hours.
• Log in one tap, straight from the notification.
• Add a quick detail if you like: which app, which project, who with.
• See your whole day hour by hour, and look back at past days.

YOUR EVENING RECAP
• Every night, Tikko sums up your day: focus score compared with your week, your biggest time sink and your best focused stretch.
• Get one simple, personal idea for tomorrow, based on your own patterns.
• Rate how the day felt and keep your streak going.

SEE WHERE YOUR TIME REALLY GOES
• Focus score: how much of your day went to deep work, learning, exercise and other things that matter.
• Biggest time sink: find out what pulls you away, and which app it usually is.
• Danger hours: the times of day you most often lose to scrolling.
• 7-day trends to see if you're getting better.

MEET TIKKO
Tikko feels your day. Focused hours keep it happy; hours lost to scrolling leave it tired and drained. Tap it and it waves back. Every honest check-in counts, even the scrolling ones, and builds your streak.

BUILT FOR
• Anyone who feels busy but not productive
• Students, founders, freelancers and remote workers
• People trying to cut screen time, beat procrastination or build better habits
• Anyone with ADHD who wants a gentle, low-effort way to stay aware of time

PRIVATE BY DESIGN
Your check-ins and the details you type are stored on your iPhone. No account, no ads.

TIKKO PREMIUM
Tikko requires a subscription. Choose yearly ($39.99, includes a 3-day free trial for new subscribers) or monthly ($4.99). Payment is charged to your Apple ID when you confirm the purchase, or when the free trial ends. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel anytime in your Apple ID settings. Prices may vary by country.

Terms of Use: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Privacy Policy: https://github.com/dhruvmanek/time-tracker-app/blob/main/PRIVACY.md
```

**What's New** (first version)
```
Welcome to Tikko! Hourly check-ins, one-tap logging, your day hour by hour, insights and an evening recap. We'd love your feedback: tikko.app.help@gmail.com
```

**URLs**
- Privacy Policy URL: `https://github.com/dhruvmanek/time-tracker-app/blob/main/PRIVACY.md`
- Support URL: your Google Sites support page (it shows tikko.app.help@gmail.com)

**Category**
- Primary: **Productivity**
- Secondary: **Health & Fitness**

**Age rating:** answer "None" to every question → 4+.

---

## Extra keywords for free: Spanish (Mexico)
The U.S. App Store also searches the **Spanish (Mexico)** listing, so adding it gives you
a second 100-character keyword field (and reaches Spanish speakers in the U.S. and Mexico).
In App Store Connect, add the language **Spanish (Mexico)** and fill in:

- **Name** (25/30): `Tikko: Control del Tiempo`
- **Subtitle** (27/30): `Registro por hora y enfoque`
- **Keywords** (95/100): `tiempo,productividad,hábitos,rutina,enfoque,pantalla,registro,horas,diario,estudio,planificador`
- **Description:** copy the English one for now (or ask for a translation).

## Screenshots
Five screenshots in four iPhone sizes, in `docs/store/screenshots/`:

| Folder | Size | Use for |
|---|---|---|
| `6.9-inch_1320x2868` | 1320×2868 | Large iPhones (6.9"/"large display") |
| `6.7-inch_1290x2796` | 1290×2796 | 6.7"/6.5" iPhones |
| `6.3-inch_1206x2622` | 1206×2622 | "iPhone with Dynamic Island (medium display)" |
| `6.1-inch_1179x2556` | 1179×2556 | 6.1" iPhones |

Upload `tikko_1.png` … `tikko_5.png` in order into the slot whose size matches. Apple
scales them down for smaller devices. The first two show in search results.

## Ratings
The app asks for a rating at a happy moment: after a check-in, once someone has logged
20+ hours and is on a 3-day streak. Apple decides when to actually show it (at most 3
times a year). Ratings and reviews are one of the strongest ranking signals.

## After launch
- Check **App Store Connect → App Analytics** weekly: impressions, product page views,
  conversion rate.
- Change the **promotional text** freely to test messages.
- Revisit keywords after 2–4 weeks: keep the words you rank for, swap the rest.
- Never use other apps' names (e.g. competitors) in keywords; Apple rejects that.
