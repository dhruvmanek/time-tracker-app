import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Tikk } from '@/components/tikk';
import { BigNumber, Button } from '@/components/ui';
import { C, F, S } from '@/constants/theme';
import { getCategory } from '@/lib/categories';
import { celebrate } from '@/lib/celebrate';
import type { RewardParams } from '@/lib/log';
import { STREAK_MIN_HOURS, streak } from '@/lib/stats';
import { useAppState } from '@/lib/store';
import { dateKey } from '@/lib/time';

/** The little celebration after every check-in. */
export default function RewardScreen() {
  const p = useLocalSearchParams<RewardParams>();
  const state = useAppState();
  const insets = useSafeAreaInsets();
  const [bounce, setBounce] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBounce(1), 250);
    return () => clearTimeout(t);
  }, []);

  const cat = getCategory(p.categoryId ?? '');
  const hours = Number(p.hours ?? 1);
  const loggedToday = Object.keys(state.logs[dateKey()] ?? {}).length;
  const days = streak(state);
  const remaining = STREAK_MIN_HOURS - loggedToday;

  let streakLine: string;
  if (p.date !== dateKey()) streakLine = 'Filling in the past keeps your data honest. 👏';
  else if (remaining > 0)
    streakLine = `Log ${remaining} more hour${remaining === 1 ? '' : 's'} today to ${days > 0 ? `keep your 🔥 ${days}-day streak` : 'start a 🔥 streak'}`;
  else streakLine = `🔥 Streak safe: ${days} day${days === 1 ? '' : 's'} and counting`;

  const done = () => {
    router.back();
    setTimeout(() => celebrate('ring'), 350);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + S.xl, paddingBottom: insets.bottom + S.md }]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id="g" cx="50%" cy="38%" r="75%">
            <Stop offset="0" stopColor="#FFF0C4" />
            <Stop offset="1" stopColor="#FFB547" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#g)" />
      </Svg>

      <Animated.View entering={ZoomIn.springify().damping(9)}>
        <BigNumber value={`+${p.xp ?? 0}`} suffix=" XP" size={76} />
      </Animated.View>

      {p.levelUp ? (
        <Animated.View entering={FadeInDown.delay(300)} style={styles.levelUp}>
          <Text style={styles.levelUpText}>⭐ Level up! You’re now level {p.levelUp}</Text>
        </Animated.View>
      ) : null}

      <View style={{ alignItems: 'center' }}>
        <Tikk mood="radiant" size={230} bounceKey={bounce} />
      </View>

      <Animated.View entering={FadeInDown.delay(150)} style={{ alignItems: 'center', gap: S.sm }}>
        <Text style={styles.title}>Ding! {hours === 1 ? 'Hour' : `${hours} hours`} logged</Text>
        <Text style={styles.cat}>
          {cat.emoji} {cat.name}
        </Text>
        <Text style={styles.streak}>{streakLine}</Text>
      </Animated.View>

      <Button label="Nice!" onPress={done} style={{ alignSelf: 'stretch' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: S.lg, justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: F.display, fontSize: 32, color: C.ink, textAlign: 'center' },
  cat: { fontFamily: F.bold, fontSize: 18, color: C.ink },
  streak: { fontFamily: F.medium, fontSize: 16, color: '#6B4A2A', textAlign: 'center', paddingHorizontal: S.md },
  levelUp: { backgroundColor: C.ink, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  levelUpText: { fontFamily: F.bold, color: '#FFFFFF', fontSize: 15 },
});
