import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Tikk } from '@/components/tikk';
import { Body, Button, Card, Small, Title } from '@/components/ui';
import { C, S } from '@/constants/theme';
import { requestPermission, rescheduleAll } from '@/lib/notifications';
import { completeOnboarding, updateSettings } from '@/lib/store';
import type { Mood } from '@/lib/types';

const STEPS: { mood: Mood; title: string; body: string }[] = [
  {
    mood: 'happy',
    title: 'Meet Tikk',
    body: 'Tikk is made of sand from your hours. Every hour you spend leaves a little grain behind.',
  },
  {
    mood: 'radiant',
    title: 'A quick check-in every hour',
    body: 'Tikk asks what you just did. Long-press the notification and tap a button. It takes 2 seconds.',
  },
  {
    mood: 'melty',
    title: 'Tikk feels your day',
    body: 'Focused hours make Tikk glow. Hours lost to scrolling make it melt. Honest logs always earn XP.',
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const insets = useSafeAreaInsets();
  const last = step === STEPS.length;

  const finish = async () => {
    const granted = await requestPermission();
    updateSettings({ notificationsOn: granted });
    completeOnboarding();
    await rescheduleAll();
    router.replace('/');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + S.lg, paddingBottom: insets.bottom + S.md }]}>
      <View style={styles.dots}>
        {[...STEPS, null].map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.center}>
        <Tikk mood={last ? 'happy' : STEPS[step].mood} size={220} bounceKey={step} />
        {last ? (
          <>
            <Title style={styles.text}>Ready when you are</Title>
            <Body style={styles.text}>
              Tikk will check in every hour from 9 AM to 11 PM. You can change this anytime in Settings.
            </Body>
            <Card style={{ alignSelf: 'stretch' }}>
              <Small style={{ textAlign: 'center' }}>
                Next, iOS will ask to allow notifications. Tap “Allow”, or Tikk can’t check in.
              </Small>
            </Card>
          </>
        ) : (
          <>
            <Title style={styles.text}>{STEPS[step].title}</Title>
            <Body style={styles.text}>{STEPS[step].body}</Body>
          </>
        )}
      </View>

      <Button label={last ? 'Turn on check-ins' : 'Continue'} onPress={last ? finish : () => setStep(step + 1)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, paddingHorizontal: S.lg, justifyContent: 'space-between' },
  dots: { flexDirection: 'row', gap: 6, alignSelf: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.faint },
  dotActive: { width: 24, backgroundColor: C.ink },
  center: { alignItems: 'center', gap: S.md },
  text: { textAlign: 'center' },
});
