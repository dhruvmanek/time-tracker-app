// Home ("Today"): calm and focused. Tikko asks about the hour you haven't logged,
// one button answers it, and your day so far sits in a single strip below.

import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { Tikko } from '@/components/tikko';
import { Button } from '@/components/ui';
import { C, F, R, S, sticker } from '@/constants/theme';
import { getCategory } from '@/lib/categories';
import { track } from '@/lib/analytics';
import { onCelebrate } from '@/lib/celebrate';
import { energyFor, moodForEnergy, pendingRange, streak, summarize } from '@/lib/stats';
import { useAppState } from '@/lib/store';
import { dateKey, formatHour, formatRange } from '@/lib/time';
import type { DayLog, Mood } from '@/lib/types';

export default function HomeScreen() {
  const state = useAppState();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const now = useNow();
  const [bounce, setBounce] = useState(0);
  const [said, setSaid] = useState<string | null>(null);
  useEffect(() => onCelebrate(() => setBounce((n) => n + 1)), []);
  useEffect(() => {
    if (!said) return;
    const t = setTimeout(() => setSaid(null), 3000);
    return () => clearTimeout(t);
  }, [said]);

  const { dayStart, dayEnd } = state.settings;
  const today = dateKey(now);
  const day = state.logs[today] ?? {};
  const summary = summarize([day]);
  const mood = moodForEnergy(energyFor(summary));
  const pending = pendingRange(state, now);
  const hour = now.getHours();
  const asleep = !pending && (hour >= dayEnd || hour < dayStart);
  const days = streak(state, now);
  const due = Math.max(0, Math.min(hour, dayEnd) - dayStart);

  const question = pending
    ? `What did you do from ${formatRange(pending.start, pending.end).replace('–', ' to ')}?`
    : asleep
      ? 'That’s a wrap for today. See you in the morning!'
      : summaryLine(summary.logged, summary.focus, summary.drain, mood);

  const poke = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    track('mascot_tapped', { mood: homeMood(mood) });
    const lines = TAP_LINES[mood];
    setSaid(pickOne(lines));
  };

  return (
    <ScrollView
      style={{ backgroundColor: C.bg }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + S.sm, paddingBottom: TAB_BAR_HEIGHT + insets.bottom + S.lg },
      ]}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.date}>
            {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase()}
          </Text>
          <Text style={styles.greeting}>{greeting(hour)}</Text>
        </View>
        <View style={styles.streak} accessibilityLabel={`${days} day streak`}>
          <Text style={styles.streakText}>🔥 {days}</Text>
        </View>
      </View>

      <View style={styles.bubbleWrap}>
        <Animated.View key={said ?? question} entering={FadeIn.duration(200)} style={styles.bubble}>
          <Text style={styles.bubbleText} numberOfLines={2}>
            {said ?? question}
          </Text>
          <View style={styles.bubbleTail} />
        </Animated.View>
      </View>

      <Pressable onPress={poke} style={styles.tikko} accessibilityRole="button" accessibilityLabel="Tap Tikko">
        {/* Home shows just 3 moods: happy, tired, drained. Tap and Tikko waves. */}
        <Tikko
          mood={homeMood(mood)}
          pose={said ? 'wave' : 'idle'}
          size={Math.min(250, width * 0.62)}
          bounceKey={bounce}
        />
      </Pressable>

      {pending ? (
        <Button
          label={`Log ${formatRange(pending.start, pending.end)}`}
          onPress={() =>
            router.push({
              pathname: '/check-in',
              params: { date: today, start: String(pending.start), end: String(pending.end) },
            })
          }
        />
      ) : (
        <Button variant="light" label="See your whole day" onPress={() => router.push('/day')} />
      )}

      <Pressable onPress={() => router.push('/day')} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
        <View style={styles.cardHead}>
          <Text style={styles.cardLabel}>TODAY</Text>
          <Text style={styles.cardMeta}>
            {summary.logged} of {due} hours logged ›
          </Text>
        </View>
        <DayStrip day={day} dayStart={dayStart} dayEnd={dayEnd} hour={hour} />
        <View style={styles.times}>
          <Text style={styles.time}>{formatHour(dayStart)}</Text>
          {hour > dayStart && hour < dayEnd ? <Text style={styles.time}>Now</Text> : null}
          <Text style={styles.time}>{dayEnd === 24 ? '12 AM' : formatHour(dayEnd)}</Text>
        </View>
        <View style={styles.legend}>
          <Legend color={C.focus} label={`${summary.focus}h focus`} />
          <Legend color={C.neutral} label={`${summary.neutral}h other`} />
          <Legend color={C.drain} label={`${summary.drain}h scrolling`} />
        </View>
      </Pressable>
    </ScrollView>
  );
}

