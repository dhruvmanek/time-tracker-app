import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Scene, SCENES } from '@/components/scene';
import { TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { Tikk } from '@/components/tikk';
import { BigNumber, Button, ProgressBar } from '@/components/ui';
import { C, F, R, S } from '@/constants/theme';
import { onCelebrate } from '@/lib/celebrate';
import {
  energyFor,
  levelInfo,
  MOOD_LINES,
  moodForEnergy,
  pendingRange,
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
  const summary = summarize([state.logs[today]]);
  const energy = energyFor(summary);
  const mood = moodForEnergy(energy);
  const scene = SCENES[mood];
  const lvl = levelInfo(totalXp(state));
  const days = streak(state, now);
  const pending = pendingRange(state, now);
  const barColor = energy >= 60 ? C.good : energy >= 40 ? C.warn : C.drain;

  return (
    <View style={{ flex: 1 }}>
      <Scene mood={mood} />
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
          <Text style={styles.logo}>TIKK</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🔥 {days}</Text>
          </View>
        </View>

        <View style={styles.tikk}>
          <Tikk mood={mood} stage={stageForLevel(lvl.level)} size={Math.min(210, width * 0.52)} bounceKey={bounce} />
        </View>

        <BigNumber value={String(energy)} suffix="%" />
        <Text style={styles.moodLine}>{MOOD_LINES[mood]}</Text>
        <View style={{ paddingHorizontal: S.sm }}>
          <ProgressBar value={energy / 100} color={barColor} />
        </View>

        <View style={styles.stats}>
          <Stat bg={scene.panel} icon="🎯" value={`${summary.focus}h`} label="Focus" />
          <Stat bg={scene.panel} icon="🌀" value={`${summary.drain}h`} label="Drain" />
          <Stat bg={scene.panel} icon="✅" value={`${summary.logged}h`} label="Logged" />
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
          <View style={[styles.caughtUp, { backgroundColor: scene.panel }]}>
            <Text style={styles.caughtUpText}>✨ All caught up. Tikk will ring at the next hour.</Text>
          </View>
        )}

        <View style={[styles.xpRow, { backgroundColor: scene.panel }]}>
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
