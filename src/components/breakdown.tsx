import { StyleSheet, Text, View } from 'react-native';

import { C, F, R, S } from '@/constants/theme';
import { getCategory } from '@/lib/categories';
import type { Category } from '@/lib/types';
import type { DaySummary } from '@/lib/stats';

/** Bars use only three colours: focus, other and distracted. */
const KIND_COLOR: Record<Category['kind'], string> = { focus: C.focus, neutral: C.neutral, drain: C.drain };
const KIND_ORDER: Category['kind'][] = ['focus', 'neutral', 'drain'];

/** A single stacked bar showing how the logged hours split between focus, other and distracted. */
export function StackedBar({ summary }: { summary: DaySummary }) {
  if (summary.logged === 0) {
    return <View style={[styles.stack, { backgroundColor: C.cardAlt }]} />;
  }
  const byKind = { focus: 0, neutral: 0, drain: 0 };
  for (const { id, hours } of summary.byCategory) byKind[getCategory(id).kind] += hours;
  return (
    <View style={styles.stack}>
      {KIND_ORDER.filter((k) => byKind[k] > 0).map((k) => (
        <View key={k} style={{ flex: byKind[k], backgroundColor: KIND_COLOR[k] }} />
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
              <View style={[styles.fill, { width: `${(hours / max) * 100}%`, backgroundColor: KIND_COLOR[cat.kind] }]} />
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
