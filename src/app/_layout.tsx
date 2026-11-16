import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { CelebrationToast } from '@/components/toast';
import { C } from '@/constants/theme';
import { getCategory } from '@/lib/categories';
import { celebrate } from '@/lib/celebrate';
import { listenForResponses, rescheduleAll } from '@/lib/notifications';
import { ON_TIME_BONUS, XP_PER_HOUR } from '@/lib/stats';
import { useAppState, useHydrated } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrated = useHydrated();
  const { onboarded } = useAppState();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    SplashScreen.hideAsync();
    if (!onboarded && segments[0] !== 'onboarding') {
      router.replace('/onboarding');
    }
  }, [hydrated, onboarded, segments, router]);

  // Refresh scheduled check-ins (and their quick buttons) each launch.
  useEffect(() => {
    if (hydrated && onboarded) rescheduleAll();
  }, [hydrated, onboarded]);

  useEffect(
    () =>
      listenForResponses((categoryId, hours) => {
        const c = getCategory(categoryId);
        celebrate(`${c.emoji} Logged ${hours}h · +${hours * (XP_PER_HOUR + ON_TIME_BONUS)} XP`);
      }),
    [],
  );

  if (!hydrated) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="check-in" options={{ presentation: 'modal' }} />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      </Stack>
      <CelebrationToast />
    </View>
  );
}
