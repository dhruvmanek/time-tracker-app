import Constants from 'expo-constants';
import { useEffect } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Body, Button, Card, Heading, Small, Title } from '@/components/ui';
import { TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { C, F, R, S, sticker } from '@/constants/theme';
import { requestPermission, rescheduleAll, sendTestNotification } from '@/lib/notifications';
import { checkInHours } from '@/lib/stats';
import { replayOnboarding, resetAll, updateSettings, useAppState } from '@/lib/store';
import { formatHour } from '@/lib/time';

export default function SettingsScreen() {
  const { settings } = useAppState();
  const insets = useSafeAreaInsets();

  // Re-schedule whenever the check-in settings change.
  useEffect(() => {
    rescheduleAll();
  }, [settings.dayStart, settings.dayEnd, settings.interval, settings.notificationsOn]);

  const count = checkInHours(settings).length;

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
          <Body>Reminders</Body>
          <Switch
            value={settings.notificationsOn}
            trackColor={{ true: C.accent }}
            onValueChange={async (on) => {
              if (on && !(await requestPermission()) && Platform.OS !== 'web') {
                Alert.alert('Notifications are off', 'Turn on notifications for Tikko in the iPhone Settings app.');
                return;
              }
              updateSettings({ notificationsOn: on });
            }}
          />
        </View>
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
          {settings.dayEnd === 24 ? 'midnight' : formatHour(settings.dayEnd)}.
        </Small>
        <Button label="Send a test notification" variant="light" onPress={sendTestNotification} />
        <Small>Arrives in 5 seconds. Lock your phone, then long-press it to see the quick-log buttons.</Small>
      </Card>

      <Card style={{ gap: S.sm }}>
        <Heading>Data</Heading>
        <Button label="Replay the intro" variant="light" onPress={replayOnboarding} />
        <Small>Everything is stored only on this iPhone.</Small>
        <Button
          label="Erase all data"
          variant="ghost"
          onPress={() => {
            if (Platform.OS === 'web') {
              resetAll();
              return;
            }
            Alert.alert('Erase everything?', 'All check-ins, XP and streaks will be deleted.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Erase', style: 'destructive', onPress: resetAll },
            ]);
          }}
        />
      </Card>

      <Small style={{ textAlign: 'center' }}>Tikko v{Constants.expoConfig?.version ?? '1.0.0'}</Small>
    </ScrollView>
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
});
