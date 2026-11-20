import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { C, F } from '@/constants/theme';

export const TAB_BAR_HEIGHT = 58;

type IconName = 'today' | 'insights' | 'settings';

const TABS: Record<string, { icon: IconName; label: string }> = {
  index: { icon: 'today', label: 'Today' },
  insights: { icon: 'insights', label: 'Insights' },
  settings: { icon: 'settings', label: 'Settings' },
};

/** Simple line icons, one consistent style. */
function Icon({ name, color }: { name: IconName; color: string }) {
  const p = { stroke: color, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      {name === 'today' && <Path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" {...p} />}
      {name === 'insights' && <Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" {...p} />}
      {name === 'settings' && (
        <>
          <Circle cx={12} cy={12} r={3} {...p} />
          <Path
            d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
            {...p}
          />
        </>
      )}
    </Svg>
  );
}

export function TabBar({ state, navigateToTab, insets }: BottomTabBarProps) {
  const routes = state.routes.filter((r) => TABS[r.name]);
  const bottom = Math.max(insets.bottom, 8);
  return (
    <View style={[styles.bar, { paddingBottom: bottom, height: TAB_BAR_HEIGHT + bottom }]}>
      {routes.map((route) => {
        const tab = TABS[route.name];
        const focused = state.routes[state.index]?.key === route.key;
        const color = focused ? C.accent : '#A3A7AE';
        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.selectionAsync();
              navigateToTab(route.key);
            }}
            style={styles.tab}>
            <Icon name={tab.icon} color={color} />
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
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
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: C.faint,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontFamily: F.semibold, fontSize: 11 },
});
