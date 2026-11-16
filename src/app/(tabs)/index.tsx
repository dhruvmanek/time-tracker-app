import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StackedBar } from '@/components/breakdown';
import { Tikk } from '@/components/tikk';
import { Timeline } from '@/components/timeline';
import { Body, Button, Card, Chip, Heading, ProgressBar, Small, Title } from '@/components/ui';
import { C, S } from '@/constants/theme';
import { onCelebrate } from '@/lib/celebrate';
import {
  levelInfo,
  MOOD_LINES,
  moodFor,
  pendingRange,
  stageForLevel,
  streak,
  summarize,
  totalXp,
} from '@/lib/stats';
import { useAppState } from '@/lib/store';
import { dateKey, formatRange } from '@/lib/time';

export default function TodayScreen() {
  const state = useAppState();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const [bounce, setBounce] = useState(0);
  useEffect(() => onCelebrate(() => setBounce((n) => n + 1)), []);

  const today = dateKey(now);
  const day = state.logs[today] ?? {};
  const summary = summarize([day]);
  const mood = moodFor(summary);
  const xp = totalXp(state);
  const lvl = levelInfo(xp);
  const days = streak(state, now);
  const pending = pendingRange(state, now);
  const { dayStart, dayEnd } = state.settings;

  const openCheckIn = (start: number, end: number) =>
    router.push({ pathname: '/check-in', params: { date: today, start: String(start), end: String(end) } });

  return (
    <ScrollView
      style={{ backgroundColor: C.bg }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + S.sm }]}>
      <View style={styles.header}>
        <Title>Today</Title>
        <View style={styles.chips}>
          <Chip tone="fire" label={`🔥 ${days}`} />
          <Chip tone="level" label={`Lv ${lvl.level}`} />
        </View>
      </View>

      <Card style={styles.hero}>
        <Tikk mood={mood} stage={stageForLevel(lvl.level)} size={190} bounceKey={bounce} />
        <Body style={styles.moodLine}>{MOOD_LINES[mood]}</Body>
        <View style={styles.xpRow}>
          <Small>Level {lvl.level}</Small>
          <Small>
            {lvl.xpIntoLevel} / {lvl.xpForLevel} XP
          </Small>
        </View>
        <View style={{ alignSelf: 'stretch' }}>
          <ProgressBar value={lvl.xpIntoLevel / lvl.xpForLevel} />
        </View>
      </Card>

      {pending ? (
        <Button label={`Check in · ${formatRange(pending.start, pending.end)}`} onPress={() => openCheckIn(pending.start, pending.end)} />
      ) : (
        <Card style={styles.caughtUp}>
          <Body style={{ fontWeight: '700' }}>✨ All caught up</Body>
          <Small>Tikk will ask again at the next check-in.</Small>
        </Card>
      )}

      <Card style={{ gap: S.sm }}>
        <View style={styles.summaryHead}>
          <Heading>Your day so far</Heading>
          <Small>
            {summary.logged}h logged · {summary.focus}h focus · {summary.drain}h drain
          </Small>
        </View>
        <StackedBar summary={summary} />
      </Card>

      <Card style={{ gap: S.md }}>
        <Heading>Timeline</Heading>
        <Timeline
          day={day}
          dayStart={dayStart}
          dayEnd={dayEnd}
          currentHour={now.getHours()}
          onPressHour={(h) => openCheckIn(h, h + 1)}
        />
      </Card>
    </ScrollView>
  );
}

/** Re-render every minute so "pending" and the timeline stay current. */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const styles = StyleSheet.create({
  content: { padding: S.md, gap: S.md, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chips: { flexDirection: 'row', gap: S.sm },
  hero: { alignItems: 'center', gap: S.sm, paddingVertical: S.lg },
  moodLine: { textAlign: 'center', fontWeight: '600', marginBottom: S.sm },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch' },
  caughtUp: { alignItems: 'center', gap: 4 },
  summaryHead: { gap: 2 },
});
