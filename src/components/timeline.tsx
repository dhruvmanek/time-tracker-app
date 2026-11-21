import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C, F, R, S } from '@/constants/theme';
import { getCategory } from '@/lib/categories';
import { formatHour } from '@/lib/time';
import type { DayLog } from '@/lib/types';

type Props = {
  day: DayLog;
  dayStart: number;
  dayEnd: number;
  /** Hours at or after this are in the future (pass 24 for past days). */
  currentHour: number;
  onPressHour: (hour: number) => void;
};

/** One row per hour of the day, coloured by what you did. */
export function Timeline({ day, dayStart, dayEnd, currentHour, onPressHour }: Props) {
  const hours: number[] = [];
  for (let h = dayStart; h < dayEnd; h++) hours.push(h);

  return (
    <View style={{ gap: 6 }}>
      {hours.map((h) => {
        const log = day[h];
        const future = h >= currentHour;
        const cat = log ? getCategory(log.categoryId) : null;
        return (
          <Pressable
            key={h}
            disabled={future}
            onPress={() => onPressHour(h)}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
            <Text style={[styles.hour, future && { color: C.faint }]}>{formatHour(h)}</Text>
            {cat ? (
              <View style={[styles.block, { backgroundColor: cat.color + '26', borderColor: cat.color }]}>
                <Text style={styles.blockText} numberOfLines={1}>
                  {cat.emoji} {cat.name}
                </Text>
                {log?.note ? (
                  <Text style={styles.note} numberOfLines={2}>
                    {log.note}
                  </Text>
                ) : null}
              </View>
            ) : future ? (
              <View style={[styles.block, styles.future]} />
            ) : (
              <View style={[styles.block, styles.empty]}>
                <Text style={styles.emptyText}>Tap to fill in</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  hour: { width: 52, fontSize: 12.5, fontFamily: F.semibold, color: C.sub, textAlign: 'right' },
  block: {
    flex: 1,
    minHeight: 38,
    borderRadius: R.sm,
    borderLeftWidth: 5,
    paddingHorizontal: S.sm,
    paddingVertical: 7,
    justifyContent: 'center',
  },
  blockText: { fontSize: 14.5, fontFamily: F.semibold, color: C.ink },
  note: { fontFamily: F.regular, fontSize: 13.5, color: C.sub, marginTop: 1 },
  empty: { borderColor: C.faint, borderStyle: 'dashed', borderWidth: 1.5, borderLeftWidth: 1.5 },
  emptyText: { fontSize: 13, fontFamily: F.medium, color: C.sub },
  future: { backgroundColor: C.cardAlt, borderColor: 'transparent', opacity: 0.5 },
});
