// Tikko's world. It changes with:
//  - the time of day (sunrise, day, sunset, starry night),
//  - Tikko's mood (a gloomy tint and wilted flowers on a scrolling day),
//  - which world you've unlocked (meadow, beach, forest, city),
// and its clouds slowly drift across the sky.

import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import type { Mood } from '@/lib/types';

const INK = '#1E1A2E';

export type WorldId = 'meadow' | 'beach' | 'forest' | 'city';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export const WORLDS: { id: WorldId; name: string; emoji: string; goodDays: number }[] = [
  { id: 'meadow', name: 'Meadow', emoji: '🌼', goodDays: 0 },
  { id: 'beach', name: 'Beach', emoji: '🏖️', goodDays: 3 },
  { id: 'forest', name: 'Forest', emoji: '🌲', goodDays: 7 },
  { id: 'city', name: 'City', emoji: '🏙️', goodDays: 14 },
];

export function timeOfDay(date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}

const SKY: Record<TimeOfDay, [string, string, string]> = {
  dawn: ['#F7A6B9', '#FFC9A8', '#FFE7C7'],
  day: ['#7FCFF9', '#A8DFFB', '#D6F1FF'],
  dusk: ['#9A6FE0', '#F28CA6', '#FFC08A'],
  night: ['#141B45', '#24306B', '#3D4A8C'],
};

/** Translucent panel colour for cards drawn over the scene. */
export const SCENE_PANEL = 'rgba(15,20,35,0.30)';

type Props = { mood: Mood; world?: WorldId; time?: TimeOfDay };

export function Scene({ mood, world = 'meadow', time = timeOfDay() }: Props) {
  const { width, height } = useWindowDimensions();
  const sky = SKY[time];
  const night = time === 'night';
  const wilted = mood === 'drained' || mood === 'meh';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill} width={width} height={height} viewBox="0 0 375 812" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={sky[0]} />
            <Stop offset="0.3" stopColor={sky[1]} />
            <Stop offset="0.55" stopColor={sky[2]} />
          </LinearGradient>
        </Defs>
        <Rect width="375" height="812" fill="url(#sky)" />

        {night && <Stars />}
        {night ? <Moon /> : mood !== 'drained' && <Sun time={time} />}

        {world === 'meadow' && <Meadow wilted={wilted} night={night} />}
        {world === 'beach' && <Beach wilted={wilted} night={night} />}
        {world === 'forest' && <Forest wilted={wilted} night={night} />}
        {world === 'city' && <City wilted={wilted} night={night} time={time} />}

        {/* Mood tint: gloomy purple when drained, a bit dull when meh */}
        {mood === 'drained' && <Rect width="375" height="812" fill="#4B2E7A" opacity={0.28} />}
        {mood === 'meh' && <Rect width="375" height="812" fill="#7A5A3A" opacity={0.12} />}
      </Svg>
      <Clouds night={night} gloomy={mood === 'drained'} width={width} height={height} />
    </View>
  );
}

// ---- Sky bits ----

function Sun({ time }: { time: TimeOfDay }) {
  const y = time === 'day' ? 120 : 250; // low in the sky at sunrise/sunset
  const color = time === 'day' ? '#FFD45C' : '#FF9F5A';
  return (
    <G>
      <Circle cx="300" cy={y} r="56" fill={color} opacity={0.25} />
      <Circle cx="300" cy={y} r="34" fill={color} stroke={INK} strokeWidth={4} />
    </G>
  );
}

function Moon() {
  return (
    <G>
      <Circle cx="300" cy="130" r="50" fill="#FFF3C4" opacity={0.12} />
      <Path d="M312 100 a32 32 0 1 0 14 52 a26 26 0 1 1 -14 -52 z" fill="#FFF3C4" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    </G>
  );
}

const STAR_POINTS = [
  [30, 60], [80, 140], [140, 50], [200, 110], [250, 40], [350, 220], [40, 250], [180, 200], [110, 280], [330, 300], [260, 190], [20, 330],
];
function Stars() {
  return (
    <G fill="#FFF6D6">
      {STAR_POINTS.map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.6 : 1.6} opacity={i % 2 ? 0.9 : 0.6} />
      ))}
    </G>
  );
}

