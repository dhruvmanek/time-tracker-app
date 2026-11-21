import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Small, Title } from '@/components/ui';
import { C, F, R, S, sticker } from '@/constants/theme';
import { CATEGORIES, DEFAULT_QUICK_IDS, getCategory } from '@/lib/categories';
import { recordLog } from '@/lib/log';
import { pendingRange, topCategoryIds } from '@/lib/stats';
import { clearHour, getState, useAppState } from '@/lib/store';
import { dateKey, formatHour, formatRange } from '@/lib/time';
import type { Category } from '@/lib/types';

export default function CheckInScreen() {
  const params = useLocalSearchParams<{ date?: string; start?: string; end?: string }>();
  const insets = useSafeAreaInsets();
  const state = useAppState();

  // Default to the unlogged stretch before now, or the last hour.
  const h = new Date().getHours();
  const fallback = pendingRange(getState()) ?? { start: Math.max(0, h - 1), end: Math.max(1, h) };
  const date = params.date ?? dateKey();
  const end = params.end ? Number(params.end) : fallback.end;
  const [start, setStart] = useState(params.start ? Number(params.start) : fallback.start);
  const [note, setNote] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);

  const day = state.logs[date] ?? {};
  const existing = end - start === 1 ? day[start] : undefined;
  const previous = day[start - 1];
  const minStart = Math.max(state.settings.dayStart, end - 6, 0);

  const usualIds = topCategoryIds(state, DEFAULT_QUICK_IDS).slice(0, 3);
  const usuals = usualIds.map(getCategory);
  const others = CATEGORIES.filter((c) => !usualIds.includes(c.id));

  const log = (categoryId: string) => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const result = recordLog(date, start, end, categoryId, note);
    router.replace({ pathname: '/reward', params: result });
  };

  return (
    <ScrollView
      style={{ backgroundColor: C.bg }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + S.lg }]}
      keyboardShouldPersistTaps="handled">
      <View style={styles.grabber} />
      <Title style={{ fontSize: 30 }}>What did you do?</Title>

      <View style={styles.rangeRow}>
        <Stepper label="‹" disabled={start <= minStart} onPress={() => setStart(start - 1)} />
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.range}>{formatRange(start, end)}</Text>
          <Small>{end - start === 1 ? '1 hour · tap once to log' : `${end - start} hours · tap once to log`}</Small>
        </View>
        <Stepper label="›" disabled={start >= end - 1} onPress={() => setStart(start + 1)} />
      </View>

      <Text style={styles.section}>Your usuals</Text>
      <View style={styles.grid}>
        {usuals.map((c) => (
          <Tile key={c.id} category={c} big selected={existing?.categoryId === c.id} onPress={() => log(c.id)} />
        ))}
      </View>

      <Text style={styles.section}>Everything else</Text>
      <View style={styles.grid}>
        {others.map((c) => (
          <Tile key={c.id} category={c} selected={existing?.categoryId === c.id} onPress={() => log(c.id)} />
        ))}
      </View>

      <View style={styles.extras}>
        {previous && (
          <Pressable style={styles.extra} onPress={() => log(previous.categoryId)}>
            <Text style={styles.extraText} numberOfLines={1}>
              ⏪ Same as before ({getCategory(previous.categoryId).emoji})
            </Text>
          </Pressable>
        )}
        <Pressable style={styles.extra} onPress={() => setNoteOpen((o) => !o)}>
          <Text style={styles.extraText}>✏️ {noteOpen ? 'Hide note' : 'Add a note'}</Text>
        </Pressable>
      </View>

      {noteOpen && (
        <TextInput
          autoFocus
          value={note}
          onChangeText={setNote}
          placeholder="e.g. “YouTube rabbit hole”. Then tap an activity."
          placeholderTextColor={C.sub}
          style={styles.input}
        />
      )}

      {existing && (
        <Pressable
          style={{ alignSelf: 'center', padding: S.sm }}
          onPress={() => {
            clearHour(date, start);
            router.back();
          }}>
          <Text style={[styles.extraText, { color: C.drain }]}>Clear {formatHour(start)}</Text>
        </Pressable>
      )}
      <Small style={{ textAlign: 'center' }}>Every honest check-in counts, even the scrolling ones.</Small>
    </ScrollView>
  );
}

function Tile({
  category: c,
  onPress,
  big,
  selected,
}: {
  category: Category;
  onPress: () => void;
  big?: boolean;
  selected?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: C.card },
        big && { paddingVertical: 16 },
        selected && { borderColor: C.accent, borderWidth: 2, backgroundColor: C.accentSoft },
        pressed && { transform: [{ translateY: 3 }], shadowOffset: { width: 0, height: 1 } },
      ]}>
      <Text style={{ fontSize: big ? 32 : 26 }}>{c.emoji}</Text>
      <Text style={styles.tileText} numberOfLines={2}>
        {c.name}
      </Text>
    </Pressable>
  );
}

function Stepper({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.stepper, disabled && { opacity: 0.3 }]}>
      <Text style={styles.stepperText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: S.md, gap: S.sm + 2 },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: C.faint, marginBottom: S.xs },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: S.sm,
    ...sticker,
  },
  range: { fontFamily: F.display, fontSize: 24, color: C.ink },
  stepper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: { fontFamily: F.bold, fontSize: 26, color: C.ink, marginTop: -3 },
  section: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.sub,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: S.xs,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  tile: {
    width: '31.6%',
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 4,
    gap: 2,
    ...sticker,
  },
  tileText: { fontFamily: F.semibold, fontSize: 13, color: C.ink, textAlign: 'center' },
  extras: { flexDirection: 'row', gap: S.sm, marginTop: S.xs },
  extra: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: R.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.faint,
  },
  extraText: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
  input: {
    backgroundColor: C.card,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    paddingVertical: 13,
    fontSize: 16,
    fontFamily: F.medium,
    color: C.ink,
    borderWidth: 2,
    borderColor: C.ink,
  },
});
