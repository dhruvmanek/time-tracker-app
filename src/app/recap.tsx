// "Your day with Tikko": the end-of-day recap.

import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Tikko } from '@/components/tikko';
import { Button } from '@/components/ui';
import { C, F, R, S, sticker } from '@/constants/theme';
import { track } from '@/lib/analytics';
import { getCategory } from '@/lib/categories';
import { buildRecap, recapDate } from '@/lib/recap';
import { maybeAskAfterGoodDay } from '@/lib/review';
import { rateDay, useAppState } from '@/lib/store';
import { formatHour, formatRange } from '@/lib/time';

const FEELINGS = ['😞', '😐', '🙂', '😄', '🤩'];

export default function RecapScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const state = useAppState();
  const insets = useSafeAreaInsets();
  const date = params.date ?? recapDate(state);
  const recap = useMemo(() => buildRecap(state, date), [state, date]);
  const rating = state.dayRatings?.[date];
  const { summary } = recap;
  const { dayStart, dayEnd } = state.settings;

  useEffect(() => {
    track('recap_viewed', { suggestion: recap.suggestion.type, logged: recap.summary.logged });
    // Only once per screen open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [y, m, d] = date.split('-').map(Number);
  const label = new Date(y, m - 1, d)
    .toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })
    .toUpperCase();
  const delta = recap.focusPct !== null && recap.avgFocusPct !== null ? recap.focusPct - recap.avgFocusPct : null;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + S.sm, paddingBottom: insets.bottom + S.lg }]}
        showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.close} hitSlop={10} accessibilityLabel="Close">
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        <Text style={styles.date}>{label}</Text>
        <Text style={styles.title}>Your day with Tikko</Text>
        <View style={{ alignItems: 'center' }}>
          <Tikko mood={recap.mood} pose={recap.mood === 'radiant' ? 'cheer' : 'idle'} size={170} />
        </View>
        <Text style={styles.verdict}>{recap.verdict}</Text>

        {summary.logged > 0 && (
          <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.label}>FOCUS SCORE</Text>
                <Text style={styles.big}>{recap.focusPct}%</Text>
              </View>
              {delta !== null && (
                <Text style={styles.small}>
                  <Text style={{ color: delta >= 0 ? C.focus : C.drain, fontFamily: F.bold }}>
                    {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}%
                  </Text>{' '}
                  vs your 7-day average
                </Text>
              )}
            </View>
            <View style={styles.bar}>
              {summary.focus > 0 && <View style={{ flex: summary.focus, backgroundColor: C.focus }} />}
              {summary.neutral > 0 && <View style={{ flex: summary.neutral, backgroundColor: C.neutral }} />}
              {summary.drain > 0 && <View style={{ flex: summary.drain, backgroundColor: C.drain }} />}
            </View>
            <View style={styles.legend}>
              <Legend color={C.focus} label={`${summary.focus}h focus`} />
              <Legend color={C.neutral} label={`${summary.neutral}h other`} />
              <Legend color={C.drain} label={`${summary.drain}h distracted`} />
            </View>
          </Animated.View>
        )}

        {recap.sink && (
          <Animated.View entering={FadeInDown.delay(180)}>
            <Fact
              icon={getCategory(recap.sink.categoryId).emoji}
              label="BIGGEST TIME SINK"
              title={`${getCategory(recap.sink.categoryId).name} · ${recap.sink.hours}h`}
              sub={recap.sink.detail ? `Mostly ${recap.sink.detail}` : undefined}
            />
          </Animated.View>
        )}

        {recap.best && (
          <Animated.View entering={FadeInDown.delay(260)}>
            <Fact
              icon="🏆"
              label="BEST STRETCH"
              title={formatRange(recap.best.start, recap.best.end)}
              sub={`${recap.best.end - recap.best.start} focused hours in a row${recap.best.detail ? `: ${recap.best.detail}` : ''}`}
            />
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(340)} style={[styles.card, styles.tip]}>
          <Text style={[styles.label, { color: C.accent }]}>💡 ONE IDEA FOR TOMORROW</Text>
          <Text style={styles.tipHead}>{recap.suggestion.headline}</Text>
          <Text style={styles.tipText}>{recap.suggestion.tip}</Text>
        </Animated.View>

        <View style={styles.card}>
          <Text style={styles.label}>HOUR BY HOUR</Text>
          <View style={[styles.bar, { height: 22 }]}>
            {Array.from({ length: dayEnd - dayStart }, (_, i) => {
              const log = state.logs[date]?.[dayStart + i];
              const kind = log ? getCategory(log.categoryId).kind : null;
              const bg = kind === 'focus' ? C.focus : kind === 'neutral' ? C.neutral : kind === 'drain' ? C.drain : C.empty;
              return <View key={i} style={{ flex: 1, backgroundColor: bg }} />;
            })}
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.time}>{formatHour(dayStart)}</Text>
            <Text style={styles.time}>{dayEnd === 24 ? '12 AM' : formatHour(dayEnd)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How did today feel?</Text>
          <Text style={styles.small}>Over time, Tikko shows which kinds of days feel best.</Text>
          <View style={styles.feelings}>
            {FEELINGS.map((f, i) => {
              const on = rating === i + 1;
              return (
                <Pressable
                  key={f}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                    rateDay(date, i + 1);
                    track('day_rated', { rating: i + 1 });
                    // Only the first rating of the day can trigger the App Store prompt.
                    if (!rating) setTimeout(() => maybeAskAfterGoodDay(i + 1), 900);
                  }}
                  style={[styles.feeling, on && styles.feelingOn]}
                  accessibilityLabel={`Rate ${i + 1} of 5`}>
                  <Text style={{ fontSize: 26 }}>{f}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Fact
          icon="🔥"
          label="STREAK"
          title={recap.streak === 1 ? '1-day streak' : `${recap.streak}-day streak`}
          sub={
            recap.due > 0
              ? summary.logged >= recap.due
                ? `${summary.logged} of ${recap.due} hours logged. Perfect!`
                : `${summary.logged} of ${recap.due} hours logged`
              : undefined
          }
        />

        <Button label="Good night, Tikko 🌙" onPress={() => router.back()} style={{ marginTop: S.xs }} />
      </ScrollView>
    </View>
  );
}

function Fact({ icon, label, title, sub }: { icon: string; label: string; title: string; sub?: string }) {
  return (
    <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
      <Text style={{ fontSize: 28 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
        {sub ? <Text style={styles.small}>{sub}</Text> : null}
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: color }} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: S.md + 2, gap: 12 },
  close: {
    alignSelf: 'flex-end',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontFamily: F.semibold, fontSize: 15, color: C.sub },
  date: { fontFamily: F.semibold, fontSize: 12.5, color: C.sub, textAlign: 'center', letterSpacing: 0.5, marginTop: -S.sm },
  title: { fontFamily: F.display, fontSize: 26, color: C.ink, textAlign: 'center' },
  verdict: { fontFamily: F.semibold, fontSize: 16, color: C.ink, textAlign: 'center' },
  card: { ...sticker, backgroundColor: C.card, borderRadius: R.md, padding: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  label: { fontFamily: F.semibold, fontSize: 11.5, color: C.sub, letterSpacing: 0.5 },
  big: { fontFamily: F.display, fontSize: 24, color: C.ink, marginTop: 2 },
  small: { fontFamily: F.regular, fontSize: 13.5, color: C.sub, marginTop: 2 },
  cardTitle: { fontFamily: F.semibold, fontSize: 15.5, color: C.ink, marginTop: 2 },
  bar: { flexDirection: 'row', height: 14, borderRadius: R.pill, overflow: 'hidden', gap: 2, marginTop: 10 },
  legend: { flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' },
  legendText: { fontFamily: F.semibold, fontSize: 13, color: C.ink },
  tip: { backgroundColor: C.accentSoft, borderColor: '#CDEBE7' },
  tipHead: { fontFamily: F.semibold, fontSize: 15.5, color: C.ink, marginTop: 6, lineHeight: 21 },
  tipText: { fontFamily: F.regular, fontSize: 14, color: '#4B4F57', marginTop: 4, lineHeight: 20 },
  time: { fontFamily: F.medium, fontSize: 11.5, color: C.sub, marginTop: 5 },
  feelings: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  feeling: {
    width: 56,
    height: 50,
    borderRadius: 14,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feelingOn: { borderWidth: 2, borderColor: C.accent, backgroundColor: C.accentSoft },
});