/** Clouds drawn in their own layer so they can drift. */
function Clouds({ night, gloomy, width, height }: { night: boolean; gloomy: boolean; width: number; height: number }) {
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(withTiming(1, { duration: 26000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [drift]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: -30 + drift.value * 60 }] }));
  const fill = gloomy ? '#9C8FB0' : night ? '#4E5A92' : '#FFFFFF';
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Svg width={width} height={height} viewBox="0 0 375 812" preserveAspectRatio="xMidYMid slice">
        <G fill={fill} opacity={night ? 0.7 : 1}>
          <Ellipse cx="78" cy="178" rx="46" ry="19" />
          <Ellipse cx="108" cy="165" rx="30" ry="22" />
          <Ellipse cx="240" cy="232" rx="40" ry="15" />
          <Ellipse cx="262" cy="222" rx="24" ry="17" />
        </G>
      </Svg>
    </Animated.View>
  );
}

// ---- Worlds ----
// Each world fills the bottom of the screen with something darkish, so the white
// text and cards over it stay readable.

function Meadow({ wilted, night }: { wilted: boolean; night: boolean }) {
  const back = night ? '#2F6B45' : wilted ? '#9DBB7A' : '#7FD06A';
  const front = night ? '#255A3A' : wilted ? '#86A862' : '#5DBB4E';
  const ground = night ? '#1E4D31' : wilted ? '#769A55' : '#4FA845';
  return (
    <G>
      <Path d="M0 360 Q90 300 200 330 T375 320 V812 H0Z" fill={back} />
      <Path d="M0 400 Q120 350 260 380 T375 370 V812 H0Z" fill={front} />
      <Rect x="0" y="560" width="375" height="252" fill={ground} />
      <G stroke={INK} strokeWidth={4} strokeLinejoin="round">
        <Path d="M18 392 q10 -26 24 -6 q14 -18 24 6 z" fill={night ? '#1F4A2E' : '#3E9E3E'} />
        <Path d="M304 372 q12 -30 28 -8 q16 -20 26 8 z" fill={night ? '#1F4A2E' : '#3E9E3E'} />
      </G>
      <Flowers wilted={wilted} />
    </G>
  );
}

function Flowers({ wilted }: { wilted: boolean }) {
  return (
    <G stroke={INK} strokeWidth={3.5} strokeLinecap="round">
      {wilted ? (
        <>
          <Path d="M58 372 q0 -20 10 -26" fill="none" />
          <Ellipse cx="72" cy="348" rx="7" ry="5" fill="#C9A35A" transform="rotate(40 72 348)" />
          <Path d="M334 356 q2 -18 -8 -26" fill="none" />
          <Ellipse cx="322" cy="332" rx="7" ry="5" fill="#C98A9A" transform="rotate(-40 322 332)" />
        </>
      ) : (
        <>
          <Path d="M62 372 v-24" />
          <Circle cx="62" cy="340" r="8" fill="#FFD84A" />
          <Path d="M332 352 v-22" />
          <Circle cx="332" cy="322" r="8" fill="#FF8FB1" />
        </>
      )}
    </G>
  );
}

function Beach({ wilted, night }: { wilted: boolean; night: boolean }) {
  const sea = night ? '#1F3F7A' : wilted ? '#6FA7BE' : '#3CB8E6';
  const sand = night ? '#8C7A5C' : wilted ? '#D9C08E' : '#F5D28E';
  const wet = night ? '#6E6048' : wilted ? '#C2A774' : '#E4B96E';
  return (
    <G>
      <Rect x="0" y="330" width="375" height="120" fill={sea} />
      <Path d="M20 360 q10 -6 20 0 M120 380 q10 -6 20 0 M250 356 q10 -6 20 0 M320 392 q10 -6 20 0" stroke="#FFFFFF" strokeWidth={3} opacity={0.7} fill="none" strokeLinecap="round" />
      <Path d="M0 420 Q120 400 220 420 T375 410 V812 H0Z" fill={sand} />
      <Rect x="0" y="560" width="375" height="252" fill={wet} />
      {/* Palm tree */}
      <G stroke={INK} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round">
        <Path d="M46 432 Q40 380 62 320" fill="none" strokeWidth={14} />
        <Path d="M46 432 Q40 380 62 320" fill="none" stroke="#B07A45" strokeWidth={7} />
        <Path d="M62 320 q-40 -10 -56 14 q30 -16 56 -14z" fill={wilted ? '#8DA866' : '#4FBF5A'} />
        <Path d="M62 320 q34 -18 56 4 q-32 -10 -56 -4z" fill={wilted ? '#8DA866' : '#4FBF5A'} />
        <Path d="M62 320 q-6 -36 22 -48 q-16 24 -22 48z" fill={wilted ? '#8DA866' : '#4FBF5A'} />
        {/* Umbrella */}
        <Path d="M330 430 V392" fill="none" />
        <Path d="M290 396 Q330 352 370 396 Z" fill={wilted ? '#C98A9A' : '#FF6F5B'} />
        <Path d="M317 396 Q330 364 343 396" fill={wilted ? '#E8D6C0' : '#FFFFFF'} />
      </G>
    </G>
  );
}

