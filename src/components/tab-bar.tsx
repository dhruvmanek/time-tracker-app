import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { C, F, sticker } from '@/constants/theme';

export const TAB_BAR_HEIGHT = 66;

const TABS: Record<string, { icon: string; label: string }> = {
  index: { icon: '🏡', label: 'Home' },
  day: { icon: '🗓️', label: 'Day' },
  insights: { icon: '📊', label: 'Stats' },
  settings: { icon: '⚙️', label: 'Settings' },
};

/** Bottom bar with a raised "Log" button in the middle, which opens the check-in. */
export function TabBar({ state, navigateToTab, insets }: BottomTabBarProps) {
  const routes = state.routes.filter((r) => TABS[r.name]);
  const half = Math.ceil(routes.length / 2);

  const renderTab = (route: (typeof routes)[number]) => {
    const tab = TABS[route.name];
    const focused = state.routes[state.index]?.key === route.key;
    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={{ selected: focused }}
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.selectionAsync();
          navigateToTab(route.key);
        }}
        style={styles.tab}>
        <View style={[styles.iconWrap, focused && styles.iconActive]}>
          <Text style={[styles.icon, !focused && { opacity: 0.55 }]}>{tab.icon}</Text>
        </View>
        <Text style={[styles.label, focused && { color: C.ink }]}>{tab.label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8), height: TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) }]}>
      {routes.slice(0, half).map(renderTab)}
      <View style={styles.tab}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log an hour"
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/check-in');
          }}
          style={({ pressed }) => [styles.logButton, pressed && { transform: [{ translateY: 3 }], shadowOffset: { width: 0, height: 1 } }]}>
          <Text style={styles.logIcon}>⏰</Text>
        </Pressable>
        <Text style={[styles.label, { color: C.ink, marginTop: 2 }]}>Log</Text>
      </View>
      {routes.slice(half).map(renderTab)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: C.white,
    borderTopWidth: 3,
    borderColor: C.ink,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 6,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
  iconWrap: { paddingHorizontal: 12, paddingVertical: 3, borderRadius: 14 },
  iconActive: { backgroundColor: C.cardAlt },
  icon: { fontSize: 24 },
  label: { fontFamily: F.semibold, fontSize: 12, color: C.sub, marginTop: 1 },
  logButton: {
    marginTop: -30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.sand,
    alignItems: 'center',
    justifyContent: 'center',
    ...sticker,
  },
  logIcon: { fontSize: 30 },
});
