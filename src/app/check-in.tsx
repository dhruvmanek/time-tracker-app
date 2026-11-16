import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Small, Title } from '@/components/ui';
import { C, R, S } from '@/constants/theme';
import { CATEGORIES } from '@/lib/categories';
import { celebrate } from '@/lib/celebrate';
import { ON_TIME_BONUS, XP_PER_HOUR } from '@/lib/stats';
import { clearHour, logHours, useAppState } from '@/lib/store';
import { dateKey, formatHour, formatRange } from '@/lib/time';

export default function CheckInScreen() {
  const params = useLocalSearchParams<{ date?: string; start?: string; end?: string }>();
  const insets = useSafeAreaInsets();
  const state = useAppState();
  const date = params.date ?? dateKey();
  const end = Number(params.end ?? new Date().getHours());
  const [start, setStart] = useState(Number(params.start ?? end - 1));
  const existing = end - start === 1 ? state.logs[date]?.[start] : undefined;
  const [selected, setSelected] = useState<string | null>(existing?.categoryId ?? null);
  const [note, setNote] = useState(existing?.note ?? '');
  const minStart = Math.max(state.settings.dayStart, end - 6);

  const save = () => {
    if (!selected) return;
    logHours(date, start, end, selected, note);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const hours = end - start;
    const onTime = date === dateKey() && new Date().getHours() - end <= 1;
    celebrate(`Logged ${hours}h · +${hours * (XP_PER_HOUR + (onTime ? ON_TIME_BONUS : 0))} XP`);
    router.back();
  };

  return (
    <ScrollView
      style={{ backgroundColor: C.bg }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + S.lg }]}
      keyboardShouldPersistTaps="handled">
      <View style={styles.grabber} />
      <Title style={{ fontSize: 26 }}>What did you do?</Title>

      <View style={styles.rangeRow}>
        <Stepper label="‹" disabled={start <= minStart} onPress={() => setStart(start - 1)} />
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.range}>{formatRange(start, end)}</Text>
          <Small>{end - start === 1 ? '1 hour' : `${end - start} hours`}</Small>
        </View>
        <Stepper label="›" disabled={start >= end - 1} onPress={() => setStart(start + 1)} />
      </View>

      <View style={styles.grid}>
        {CATEGORIES.map((c) => {
          const active = selected === c.id;
          return (
            <Pressable
              key={c.id}
              onPress={() => {
                setSelected(c.id);
                if (Platform.OS !== 'web') Haptics.selectionAsync();
              }}
              style={[styles.tile, active && { borderColor: c.color, backgroundColor: c.color + '22' }]}>
              <Text style={styles.emoji}>{c.emoji}</Text>
              <Text style={styles.tileText} numberOfLines={2}>
                {c.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Add a note (optional), e.g. “YouTube rabbit hole”"
        placeholderTextColor={C.sub}
        style={styles.input}
        returnKeyType="done"
      />

      <Button label="Save" onPress={save} disabled={!selected} />
      {existing && (
        <Button
          label={`Clear ${formatHour(start)}`}
          variant="ghost"
          onPress={() => {
            clearHour(date, start);
            router.back();
          }}
        />
      )}
      <Small style={{ textAlign: 'center' }}>
        Honest logs earn the same XP as productive ones. Tikk only wants the truth.
      </Small>
    </ScrollView>
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
  content: { padding: S.md, gap: S.md - 4 },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: C.faint, marginBottom: S.sm },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: S.sm,
  },
  range: { fontSize: 22, fontWeight: '800', color: C.ink },
  stepper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: { fontSize: 24, fontWeight: '700', color: C.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  tile: {
    width: '31.5%',
    aspectRatio: 1.45,
    borderRadius: R.md,
    backgroundColor: C.card,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: S.xs,
    gap: 4,
  },
  emoji: { fontSize: 24 },
  tileText: { fontSize: 12, fontWeight: '600', color: C.ink, textAlign: 'center' },
  input: {
    backgroundColor: C.card,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    paddingVertical: 14,
    fontSize: 16,
    color: C.ink,
  },
});
