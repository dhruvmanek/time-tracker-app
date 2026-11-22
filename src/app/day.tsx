import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StackedBar } from '@/components/breakdown';
import { Timeline } from '@/components/timeline';
import { Card, Heading, Small, Title } from '@/components/ui';
import { C, F, S } from '@/constants/theme';
import { track } from '@/lib/analytics';
import { summarize } from '@/lib/stats';
import { useAppState } from '@/lib/store';
import { addDays, dateKey } from '@/lib/time';

export default function DayScreen() {
  const state = useAppState();
  const insets = useSafeAreaInsets();
  const [offset, setOffset] = useState(0); // 0 = today, -1 = yesterday, ...
  useEffect(() => {
    track('day_opened', { days_ago: -offset });
  }, [offset]);
  const now = new Date();
  const date = addDays(now, offset);
  const key = dateKey(date);
  const day = state.logs[key] ?? {};
  const summary = summarize([day]);
  const isToday = offset === 0;

  const label = isToday
    ? 'Today'
    : offset === -1
      ? 'Yesterday'
      : date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <ScrollView
      style={{ backgroundColor: C.bg }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + S.sm, paddingBottom: insets.bottom + S.lg },
      ]}>
      <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Back">
        <Text style={styles.arrowText}>‹</Text>
      </Pressable>
      <Title>Your day</Title>

      <View style={styles.dateRow}>
        <Pressable onPress={() => setOffset(offset - 1)} style={styles.arrow} disabled={offset <= -29}>
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <Text style={styles.dateLabel}>{label}</Text>
        <Pressable onPress={() => setOffset(offset + 1)} style={[styles.arrow, isToday && { opacity: 0.25 }]} disabled={isToday}>
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>

      <Card style={{ gap: S.sm }}>
        <Heading>{summary.logged}h logged</Heading>
        <Small>
          {summary.focus}h focus · {summary.neutral}h other · {summary.drain}h scrolling & distractions
        </Small>
        <StackedBar summary={summary} />
      </Card>

      <Card style={{ gap: S.md }}>
        <Heading>Hour by hour</Heading>
        <Timeline
          day={day}
          dayStart={state.settings.dayStart}
          dayEnd={state.settings.dayEnd}
          currentHour={isToday ? now.getHours() : 24}
          onPressHour={(h) =>
            router.push({ pathname: '/check-in', params: { date: key, start: String(h), end: String(h + 1) } })
          }
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: S.md, gap: S.md },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { fontFamily: F.medium, fontSize: 26, color: C.ink, marginTop: -3 },
  dateLabel: { fontFamily: F.display, fontSize: 22, color: C.ink },
});
