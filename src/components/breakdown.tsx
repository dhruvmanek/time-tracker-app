import { StyleSheet, Text, View } from 'react-native';

import { C, F, R, S } from '@/constants/theme';
import { getCategory } from '@/lib/categories';
import type { DaySummary } from '@/lib/stats';

/** A single stacked bar showing how the logged hours split between categories. */
export function StackedBar({ summary }: { summary: DaySummary }) {
  if (summary.logged === 0) {
    return <View style={[styles.stack, { backgroundColor: C.cardAlt }]} />;
  }
  return (
    <View style={styles.stack}>
      {summary.byCategory.map(({ id, hours }) => (
        <View key={id} style={{ flex: hours, backgroundColor: getCategory(id).color }} />
      ))}
    </View>
  );
}

/** One horizontal bar per category, biggest first. */
export function CategoryBars({ summary }: { summary: DaySummary }) {
  const max = summary.byCategory[0]?.hours ?? 1;
  return (
    <View style={{ gap: S.sm + 2 }}>
      {summary.byCategory.map(({ id, hours }) => {
        const cat = getCategory(id);
        const pct = Math.round((hours / summary.logged) * 100);
        return (
          <View key={id} style={{ gap: 4 }}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>
                {cat.emoji} {cat.name}
              </Text>
              <Text style={styles.value}>
                {hours}h · {pct}%
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${(hours / max) * 100}%`, backgroundColor: cat.color }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { flexDirection: 'row', height: 20, borderRadius: R.pill, overflow: 'hidden', gap: 2 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 15, fontFamily: F.semibold, color: C.ink },
  value: { fontSize: 13.5, color: C.sub, fontFamily: F.semibold },
  track: { height: 12, borderRadius: R.pill, backgroundColor: C.cardAlt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: R.pill },
});
