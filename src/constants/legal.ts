// Privacy policy and terms, shown inside the app (src/app/legal.tsx).
// Keep the privacy text in sync with PRIVACY.md, which is the public copy for App Store Connect.

export type LegalDoc = { title: string; updated: string; sections: { heading?: string; body: string[] }[] };

export const PRIVACY: LegalDoc = {
  title: 'Privacy policy',
  updated: 'November 2026',
  sections: [
    {
      body: ['Tikko is a time-tracking app. We built it to keep your data on your phone.'],
    },
    {
      heading: 'What Tikko stores',
      body: [
        'Your check-ins (which activity you did each hour, and any short detail you type), how each day felt, your settings and your answers to the intro questions.',
        'All of this is stored only on your iPhone. It is not sent to us or to anyone else, and deleting the app deletes it. You can also erase it any time in Settings → Erase all data.',
      ],
    },
    {
      heading: 'Notifications',
      body: ['Tikko schedules hourly check-ins and an evening recap on your device. They are created locally; no notification content leaves your phone.'],
    },
    {
      heading: 'Anonymous usage analytics',
      body: [
        'To improve Tikko, we use PostHog to collect anonymous usage events, such as which intro step you reached, whether you started a trial, and which activity category you logged (for example "Deep work").',
        'Events are tied to a random ID, not to your name or email. We never send what you type, such as the details you add to an hour. PostHog also receives basic device information (device model, iOS version, app version, language).',
      ],
    },
    {
      heading: 'Subscriptions',
      body: [
        'Purchases are handled by Apple. Tikko uses RevenueCat to check whether your subscription is active. RevenueCat receives an anonymous app user ID and your purchase receipts from Apple, but no check-in data.',
      ],
    },
    {
      heading: 'What we don’t do',
      body: ['No accounts, no tracking across other companies’ apps or websites, no ads, and no selling of data.'],
    },
    {
      heading: 'Contact',
      body: ['Questions? Email tikko.app.help@gmail.com.'],
    },
  ],
};

export const TERMS: LegalDoc = {
  title: 'Terms of use',
  updated: 'November 2026',
  sections: [
    {
      body: [
        'Tikko is licensed to you under Apple’s Standard End User License Agreement (EULA) for apps from the App Store. The key points about your subscription are below.',
      ],
    },
    {
      heading: 'Subscription',
      body: [
        'Tikko Premium is available as a yearly or monthly auto-renewing subscription. The yearly plan includes a free trial for new subscribers.',
        'Payment is charged to your Apple ID when you confirm the purchase, or when the free trial ends.',
        'Your subscription renews automatically unless you cancel at least 24 hours before the end of the current period. Your account is charged for renewal within 24 hours before the end of the current period.',
        'You can manage or cancel your subscription in Settings → Manage subscription, or in your Apple ID settings. Any unused part of a free trial ends when you buy a subscription.',
      ],
    },
    {
      heading: 'Using Tikko',
      body: [
        'Tikko helps you notice how you spend your time. It is not medical or professional advice.',
        'Your data stays on your device, so it can be lost if you delete the app or lose your phone.',
      ],
    },
    {
      heading: 'Contact',
      body: ['Questions? Email tikko.app.help@gmail.com.'],
    },
  ],
};