/** One small block per hour: coloured if logged, dashed if missed, pale if still ahead. */
function DayStrip({ day, dayStart, dayEnd, hour }: { day: DayLog; dayStart: number; dayEnd: number; hour: number }) {
  const blocks = [];
  for (let h = dayStart; h < dayEnd; h++) {
    const log = day[h];
    const kind = log ? getCategory(log.categoryId).kind : null;
    const missed = !log && h < hour;
    blocks.push(
      <View
        key={h}
        style={[
          styles.block,
          kind === 'focus' && { backgroundColor: C.focus },
          kind === 'neutral' && { backgroundColor: C.neutral },
          kind === 'drain' && { backgroundColor: C.drain },
          missed && styles.missed,
        ]}
      />,
    );
  }
  return <View style={styles.strip}>{blocks}</View>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Collapse the four internal moods into the three Home shows. */
function homeMood(m: Mood): Mood {
  return m === 'radiant' ? 'happy' : m;
}

function greeting(h: number) {
  if (h < 5) return 'Still up?';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function summaryLine(logged: number, focus: number, drain: number, mood: Mood) {
  if (logged === 0) return 'I’ll ring at the next hour. See you then!';
  if (mood === 'radiant') return `${focus}h of focus already. We’re on fire!`;
  if (mood === 'drained') return `${drain}h lost to scrolling. One focused hour?`;
  return `All caught up. ${logged}h logged so far.`;
}

// Tikko waves when tapped, so every line is a greeting.
const TAP_LINES: Record<Mood, string[]> = {
  radiant: ['Hi there! 👋', 'Hey! Great day so far!'],
  happy: ['Hi there! 👋', 'Hey! One hour at a time.'],
  meh: ['Hi! Hanging in there?', 'Hey! A focused hour would help.'],
  drained: ['Hi… rough day, huh?', 'Hey! Let’s win back the next hour.'],
};

/** Re-render every minute so the pending check-in stays current. */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: S.md + 4, gap: S.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: S.xs },
  date: { fontFamily: F.medium, fontSize: 12.5, color: C.sub, letterSpacing: 0.4 },
  greeting: { fontFamily: F.display, fontSize: 27, color: C.ink, marginTop: 2 },
  streak: { ...sticker, backgroundColor: C.card, borderRadius: R.pill, paddingVertical: 6, paddingHorizontal: 12 },
  streakText: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
  // Fixed height (room for 2 lines) so a longer line never pushes Tikko and the cards down.
  bubbleWrap: { alignItems: 'center', justifyContent: 'flex-end', height: 76, marginTop: S.sm },
  bubble: {
    ...sticker,
    backgroundColor: C.card,
    borderRadius: 18,
    paddingVertical: 11,
    paddingHorizontal: 16,
    maxWidth: 320,
  },
  bubbleText: { fontFamily: F.medium, fontSize: 16, color: C.ink, textAlign: 'center', lineHeight: 22 },
  bubbleTail: {
    position: 'absolute',
    bottom: -7,
    alignSelf: 'center',
    width: 13,
    height: 13,
    backgroundColor: C.card,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.line,
    transform: [{ rotate: '45deg' }],
  },
  tikko: { alignItems: 'center', marginTop: -S.xs, marginBottom: S.xs },
  card: { ...sticker, backgroundColor: C.card, borderRadius: R.lg, padding: S.md },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardLabel: { fontFamily: F.semibold, fontSize: 12, color: C.sub, letterSpacing: 0.6 },
  cardMeta: { fontFamily: F.medium, fontSize: 13, color: C.sub },
  strip: { flexDirection: 'row', gap: 3, marginTop: 12 },
  block: { flex: 1, height: 28, borderRadius: 6, backgroundColor: C.empty },
  missed: { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.neutral, borderStyle: 'dashed' },
  times: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  time: { fontFamily: F.medium, fontSize: 11.5, color: C.sub },
  legend: { flexDirection: 'row', gap: S.md, marginTop: 12, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 3 },
  legendText: { fontFamily: F.semibold, fontSize: 13.5, color: C.ink },
});
