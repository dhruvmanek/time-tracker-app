import Constants from 'expo-constants';
import * as StoreReview from 'expo-store-review';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { Body, Card, Heading, Small, Title } from '@/components/ui';
import {
  APP_STORE_ID,
  MANAGE_SUBSCRIPTION_URL,
  SUPPORT_EMAIL,
  SUPPORT_URL,
} from '@/constants/links';
import { C, F, R, S, sticker } from '@/constants/theme';
import { useCheckInsOn } from '@/hooks/use-checkins-on';
import { enableCheckIns, rescheduleAll } from '@/lib/notifications';
import { manageSubscription, restore } from '@/lib/purchases';
import { checkInHours } from '@/lib/stats';
import { resetAll, updateSettings, useAppState } from '@/lib/store';
import { formatHour } from '@/lib/time';

export default function SettingsScreen() {
  const { settings } = useAppState();
  const insets = useSafeAreaInsets();
  const ringing = useCheckInsOn();
  const [restoring, setRestoring] = useState(false);

  // Re-schedule whenever the check-in settings change.
  useEffect(() => {
    rescheduleAll();
  }, [settings.dayStart, settings.dayEnd, settings.interval, settings.notificationsOn]);

  const count = checkInHours(settings).length;
  const open = (url: string) => WebBrowser.openBrowserAsync(url);

  const toggleCheckIns = async (on: boolean) => {
    if (!on) return updateSettings({ notificationsOn: false });
    const ok = await enableCheckIns();
    updateSettings({ notificationsOn: ok || Platform.OS === 'web' });
  };

  const rate = async () => {
    if (APP_STORE_ID) {
      Linking.openURL(`itms-apps://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`);
    } else if (await StoreReview.isAvailableAsync()) {
      StoreReview.requestReview();
    }
  };

  const feedback = () => {
    if (SUPPORT_EMAIL) Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Tikko feedback')}`);
    else open(SUPPORT_URL);
  };

  // Apple's own subscription sheet, inside the app. Falls back to the web page only if it can't open.
  const onManage = async () => {
    if (!(await manageSubscription())) open(MANAGE_SUBSCRIPTION_URL);
  };

  const onRestore = async () => {
    setRestoring(true);
    const ok = await restore();
    setRestoring(false);
    Alert.alert(ok ? 'All set' : 'Nothing to restore', ok ? 'Your subscription is active.' : 'We couldn’t find a Tikko subscription for this Apple ID.');
  };

  const erase = () => {
    if (Platform.OS === 'web') return resetAll();
    Alert.alert('Erase all your data?', 'All check-ins, details and streaks will be deleted. Your subscription stays active.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Erase', style: 'destructive', onPress: resetAll },
    ]);
  };

  return (
    <ScrollView
      style={{ backgroundColor: C.bg }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + S.sm, paddingBottom: TAB_BAR_HEIGHT + insets.bottom + S.lg },
      ]}>
      <Title>Settings</Title>

      <Card style={{ gap: S.md }}>
        <Heading>Check-ins</Heading>
        <View style={styles.row}>
          <Body>Hourly check-ins</Body>
          <Switch value={ringing} trackColor={{ true: C.accent }} onValueChange={toggleCheckIns} />
        </View>
        {settings.notificationsOn && !ringing && (
          <Small style={{ color: C.drain }}>
            Notifications are turned off for Tikko in your iPhone Settings, so Tikko can’t ring. Tap the switch to fix it.
          </Small>
        )}
        <HourStepper
          label="Day starts"
          value={settings.dayStart}
          min={4}
          max={settings.dayEnd - 2}
          onChange={(v) => updateSettings({ dayStart: v })}
        />
        <HourStepper
          label="Day ends"
          value={settings.dayEnd}
          min={settings.dayStart + 2}
          max={24}
          onChange={(v) => updateSettings({ dayEnd: v })}
        />
        <View style={styles.row}>
          <Body>Ask every</Body>
          <View style={styles.segment}>
            {([1, 2] as const).map((n) => (
              <Pressable
                key={n}
                onPress={() => updateSettings({ interval: n })}
                style={[styles.segItem, settings.interval === n && styles.segActive]}>
                <Text style={styles.segText}>{n}h</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Small>
          Tikko will check in {count} times a day, from {formatHour(settings.dayStart + settings.interval)} to{' '}
          {settings.dayEnd === 24 ? 'midnight' : formatHour(settings.dayEnd)}, then send your recap.
        </Small>
      </Card>

      <Card style={{ paddingVertical: 4 }}>
        <Row label="Manage subscription" onPress={onManage} />
        <Row label={restoring ? 'Restoring…' : 'Restore purchases'} onPress={onRestore} last />
      </Card>

      <Card style={{ paddingVertical: 4 }}>
        <Row label="Rate Tikko ⭐" onPress={rate} />
        <Row label="Send feedback" onPress={feedback} />
        <Row label="Privacy policy" onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })} />
        <Row label="Terms of use" onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })} last />
      </Card>

      <Card style={{ paddingVertical: 4 }}>
        <Row label="Erase all data" onPress={erase} danger last />
      </Card>

      <Small style={{ textAlign: 'center' }}>
        Tikko v{Constants.expoConfig?.version ?? '1.0.0'} · Your check-ins are stored only on this iPhone.
      </Small>
    </ScrollView>
  );
}

function Row({ label, onPress, danger, last }: { label: string; onPress: () => void; danger?: boolean; last?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.linkRow, !last && styles.divider, pressed && { opacity: 0.6 }]}>
      <Text style={[styles.linkText, danger && { color: C.drain }]}>{label}</Text>
      {!danger && <Text style={styles.chevron}>›</Text>}
    </Pressable>
  );
}

function HourStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.row}>
      <Body>{label}</Body>
      <View style={styles.stepper}>
        <Pressable disabled={value <= min} onPress={() => onChange(value - 1)} style={styles.stepBtn}>
          <Text style={[styles.stepText, value <= min && { opacity: 0.3 }]}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>{value === 24 ? 'Midnight' : formatHour(value)}</Text>
        <Pressable disabled={value >= max} onPress={() => onChange(value + 1)} style={styles.stepBtn}>
          <Text style={[styles.stepText, value >= max && { opacity: 0.3 }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: S.md, gap: S.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  segment: { flexDirection: 'row', backgroundColor: C.cardAlt, borderRadius: R.pill, padding: 3 },
  segItem: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: R.pill },
  segActive: { backgroundColor: C.card, ...sticker },
  segText: { fontFamily: F.bold, color: C.ink },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 22, fontFamily: F.bold, color: C.ink, marginTop: -2 },
  stepValue: { width: 80, textAlign: 'center', fontFamily: F.bold, color: C.ink },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.faint },
  linkText: { fontFamily: F.medium, fontSize: 16, color: C.ink },
  chevron: { fontFamily: F.medium, fontSize: 22, color: C.faint, marginTop: -2 },
});
