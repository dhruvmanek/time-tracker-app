import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { C, R, S } from '@/constants/theme';

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

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
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
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'ghost' && styles.buttonGhost,
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.85, transform: [{ scale: 0.98 }] },
        style,
      ]}>
      <Text
        style={[
          styles.buttonText,
          variant !== 'primary' && { color: C.ink },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Chip({ label, tone = 'default' }: { label: string; tone?: 'default' | 'fire' | 'level' }) {
  return (
    <View
      style={[
        styles.chip,
        tone === 'fire' && { backgroundColor: '#FFE3D6' },
        tone === 'level' && { backgroundColor: '#FFF0C2' },
      ]}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ value, color = C.sand }: { value: number; color?: string }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.max(0, Math.min(1, value)) * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: S.md,
    shadowColor: '#7A5A30',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  title: { fontSize: 30, fontWeight: '800', color: C.ink, letterSpacing: -0.5 },
  heading: { fontSize: 18, fontWeight: '700', color: C.ink },
  body: { fontSize: 16, color: C.ink, lineHeight: 22 },
  small: { fontSize: 13, color: C.sub, lineHeight: 18 },
  button: {
    borderRadius: R.pill,
    paddingVertical: 16,
    paddingHorizontal: S.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: { backgroundColor: C.ink },
  buttonSecondary: { backgroundColor: C.cardAlt },
  buttonGhost: { backgroundColor: 'transparent' },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  chip: {
    backgroundColor: C.cardAlt,
    borderRadius: R.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipText: { fontSize: 14, fontWeight: '700', color: C.ink },
  track: { height: 10, borderRadius: R.pill, backgroundColor: C.cardAlt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: R.pill },
});