function Pine({ x, y, s, color }: { x: number; y: number; s: number; color: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} stroke={INK} strokeWidth={4 / s} strokeLinejoin="round">
      <Rect x="-5" y="0" width="10" height="18" fill="#7A5236" />
      <Path d="M0 -70 L-26 -30 H-14 L-34 0 H34 L14 -30 H26 Z" fill={color} />
    </G>
  );
}

function Forest({ wilted, night }: { wilted: boolean; night: boolean }) {
  const back = night ? '#24503A' : wilted ? '#8FAE78' : '#6CBF6E';
  const ground = night ? '#1B4230' : wilted ? '#78985E' : '#4E9F4F';
  const tree = night ? '#1F5A3A' : wilted ? '#7F9C5E' : '#2F9450';
  const treeBack = night ? '#2A6B48' : wilted ? '#97B47A' : '#4DB067';
  return (
    <G>
      <Path d="M0 380 Q110 330 220 360 T375 350 V812 H0Z" fill={back} />
      <Pine x={30} y={372} s={1} color={treeBack} />
      <Pine x={300} y={360} s={0.9} color={treeBack} />
      <Pine x={350} y={380} s={1.1} color={tree} />
      <Pine x={80} y={400} s={1.2} color={tree} />
      <Rect x="0" y="420" width="375" height="392" fill={ground} />
      {!wilted && (
        <G stroke={INK} strokeWidth={3} strokeLinejoin="round">
          <Path d="M300 440 q-14 0 -14 -12 q0 -10 14 -10 q14 0 14 10 q0 12 -14 12z" fill="#FF6F5B" />
          <Rect x="296" y="438" width="8" height="12" rx="3" fill="#FFF6E6" />
        </G>
      )}
    </G>
  );
}

function City({ wilted, night, time }: { wilted: boolean; night: boolean; time: TimeOfDay }) {
  const lit = night || time === 'dusk';
  const building = night ? '#2B2F55' : wilted ? '#9B98AE' : '#8FA3D9';
  const building2 = night ? '#3A3F6E' : wilted ? '#B3AFC2' : '#B0C2EE';
  const win = lit ? '#FFD45C' : '#E6F4FF';
  const park = night ? '#1E4D31' : wilted ? '#86A862' : '#5DBB4E';
  const blocks: [number, number, number, string][] = [
    [0, 250, 70, building2], [60, 300, 60, building], [115, 220, 70, building2], [180, 290, 56, building],
    [230, 240, 66, building2], [292, 310, 83, building],
  ];
  return (
    <G>
      {blocks.map(([x, top, w, fill], i) => (
        <G key={i}>
          <Rect x={x} y={top} width={w} height={460 - top} fill={fill} stroke={INK} strokeWidth={4} />
          {Array.from({ length: Math.floor((440 - top) / 30) }, (_, r) =>
            [0, 1].map((c) => (
              <Rect
                key={`${r}-${c}`}
                x={x + 12 + c * (w / 2 - 6)}
                y={top + 16 + r * 30}
                width={w / 2 - 22}
                height={14}
                rx={2}
                fill={(r + c + i) % 3 === 0 && lit ? building : win}
              />
            )),
          )}
        </G>
      ))}
      <Path d="M0 450 Q120 430 240 450 T375 444 V812 H0Z" fill={park} />
      <Rect x="0" y="600" width="375" height="212" fill={night ? '#173D27' : wilted ? '#769A55' : '#4FA845'} />
    </G>
  );
}
