import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, R } from '@/constants/theme';
import { onCelebrate } from '@/lib/celebrate';

/** Shows "+15 XP" style messages at the top of the screen for a moment. */
export function CelebrationToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [id, setId] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(
    () =>
      onCelebrate((m) => {
        setMessage(m);
        setId((n) => n + 1);
      }),
    [],
  );

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 2200);
    return () => clearTimeout(t);
  }, [message, id]);

  if (!message) return null;
  return (
    <Animated.View
      key={id}
      entering={FadeInUp}
      exiting={FadeOutUp}
      pointerEvents="none"
      style={[styles.toast, { top: insets.top + 8 }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: C.ink,
    borderRadius: R.pill,
    paddingVertical: 12,
    paddingHorizontal: 20,
    zIndex: 100,
  },
  text: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
