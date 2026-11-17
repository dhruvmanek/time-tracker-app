import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Scene, SCENE_PANEL, timeOfDay } from '@/components/scene';
import { TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { Tikko } from '@/components/tikko';
import { BigNumber, Button, ProgressBar } from '@/components/ui';
import { C, F, R, S } from '@/constants/theme';
import { CATEGORY_PROPS } from '@/lib/categories';
import { onCelebrate } from '@/lib/celebrate';
import {
  activeWorld,
  energyFor,
  levelInfo,
  MOOD_LINES,
  moodForEnergy,
  pendingRange,
  recentActivity,
  stageForLevel,
  streak,
  summarize,
  totalXp,
} from '@/lib/stats';
import { useAppState } from '@/lib/store';
import { dateKey, formatRange } from '@/lib/time';

export default function HomeScreen() {
  const state = useAppState();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const now = useNow();
  const [bounce, setBounce] = useState(0);
  useEffect(() => onCelebrate(() => setBounce((n) => n + 1)), []);

  const today = dateKey(now);
  const pending = pendingRange(state, now);
  const summary = summarize([state.logs[today]]);
  const energy = energyFor(summary);
  const mood = moodForEnergy(energy);
  const world = activeWorld(state);
  const time = timeOfDay(now);
  const night = time === 'night';
  const recent = recentActivity(state, now);
  const prop = recent ? CATEGORY_PROPS[recent] : undefined;
  const [bubble, setBubble] = useState<string | null>(null);
  const [cheer, setCheer] = useState(false);

  // Tap Tikko: it jumps, rings and says something.
  const poke = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBounce((n) => n + 1);
    const lines = pending ? PENDING_LINES : LINES[mood];
    setBubble(lines[Math.floor(Math.random() * lines.length)]);
    setCheer(true);
  };
  useEffect(() => {
    if (!bubble) return;
    const t = setTimeout(() => {
      setBubble(null);
      setCheer(false);
    }, 2600);
    return () => clearTimeout(t);
  }, [bubble]);
  const lvl = levelInfo(totalXp(state));
  const days = streak(state, now);
  const barColor = energy >= 60 ? C.good : energy >= 40 ? C.warn : C.drain;

  return (
    <View style={{ flex: 1 }}>
      <Scene mood={mood} world={world} time={time} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + S.sm, paddingBottom: TAB_BAR_HEIGHT + insets.bottom + S.lg },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>⭐ {lvl.level}</Text>
          </View>
          <Text style={[styles.logo, night && { color: '#FFFFFF' }]}>TIKKO</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🔥 {days}</Text>
          </View>
        </View>

        <Pressable onPress={poke} style={styles.tikk} accessibilityRole="button" accessibilityLabel="Tap Tikko">
          <Tikko
            mood={mood}
            pose={cheer && !prop ? 'cheer' : 'idle'}
            prop={prop}
            stage={stageForLevel(lvl.level)}
            size={Math.min(210, width * 0.52)}
            bounceKey={bounce}
          />
          {bubble && (
            <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(200)} style={styles.bubble}>
              <Text style={styles.bubbleText}>{bubble}</Text>
              <View style={styles.bubbleTail} />
            </Animated.View>
          )}
        </Pressable>

        <BigNumber value={String(energy)} suffix="%" />
        <Text style={styles.moodLine}>{MOOD_LINES[mood]}</Text>
        <View style={{ paddingHorizontal: S.sm }}>
          <ProgressBar value={energy / 100} color={barColor} />
        </View>

        <View style={styles.stats}>
          <Stat bg={SCENE_PANEL} icon="🎯" value={`${summary.focus}h`} label="Focus" />
          <Stat bg={SCENE_PANEL} icon="🌀" value={`${summary.drain}h`} label="Drain" />
          <Stat bg={SCENE_PANEL} icon="✅" value={`${summary.logged}h`} label="Logged" />
        </View>

        {pending ? (
          <Button
            variant="light"
            label={`🔔 Log ${formatRange(pending.start, pending.end)}`}
            onPress={() =>
              router.push({
                pathname: '/check-in',
                params: { date: today, start: String(pending.start), end: String(pending.end) },
              })
            }
          />
        ) : (
          <View style={[styles.caughtUp, { backgroundColor: SCENE_PANEL }]}>
            <Text style={styles.caughtUpText}>✨ All caught up. Tikko will ring at the next hour.</Text>
          </View>
        )}

        <View style={[styles.xpRow, { backgroundColor: SCENE_PANEL }]}>
          <Text style={styles.xpText}>Level {lvl.level}</Text>
          <View style={{ flex: 1 }}>
            <ProgressBar value={lvl.xpIntoLevel / lvl.xpForLevel} color={C.sand} height={14} />
          </View>
          <Text style={styles.xpText}>
            {lvl.xpIntoLevel}/{lvl.xpForLevel} XP
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const LINES: Record<string, string[]> = {
  radiant: ['Ding ding! We’re on fire 🔥', 'Best. Day. Ever.', 'Keep this up and I’ll get a crown 👑'],
  happy: ['Tick tock, looking good!', 'Hehe, that tickles!', 'One hour at a time 💪'],
  meh: ['I’m running a bit slow…', 'A focused hour would cheer me up', 'Wind me up a little?'],
  drained: ['So… much… scrolling…', 'My battery is low 🪫', 'Help me recharge? One focused hour!'],
};
const PENDING_LINES = ['Psst! You haven’t logged your last hour', 'Ring ring! What did you just do?', 'Tell me about your last hour ⏰'];

function Stat({ bg, icon, value, label }: { bg: string; icon: string; value: string; label: string }) {
  return (
    <View style={[styles.stat, { backgroundColor: bg }]}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

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
  content: { paddingHorizontal: S.md, gap: S.md - 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontFamily: F.display, fontSize: 30, color: C.ink, letterSpacing: 1.5 },
  badge: {
    minWidth: 64,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: R.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  badgeText: { fontFamily: F.display, fontSize: 18, color: C.ink },
  tikk: { alignItems: 'center', marginTop: S.sm },
  bubble: {
    position: 'absolute',
    top: -6,
    zIndex: 2,
    maxWidth: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: R.md,
    borderWidth: 3,
    borderColor: C.ink,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bubbleText: { fontFamily: F.bold, fontSize: 14.5, color: C.ink, textAlign: 'center' },
  bubbleTail: {
    position: 'absolute',
    bottom: -9,
    alignSelf: 'center',
    width: 14,
    height: 14,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: C.ink,
    transform: [{ rotate: '45deg' }],
  },
  moodLine: {
    fontFamily: F.bold,
    fontSize: 17,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
    marginTop: -S.md,
  },
  stats: { flexDirection: 'row', gap: S.sm, marginTop: S.xs },
  stat: { flex: 1, alignItems: 'center', borderRadius: R.md, paddingVertical: 10 },
  statValue: { fontFamily: F.display, fontSize: 22, color: '#FFFFFF', marginTop: 2 },
  statLabel: { fontFamily: F.semibold, fontSize: 12.5, color: 'rgba(255,255,255,0.92)' },
  caughtUp: { borderRadius: R.md, padding: 14, alignItems: 'center' },
  caughtUpText: { fontFamily: F.semibold, fontSize: 15, color: '#FFFFFF', textAlign: 'center' },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, borderRadius: R.md, padding: 10 },
  xpText: { fontFamily: F.semibold, fontSize: 13, color: '#FFFFFF' },
});
