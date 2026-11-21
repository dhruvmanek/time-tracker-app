import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Tikko } from '@/components/tikko';
import { Button } from '@/components/ui';
import { C, F, R, S, sticker } from '@/constants/theme';
import { CATEGORY_PROPS, DETAIL_PROMPTS, getCategory } from '@/lib/categories';
import { celebrate } from '@/lib/celebrate';
import type { RewardParams } from '@/lib/log';
import { pastDetails, STREAK_MIN_HOURS, streak } from '@/lib/stats';
import { getState, setDetail, useAppState } from '@/lib/store';
import { dateKey } from '@/lib/time';

const GLOW = [
  { r: 1.15, color: '#F4F1EC' },
  { r: 0.9, color: '#EFF7F5' },
  { r: 0.68, color: '#E6F4F1' },
  { r: 0.46, color: '#DDF0EC' },
  { r: 0.26, color: '#D3ECE7' },
];

/** The little celebration after every check-in, with an optional one-tap detail. */
export default function RewardScreen() {
  const p = useLocalSearchParams<RewardParams>();
  const state = useAppState();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [bounce, setBounce] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBounce(1), 250);
    return () => clearTimeout(t);
  }, []);

  const cat = getCategory(p.categoryId ?? '');
  const hours = Number(p.hours ?? 1);
  const start = Number(p.start ?? -1);
  const date = p.date ?? dateKey();
  const loggedToday = Object.keys(state.logs[dateKey()] ?? {}).length;
  const days = streak(state);
  const remaining = STREAK_MIN_HOURS - loggedToday;

  // Chips: your own past answers first, then sensible suggestions (taken once, on open).
  const prompt = DETAIL_PROMPTS[cat.id];
  const [chips, setChips] = useState(() => {
    const past = pastDetails(getState(), cat.id);
    const all = [...past, ...(prompt?.chips ?? [])];
    return all.filter((c, i) => all.findIndex((x) => x.toLowerCase() === c.toLowerCase()) === i).slice(0, 8);
  });
  const [picked, setPicked] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const canDetail = !!prompt && start >= 0;

  const pick = (detail: string | null) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setPicked(detail);
    setDetail(date, start, start + hours, detail ?? undefined);
  };
  const addOther = () => {
    const d = draft.trim();
    setTyping(false);
    setDraft('');
    if (!d) return;
    if (!chips.some((c) => c.toLowerCase() === d.toLowerCase())) setChips([d, ...chips]);
    pick(d);
  };

  let streakLine: string;
  if (date !== dateKey()) streakLine = 'Filling in the past keeps your data honest. 👏';
  else if (remaining > 0)
    streakLine = `Log ${remaining} more hour${remaining === 1 ? '' : 's'} today to ${days > 0 ? `keep your 🔥 ${days}-day streak` : 'start a 🔥 streak'}`;
  else streakLine = `🔥 Streak safe: ${days} day${days === 1 ? '' : 's'} and counting`;

  const done = () => {
    router.back();
    setTimeout(() => celebrate('ring'), 350);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top + S.lg, paddingBottom: insets.bottom + S.md }]}>
        {/* Soft glow behind Tikko: plain circles (no SVG), so it always fills the screen. */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {GLOW.map(({ r, color }) => (
            <View
              key={r}
              style={{
                position: 'absolute',
                width: width * r * 2,
                height: width * r * 2,
                borderRadius: width * r,
                left: width / 2 - width * r,
                top: height * 0.3 - width * r,
                backgroundColor: color,
              }}
            />
          ))}
        </View>

        <ScrollView
          style={{ alignSelf: 'stretch' }}
          contentContainerStyle={styles.middle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Tikko mood="radiant" prop={CATEGORY_PROPS[cat.id]} size={canDetail ? 200 : 240} bounceKey={bounce} />

          <Animated.View entering={FadeInDown.delay(150)} style={{ alignItems: 'center', gap: 6 }}>
            <Text style={styles.title}>Ding! {hours === 1 ? 'Hour' : `${hours} hours`} logged</Text>
            <Text style={styles.cat}>
              {cat.emoji} {cat.name}
              {picked ? <Text style={styles.picked}> · {picked}</Text> : null}
            </Text>
            <Text style={styles.streak}>{streakLine}</Text>
          </Animated.View>

          {canDetail && (
            <Animated.View entering={FadeInDown.delay(350)} style={styles.detail}>
              <Text style={styles.question}>
                {prompt.question} <Text style={styles.optional}>Optional</Text>
              </Text>
              <View style={styles.chips}>
                {chips.map((c) => {
                  const on = picked === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => pick(on ? null : c)}
                      style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && { opacity: 0.8 }]}>
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>{c}</Text>
                    </Pressable>
                  );
                })}
                {!typing && (
                  <Pressable onPress={() => setTyping(true)} style={[styles.chip, styles.chipOther]}>
                    <Text style={[styles.chipText, { color: C.sub }]}>+ Other</Text>
                  </Pressable>
                )}
              </View>
              {typing && (
                <View style={styles.otherRow}>
                  <TextInput
                    autoFocus
                    value={draft}
                    onChangeText={setDraft}
                    onSubmitEditing={addOther}
                    returnKeyType="done"
                    placeholder="Type it once, tap it next time"
                    placeholderTextColor={C.sub}
                    maxLength={30}
                    style={styles.input}
                  />
                  <Pressable onPress={addOther} style={styles.add}>
                    <Text style={styles.addText}>Add</Text>
                  </Pressable>
                </View>
              )}
            </Animated.View>
          )}
        </ScrollView>

        <Button label={picked ? 'Done' : 'Nice!'} onPress={done} style={{ alignSelf: 'stretch' }} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, paddingHorizontal: S.lg, alignItems: 'center', gap: S.md },
  middle: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: S.lg, paddingVertical: S.md },
  title: { fontFamily: F.display, fontSize: 30, color: C.ink, textAlign: 'center' },
  cat: { fontFamily: F.semibold, fontSize: 17, color: C.ink },
  picked: { color: C.accent },
  streak: { fontFamily: F.medium, fontSize: 15, color: C.sub, textAlign: 'center', paddingHorizontal: S.md },
  detail: { ...sticker, alignSelf: 'stretch', backgroundColor: C.card, borderRadius: R.lg, padding: S.md, gap: 12 },
  question: { fontFamily: F.semibold, fontSize: 16, color: C.ink },
  optional: { fontFamily: F.medium, fontSize: 13, color: C.sub },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.bg,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipOn: { backgroundColor: C.accentSoft, borderColor: C.accent },
  chipOther: { borderStyle: 'dashed', borderColor: C.faint, backgroundColor: C.card },
  chipText: { fontFamily: F.medium, fontSize: 14.5, color: C.ink },
  chipTextOn: { color: C.accent, fontFamily: F.semibold },
  otherRow: { flexDirection: 'row', gap: 8, alignSelf: 'stretch' },
  input: {
    flex: 1,
    minWidth: 0,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.bg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: F.medium,
    fontSize: 15,
    color: C.ink,
  },
  add: { flexShrink: 0, borderRadius: R.md, backgroundColor: C.accent, paddingHorizontal: 16, justifyContent: 'center' },
  addText: { fontFamily: F.semibold, fontSize: 15, color: '#FFFFFF' },
});
