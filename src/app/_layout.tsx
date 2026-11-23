import {
  Fredoka_400Regular,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { router, Stack, usePathname, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { C } from '@/constants/theme';
import { listenForResponses, rescheduleAll } from '@/lib/notifications';
import { trackScreen } from '@/lib/analytics';
import { initPurchases } from '@/lib/purchases';
import { useAppState, useHydrated } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrated = useHydrated();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });
  const ready = hydrated && (fontsLoaded || !!fontError);
  const { onboarded, premium } = useAppState();
  const segments = useSegments();
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) trackScreen(pathname);
  }, [pathname]);

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync();
    if (!onboarded && segments[0] !== 'onboarding') {
      router.replace('/onboarding');
    } else if (onboarded && !premium && segments[0] !== 'paywall') {
      // Hard paywall: after onboarding, the app needs an active trial or subscription.
      router.replace('/paywall');
    }
  }, [ready, onboarded, premium, segments]);

  useEffect(() => {
    if (hydrated) initPurchases();
  }, [hydrated]);

  // Refresh scheduled check-ins (and their quick buttons) each launch.
  useEffect(() => {
    if (hydrated && onboarded) rescheduleAll();
  }, [hydrated, onboarded]);

  // Logging from a notification button opens the reward screen.
  useEffect(() => listenForResponses((reward) => router.push({ pathname: '/reward', params: reward })), []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="check-in" options={{ presentation: 'modal' }} />
        <Stack.Screen name="day" />
        <Stack.Screen name="recap" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="reward"
          options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }}
        />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="paywall" options={{ gestureEnabled: false, animation: 'fade' }} />
      </Stack>
    </View>
  );
}
