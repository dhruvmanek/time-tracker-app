// Building blocks for the onboarding quiz.

import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Tikko } from '@/components/tikko';
import { C, F, R, S, sticker } from '@/constants/theme';
import type { Mood } from '@/lib/types';

const haptic = (fn: () => void) => {
  if (Platform.OS !== 'web') fn();
};

/** Back arrow + progress bar + a small Tikko peeking in the corner. */
export function ProgressHeader({ progress, onBack }: { progress: number; onBack?: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} disabled={!onBack} style={[styles.back, !onBack && { opacity: 0 }]}>
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(4, progress * 100)}%` }]} />
      </View>
      <Tikko mood="happy" size={40} />
    </View>
  );
}

export type Option = { id: string; label: string; emoji: string };

/** A list of tappable answer cards. Single- or multi-select. */
export function OptionList({
  options,
  selected,
  onToggle,
}: {
  options: Option[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      {options.map((o) => {
        const on = selected.includes(o.id);
        return (
          <Pressable
            key={o.id}
            onPress={() => {
              haptic(() => Haptics.selectionAsync());
              onToggle(o.id);
            }}
            style={({ pressed }) => [
              styles.option,
              on && styles.optionOn,
              pressed && { transform: [{ translateY: 2 }], shadowOffset: { width: 0, height: 2 } },
            ]}>
            <Text style={styles.optionEmoji}>{o.emoji}</Text>
            <Text style={styles.optionLabel}>{o.label}</Text>
            <View style={[styles.check, on && styles.checkOn]}>{on && <Text style={styles.checkMark}>✓</Text>}</View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A drag slider for 0–max hours. */
export function HoursSlider({ value, max = 12, onChange }: { value: number; max?: number; onChange: (v: number) => void }) {
  const [width, setWidth] = useState(1);
  const last = useRef(value);
  const update = (x: number) => {
    const v = Math.round(Math.max(0, Math.min(1, x / width)) * max * 2) / 2; // half-hour steps
    if (v !== last.current) {
      last.current = v;
      haptic(() => Haptics.selectionAsync());
      onChange(v);
    }
  };
  const pct = value / max;
  return (
    <View style={{ gap: 6 }}>
      <View
        style={styles.sliderArea}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => update(e.nativeEvent.locationX)}
        onResponderMove={(e) => update(e.nativeEvent.locationX)}>
        <View style={styles.sliderTrack} pointerEvents="none">
          <View style={[styles.sliderFill, { width: `${pct * 100}%` }]} />
        </View>
        <View style={[styles.thumb, { left: pct * width - 26 }]} pointerEvents="none">
          <Text style={{ fontSize: 26 }}>⏰</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.sliderLabel}>0h</Text>
        <Text style={styles.sliderLabel}>{max}h+</Text>
      </View>
    </View>
  );
}

/** A mock iOS notification showing the one-tap buttons. */
export function NotificationPreview() {
  return (
    <View style={{ gap: 8 }}>
      <View style={styles.notif}>
        <View style={styles.notifIcon}>
          <Tikko mood="happy" size={30} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.notifTitle}>Tikko ⏳</Text>
            <Text style={styles.notifTime}>now</Text>
          </View>
          <Text style={styles.notifBody}>What did you do since 2 PM? Hold to log in one tap.</Text>
        </View>
      </View>
      {['💻 Deep work', '📱 Social media', '📚 Learning', '🍽️ Meals & rest'].map((b, i) => (
        <View key={b} style={[styles.notifButton, i === 1 && { borderColor: C.ink, borderWidth: 2.5 }]}>
          <Text style={styles.notifButtonText}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const HOLD_MS = 2200;

/** Press and hold to "wind up" Tikko. Calls onDone when the ring fills. */
export function HoldToWind({ onDone }: { onDone: () => void }) {
  const progress = useSharedValue(0);
  const [holding, setHolding] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimers = () => {
    if (timer.current) clearTimeout(timer.current);
    if (ticker.current) clearInterval(ticker.current);
    timer.current = null;
    ticker.current = null;
  };
  useEffect(() => stopTimers, []);

  const start = () => {
    if (done) return;
    setHolding(true);
    progress.value = withTiming(1, { duration: HOLD_MS * (1 - progress.value), easing: Easing.linear });
    // Little "clicks" while winding, like a real wind-up key.
    ticker.current = setInterval(() => haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)), 180);
    timer.current = setTimeout(() => {
      stopTimers();
      setHolding(false);
      setDone(true);
      haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
      onDone();
    }, HOLD_MS * (1 - progress.value));
  };

  const stop = () => {
    if (done) return;
    stopTimers();
    setHolding(false);
    cancelAnimation(progress);
    progress.value = withTiming(0, { duration: 350 });
  };

  const SIZE = 250;
  const RADIUS = 115;
  const CIRC = 2 * Math.PI * RADIUS;
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: CIRC * (1 - progress.value) }));
  const wiggle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${Math.sin(progress.value * 60) * 7 * (progress.value > 0 && progress.value < 1 ? 1 : 0)}deg` }, { scale: 1 + progress.value * 0.08 }],
  }));

  const mood: Mood = done ? 'radiant' : holding ? 'happy' : 'meh';

  return (
    <View style={{ alignItems: 'center', gap: S.lg }}>
      <Pressable onPressIn={start} onPressOut={stop} style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke="#FFFFFF" strokeWidth={14} fill="rgba(255,255,255,0.35)" />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={C.sand}
            strokeWidth={14}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRC} ${CIRC}`}
            animatedProps={ringProps}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <Animated.View style={wiggle}>
          <Tikko mood={mood} size={170} bounceKey={done ? 1 : 0} />
        </Animated.View>
      </Pressable>
      <Text style={styles.holdHint}>{done ? 'Tikko is wound up and ready! 🎉' : holding ? 'Keep holding…' : 'Press and hold Tikko'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 2.5,
    borderColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontFamily: F.bold, fontSize: 24, color: C.ink, marginTop: -3 },
  progressTrack: {
    flex: 1,
    height: 14,
    borderRadius: R.pill,
    backgroundColor: C.cardAlt,
    borderWidth: 2.5,
    borderColor: C.ink,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: C.sand },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: R.md,
    paddingVertical: 14,
    paddingHorizontal: 14,
    ...sticker,
  },
  optionOn: { backgroundColor: '#FFF0C2' },
  optionEmoji: { fontSize: 24 },
  optionLabel: { flex: 1, fontFamily: F.semibold, fontSize: 16.5, color: C.ink },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    borderColor: C.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: C.ink, borderColor: C.ink },
  checkMark: { color: '#FFFFFF', fontFamily: F.bold, fontSize: 14 },
  sliderArea: { height: 56, justifyContent: 'center' },
  sliderTrack: {
    height: 18,
    borderRadius: R.pill,
    backgroundColor: C.cardAlt,
    borderWidth: 2.5,
    borderColor: C.ink,
    overflow: 'hidden',
  },
  sliderFill: { height: '100%', backgroundColor: C.coral },
  thumb: {
    position: 'absolute',
    top: 2,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...sticker,
  },
  sliderLabel: { fontFamily: F.semibold, color: C.sub, fontSize: 14 },
  notif: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 22,
    padding: 12,
    ...sticker,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#9EDCFB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  notifTitle: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  notifTime: { fontFamily: F.medium, fontSize: 13, color: C.sub },
  notifBody: { fontFamily: F.medium, fontSize: 14.5, color: C.ink, marginTop: 1 },
  notifButton: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: C.faint,
  },
  notifButtonText: { fontFamily: F.semibold, fontSize: 15.5, color: C.ink },
  holdHint: { fontFamily: F.display, fontSize: 22, color: C.ink, textAlign: 'center' },
});
