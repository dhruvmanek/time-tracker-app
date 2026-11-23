import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryBars } from '@/components/breakdown';
import { Body, Card, Heading, Small, Title } from '@/components/ui';
import { TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { C, F, R, S, sticker } from '@/constants/theme';
import { track } from '@/lib/analytics';
import { getCategory } from '@/lib/categories';
import { drainByHour, summarize, topDetail } from '@/lib/stats';
import { useAppState } from '@/lib/store';
import { addDays, dateKey, formatRange, shortWeekday } from '@/lib/time';

type Range = 'today' | 'week';

export default function InsightsScreen() {
  const state = useAppState();
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<Range>('today');
  useEffect(() => {
    track('insights_viewed', { range });
  }, [range]);
  const now = new Date();
  const dayCount = range === 'today' ? 1 : 7;
  const dates = Array.from({ length: dayCount }, (_, i) => addDays(now, -i));
  const summary = summarize(dates.map((d) => state.logs[dateKey(d)]));
  const sink = summary.byCategory.find(({ id }) => getCategory(id).kind === 'drain');
  const sinkDetail = sink ? topDetail(dates.map((d) => state.logs[dateKey(d)]), sink.id) : null;
  const focusPct = summary.focusRatio === null ? null : Math.round(summary.focusRatio * 100);

  return (
    <ScrollView
      style={{ backgroundColor: C.bg }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + S.sm, paddingBottom: TAB_BAR_HEIGHT + insets.bottom + S.lg },
      ]}>
      <Title>Insights</Title>

      <View style={styles.segment}>
        {(['today', 'week'] as Range[]).map((r) => (
          <Pressable key={r} onPress={() => setRange(r)} style={[styles.segItem, range === r && styles.segActive]}>
            <Text style={[styles.segText, range === r && { color: C.ink }]}>
              {r === 'today' ? 'Today' : 'Last 7 days'}
            </Text>
          </Pressable>
        ))}
      </View>

      {summary.logged === 0 ? (
        <Card style={{ alignItems: 'center', gap: S.sm, paddingVertical: S.xl }}>
          <Text style={{ fontSize: 40 }}>⏳</Text>
          <Heading>No check-ins yet</Heading>
          <Small style={{ textAlign: 'center' }}>Log a few hours and Tikko will show you where your time goes.</Small>
        </Card>
      ) : (
        <>
          <View style={styles.statsRow}>
            <Stat label="Focus score" value={focusPct === null ? '–' : `${focusPct}%`} color={C.focus} />
            <Stat label="Hours logged" value={`${summary.logged}h`} color={C.ink} />
            <Stat label="Distracted" value={`${summary.drain}h`} color={C.drain} />
          </View>

          {sink && (
            <Card style={styles.sink}>
              <Text style={{ fontSize: 34 }}>{getCategory(sink.id).emoji}</Text>
              <View style={{ flex: 1 }}>
                <Small>Biggest time sink</Small>
                <Body style={{ fontFamily: F.bold }}>
                  {getCategory(sink.id).name}: {sink.hours}h
                </Body>
                <Small>
                  That’s {Math.round((sink.hours / summary.logged) * 100)}% of your logged time.
                </Small>
                {sinkDetail && (
                  <Small style={{ color: C.ink }}>
                    Mostly {sinkDetail.note} ({sinkDetail.hours}h)
                  </Small>
                )}
              </View>
            </Card>
          )}

          {range === 'week' && <WeekChart />}

          <Card style={{ gap: S.md }}>
            <Heading>Where your time went</Heading>
            <CategoryBars summary={summary} />
          </Card>

          {range === 'week' && <DangerHours />}
        </>
      )}
    </ScrollView>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Small>{label}</Small>
    </Card>
  );
}

/** Daily bars for the last 7 days, split into focus / neutral / drain. */
function WeekChart() {
  const state = useAppState();
  const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i - 6));
  const sums = days.map((d) => summarize([state.logs[dateKey(d)]]));
  const max = Math.max(1, ...sums.map((s) => s.logged));
  const BAR_H = 120;
  return (
    <Card style={{ gap: S.md }}>
      <Heading>Day by day</Heading>
      <View style={styles.chart}>
        {sums.map((s, i) => (
          <View key={i} style={styles.chartCol}>
            <View style={[styles.chartBar, { height: (s.logged / max) * BAR_H }]}>
              <View style={{ flex: s.drain, backgroundColor: C.drain }} />
              <View style={{ flex: s.neutral, backgroundColor: C.neutral }} />
              <View style={{ flex: s.focus, backgroundColor: C.focus }} />
            </View>
            <Small>{shortWeekday(days[i])}</Small>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <Legend color={C.focus} label="Focus" />
        <Legend color={C.neutral} label="Other" />
        <Legend color={C.drain} label="Distracted" />
      </View>
    </Card>
  );
}

/** The hours of day where you most often lose time. */
function DangerHours() {
  const state = useAppState();
  const worst = drainByHour(state, 7)
    .filter((h) => h.total >= 2 && h.drain > 0)
    .sort((a, b) => b.drain / b.total - a.drain / a.total)
    .slice(0, 3);
  if (worst.length === 0) return null;
  return (
    <Card style={{ gap: S.sm }}>
      <Heading>Danger hours</Heading>
      <Small>The hours where time slips away most often.</Small>
      {worst.map((h) => (
        <View key={h.hour} style={styles.dangerRow}>
          <Body style={{ fontFamily: F.bold }}>{formatRange(h.hour, h.hour + 1)}</Body>
          <Body style={{ color: C.drain, fontFamily: F.bold }}>{Math.round((h.drain / h.total) * 100)}% distracted</Body>
        </View>
      ))}
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Small>{label}</Small>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: S.md, gap: S.md },
  segment: { flexDirection: 'row', backgroundColor: C.cardAlt, borderRadius: R.pill, padding: 4 },
  segItem: { flex: 1, paddingVertical: 10, borderRadius: R.pill, alignItems: 'center' },
  segActive: { backgroundColor: C.card, ...sticker },
  segText: { fontFamily: F.bold, fontSize: 15, color: C.sub },
  statsRow: { flexDirection: 'row', gap: S.sm },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: S.sm },
  statValue: { fontFamily: F.display, fontSize: 28 },
  sink: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 145 },
  chartCol: { alignItems: 'center', gap: 6, flex: 1 },
  chartBar: { width: 22, borderRadius: 7, overflow: 'hidden', minHeight: 4, backgroundColor: C.cardAlt },
  legend: { flexDirection: 'row', gap: S.md, justifyContent: 'center' },
  dangerRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
