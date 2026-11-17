// Tikk's world: a meadow whose colours follow Tikk's mood.
// Sunny and green on a good day; dusky purple with wilted flowers on a scrolling day.

import { StyleSheet } from 'react-native';
import Svg, { Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import type { Mood } from '@/lib/types';

const INK = '#1E1A2E';

export const SCENES: Record<
  Mood,
  { sky: [string, string]; hillBack: string; hillFront: string; ground: string; bush: string; panel: string }
> = {
  radiant: { sky: ['#8FD6FA', '#C9EEFF'], hillBack: '#85D86E', hillFront: '#62C152', ground: '#52AD47', bush: '#3E9E3E', panel: 'rgba(25,85,30,0.38)' },
  happy: { sky: ['#9EDCFB', '#D2F0FF'], hillBack: '#7FD06A', hillFront: '#5DBB4E', ground: '#4FA845', bush: '#3E9E3E', panel: 'rgba(25,85,30,0.38)' },
  meh: { sky: ['#F7C59F', '#FCE3C8'], hillBack: '#A9C77A', hillFront: '#8DB262', ground: '#7C9F55', bush: '#6A8C47', panel: 'rgba(55,75,30,0.38)' },
  drained: { sky: ['#A97BE8', '#F3A98C'], hillBack: '#8EA88A', hillFront: '#738F72', ground: '#647F63', bush: '#56705A', panel: 'rgba(35,45,40,0.40)' },
};

export function Scene({ mood }: { mood: Mood }) {
  const s = SCENES[mood];
  const wilted = mood === 'drained' || mood === 'meh';
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 375 812" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={s.sky[0]} />
          <Stop offset="0.5" stopColor={s.sky[1]} />
        </LinearGradient>
      </Defs>
      <Rect width="375" height="812" fill="url(#sky)" />

      {/* Clouds (only when the weather is nice) */}
      {!wilted && (
        <G fill="#FFFFFF">
          <Ellipse cx="78" cy="168" rx="46" ry="19" />
          <Ellipse cx="108" cy="155" rx="30" ry="22" />
          <Ellipse cx="300" cy="222" rx="40" ry="15" />
          <Ellipse cx="322" cy="212" rx="24" ry="17" />
        </G>
      )}

      <Path d="M0 360 Q90 300 200 330 T375 320 V812 H0Z" fill={s.hillBack} />
      <Path d="M0 400 Q120 350 260 380 T375 370 V812 H0Z" fill={s.hillFront} />
      <Rect x="0" y="560" width="375" height="252" fill={s.ground} />

      {/* Bushes */}
      <G stroke={INK} strokeWidth={4} strokeLinejoin="round">
        <Path d="M18 392 q10 -26 24 -6 q14 -18 24 6 z" fill={s.bush} />
        <Path d="M304 372 q12 -30 28 -8 q16 -20 26 8 z" fill={s.bush} />
      </G>

      {/* Flowers: upright and bright, or drooping */}
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
            <Ellipse cx="62" cy="340" rx="8" ry="8" fill="#FFD84A" />
            <Path d="M332 352 v-22" />
            <Ellipse cx="332" cy="322" rx="8" ry="8" fill="#FF8FB1" />
          </>
        )}
      </G>
    </Svg>
  );
}
