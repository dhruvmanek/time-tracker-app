import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Scene } from '@/components/scene';
import { Tikko } from '@/components/tikko';
import { Body, Button, Card, Small } from '@/components/ui';
import { C, F, S } from '@/constants/theme';
import { requestPermission, rescheduleAll } from '@/lib/notifications';
import { completeOnboarding, updateSettings } from '@/lib/store';
import type { Mood } from '@/lib/types';

const STEPS: { mood: Mood; title: string; body: string }[] = [
  {
    mood: 'happy',
    title: 'Meet Tikko',
    body: 'Tikko is your little time buddy. It ticks along with your day and feels every hour you spend.',
  },
  {
    mood: 'radiant',
    title: 'It rings every hour',
    body: '“What did you just do?” Long-press the notification and tap an answer. It takes 2 seconds.',
  },
  {
    mood: 'drained',
    title: 'Scrolling runs it down',
    body: 'Focused hours keep Tikko charged. Hours lost to scrolling drain it. Honest answers always earn XP.',
  },
  {
    mood: 'radiant',
    title: 'Ready to start?',
    body: 'Tikko will check in every hour from 9 AM to 11 PM. You can change this anytime in Settings.',
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const insets = useSafeAreaInsets();
  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  const finish = async () => {
    const granted = await requestPermission();
    updateSettings({ notificationsOn: granted });
    completeOnboarding();
    await rescheduleAll();
    router.replace('/');
  };

  return (
    <View style={{ flex: 1 }}>
      <Scene mood={current.mood} />
      <View style={[styles.container, { paddingTop: insets.top + S.md, paddingBottom: insets.bottom + S.md }]}>
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        <View style={{ alignItems: 'center', marginTop: S.xl }}>
          <Tikko mood={current.mood} size={240} bounceKey={step} />
        </View>

        <Animated.View key={step} entering={FadeIn.duration(250)} style={{ gap: S.md }}>
          <Card style={{ gap: S.sm, alignItems: 'center' }}>
            <Text style={styles.title}>{current.title}</Text>
            <Body style={{ textAlign: 'center' }}>{current.body}</Body>
            {last && (
              <Small style={{ textAlign: 'center' }}>
                Next, iOS will ask to allow notifications. Tap “Allow”, or Tikko can’t ring.
              </Small>
            )}
          </Card>
          <Button label={last ? 'Turn on check-ins' : 'Continue'} onPress={last ? finish : () => setStep(step + 1)} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: S.lg, justifyContent: 'space-between' },
  dots: { flexDirection: 'row', gap: 6, alignSelf: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 2, borderColor: C.ink },
  dotActive: { width: 28, backgroundColor: C.sand },
  title: { fontFamily: F.display, fontSize: 30, color: C.ink, textAlign: 'center' },
});
