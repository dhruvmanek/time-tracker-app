// Privacy policy and terms, shown inside the app (src/app/legal.tsx).
// Keep the privacy text in sync with PRIVACY.md, which is the public copy for App Store Connect.

export type LegalDoc = { title: string; updated: string; sections: { heading?: string; body: string[] }[] };

export const PRIVACY: LegalDoc = {
  title: 'Privacy policy',
  updated: 'November 2026',
  sections: [
    {
      body: ['Tikko is a time-tracking app. Your day stays on your phone. We only collect a small amount of anonymous usage data to improve the app.'],
    },
    {
      heading: 'Stored only on your iPhone',
      body: [
        'Your check-ins (which activity you did each hour), the details you type, your settings and your recaps are stored only on your iPhone. The details you type never leave your phone.',
        'Deleting the app deletes this data. You can also erase it any time in Settings → Erase all data.',
      ],
    },
    {
      heading: 'Anonymous usage analytics (PostHog)',
      body: [
        'We use PostHog to understand how Tikko is used. It receives, tied to a random ID (not your name or email):',
        '• How you use the app: screens opened, intro steps reached, taps on Tikko, notifications opened.',
        '• Check-ins: the type of activity you chose (for example "Deep work"), how many hours, and whether you added a detail (never the detail itself).',
        '• Your intro answers: your goal, what describes you, how many hours you think you lose, what you’d do with time back, and your time sinks. Your age is not sent.',
        '• How each day felt (the 1–5 rating in the evening recap).',
        '• Subscription events: viewing the paywall, the plan you chose, its price, and whether a trial started.',
        '• Basic device information: device model, iOS version, app version, language and time zone.',
        'PostHog is set to discard IP addresses.',
      ],
    },
    {
      heading: 'Subscriptions (Apple and RevenueCat)',
      body: [
        'Payments are handled by Apple; we never see your card details. Tikko uses RevenueCat to check whether your subscription is active. RevenueCat receives a random app user ID and your purchase history from Apple, but none of your check-ins.',
      ],
    },
    {
      heading: 'Notifications',
      body: ['Check-ins, the evening recap and the trial reminder are scheduled on your device. Their content never leaves your phone.'],
    },
    {
      heading: 'What we don’t do',
      body: ['No accounts, no ads, no tracking across other companies’ apps or websites, and no selling of data.'],
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
