import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { C, F, R, S, sticker } from '@/constants/theme';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Heading({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.heading, style]}>{children}</Text>;
}

export function Body({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Small({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.small, style]}>{children}</Text>;
}

/** Chunky sticker-style button. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'light' | 'ghost';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'light' && styles.buttonLight,
        variant === 'ghost' && styles.buttonGhost,
        pressed && variant !== 'ghost' && { transform: [{ scale: 0.98 }], opacity: 0.92 },
        disabled && { opacity: 0.4 },
        style,
      ]}>
      <Text style={[styles.buttonText, variant !== 'primary' && { color: C.ink }]}>{label}</Text>
    </Pressable>
  );
}

/** Big chunky number with a white outline, e.g. "82%". */
export function BigNumber({ value, suffix, size = 96 }: { value: string; suffix?: string; size?: number }) {
  const o = Math.max(3, Math.round(size / 18)); // outline thickness
  const offsets: [number, number][] = [
    [-o, 0], [o, 0], [0, -o], [0, o],
    [-o * 0.7, -o * 0.7], [o * 0.7, -o * 0.7], [-o * 0.7, o * 0.7], [o * 0.7, o * 0.7],
  ];
  const content = (
    <>
      {value}
      {suffix ? <Text style={{ fontSize: size * 0.42 }}>{suffix}</Text> : null}
    </>
  );
  const base: TextStyle = { fontFamily: F.display, fontSize: size, lineHeight: size * 1.02, color: C.ink };
  return (
    <View style={{ alignSelf: 'center' }}>
      {/* drop shadow */}
      <Text style={[base, styles.abs, { color: 'rgba(0,0,0,0.18)', transform: [{ translateY: o + 3 }] }]}>{content}</Text>
      {offsets.map(([x, y], i) => (
        <Text key={i} style={[base, styles.abs, { color: '#FFFFFF', transform: [{ translateX: x }, { translateY: y }] }]}>
          {content}
        </Text>
      ))}
      <Text style={base}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: S.md,
    ...sticker,
  },
  title: { fontFamily: F.display, fontSize: 32, color: C.ink },
  heading: { fontFamily: F.semibold, fontSize: 17, color: C.ink },
  body: { fontFamily: F.medium, fontSize: 16, color: C.ink, lineHeight: 22 },
  small: { fontFamily: F.medium, fontSize: 13.5, color: C.sub, lineHeight: 19 },
  button: {
    borderRadius: R.md,
    paddingVertical: 15,
    paddingHorizontal: S.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: C.accent,
    shadowColor: C.accent,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  buttonLight: { backgroundColor: C.white, ...sticker },
  buttonGhost: { backgroundColor: 'transparent' },
  buttonText: { fontFamily: F.semibold, color: '#FFFFFF', fontSize: 17 },
  track: {
    borderRadius: R.pill,
    backgroundColor: C.cardAlt,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: R.pill },
  abs: { position: 'absolute', left: 0, top: 0 },
});
