// Tikk: a little spirit made of glowing sand.
// This is a placeholder drawn in code. Before launch, swap it for illustrated,
// animated art (e.g. made in Rive) while keeping the same moods and stages.

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';

import type { Mood } from '@/lib/types';

type Props = {
  mood: Mood;
  stage?: 1 | 2 | 3;
  size?: number;
  /** Increment to make Tikk do a happy bounce (e.g. after a check-in). */
  bounceKey?: number;
};

const PALETTE: Record<Mood, { light: string; dark: string; glow: string }> = {
  radiant: { light: '#FFE08A', dark: '#F5A623', glow: '#FFD45C' },
  happy: { light: '#FFD98A', dark: '#EFA93A', glow: '#FFE2A3' },
  meh: { light: '#F1D3A6', dark: '#D3A06A', glow: '#F6E3C8' },
  melty: { light: '#D9C3A6', dark: '#A88C6E', glow: '#E8DCCD' },
  sleepy: { light: '#EBD8BC', dark: '#C9A57A', glow: '#F3E8D8' },
};

const BODY = 'M100 40 C148 40 168 86 168 128 C168 176 138 200 100 200 C62 200 32 176 32 128 C32 86 52 40 100 40 Z';
const MELTED =
  'M100 62 C144 62 164 98 166 136 C168 160 176 172 170 188 C163 204 151 190 140 198 C126 208 112 196 100 201 C88 206 74 196 62 200 C46 206 32 192 32 172 C30 132 54 62 100 62 Z';

export function Tikk({ mood, stage = 1, size = 200, bounceKey = 0 }: Props) {
  const p = PALETTE[mood];
  const melted = mood === 'melty';
  const breathe = useSharedValue(0);
  const bounce = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(1, { duration: mood === 'sleepy' ? 2600 : 1600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breathe, mood]);

  useEffect(() => {
    if (bounceKey === 0) return;
    bounce.value = withSequence(
      withTiming(-28, { duration: 180, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 260, easing: Easing.bounce }),
    );
  }, [bounce, bounceKey]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounce.value + breathe.value * -4 },
      { scaleY: 1 + breathe.value * 0.035 },
      { scaleX: 1 - breathe.value * 0.015 },
    ],
  }));

  const eyeY = melted ? 132 : 112;

  return (
    <View style={{ width: size, height: size * 1.1 }}>
      <Animated.View style={[StyleSheet.absoluteFill, bodyStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 200 220">
          <Defs>
            <RadialGradient id="body" cx="40%" cy="35%" r="70%">
              <Stop offset="0" stopColor={p.light} />
              <Stop offset="1" stopColor={p.dark} />
            </RadialGradient>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={p.glow} stopOpacity={mood === 'radiant' ? 0.9 : 0.5} />
              <Stop offset="1" stopColor={p.glow} stopOpacity={0} />
            </RadialGradient>
          </Defs>

          {/* Glow aura */}
          <Circle cx="100" cy="125" r="98" fill="url(#glow)" />

          {/* Stage 3: halo */}
          {stage >= 3 && (
            <Ellipse cx="100" cy={melted ? 48 : 24} rx="34" ry="8" fill="none" stroke="#FFC93C" strokeWidth="5" />
          )}

          {/* Stage 2+: a little sprout */}
          {stage >= 2 && (
            <G>
              <Path
                d={`M100 ${melted ? 64 : 42} C100 ${melted ? 52 : 30} 102 ${melted ? 46 : 24} 106 ${melted ? 40 : 18}`}
                stroke="#5A9E4B"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d={`M106 ${melted ? 40 : 18} C118 ${melted ? 32 : 10} 130 ${melted ? 40 : 18} 124 ${melted ? 48 : 26} C116 ${melted ? 52 : 30} 108 ${melted ? 48 : 26} 106 ${melted ? 40 : 18} Z`}
                fill="#7BC46A"
              />
            </G>
          )}

          {/* Body */}
          <Path d={melted ? MELTED : BODY} fill="url(#body)" />

          {/* Sand speckles */}
          <G fill={p.dark} opacity={0.35}>
            <Circle cx="62" cy="150" r="2.5" />
            <Circle cx="140" cy="160" r="2" />
            <Circle cx="128" cy="78" r="2" />
            <Circle cx="72" cy="90" r="1.8" />
            <Circle cx="110" cy="180" r="2.2" />
          </G>

          {/* Shine */}
          <Ellipse cx="72" cy={melted ? 92 : 76} rx="12" ry="7" fill="#FFFFFF" opacity={0.55} transform="rotate(-25 72 80)" />

          {/* Cheeks */}
          {mood !== 'melty' && (
            <G fill="#FF8C7A" opacity={0.45}>
              <Ellipse cx="62" cy={eyeY + 22} rx="11" ry="6" />
              <Ellipse cx="138" cy={eyeY + 22} rx="11" ry="6" />
            </G>
          )}

          <Face mood={mood} eyeY={eyeY} />

          {/* Sparkles when radiant */}
          {mood === 'radiant' && (
            <G fill="#FFC93C">
              <Sparkle x={30} y={60} s={1} />
              <Sparkle x={172} y={78} s={0.8} />
              <Sparkle x={166} y={190} s={0.6} />
            </G>
          )}

          {/* Zzz when sleepy */}
          {mood === 'sleepy' && (
            <G fill="none" stroke="#B39776" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M150 48 h12 l-12 14 h12" />
              <Path d="M170 26 h9 l-9 10 h9" />
            </G>
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}

function Face({ mood, eyeY }: { mood: Mood; eyeY: number }) {
  const ink = '#3A2A1C';
  const mouthY = eyeY + 26;
  switch (mood) {
    case 'sleepy':
      return (
        <G stroke={ink} strokeWidth="4" strokeLinecap="round" fill="none">
          <Path d={`M70 ${eyeY} q10 7 20 0`} />
          <Path d={`M110 ${eyeY} q10 7 20 0`} />
          <Ellipse cx="100" cy={mouthY} rx="5" ry="4" fill={ink} stroke="none" />
        </G>
      );
    case 'melty':
      return (
        <G>
          <Ellipse cx="80" cy={eyeY} rx="7" ry="9" fill={ink} />
          <Ellipse cx="120" cy={eyeY} rx="7" ry="9" fill={ink} />
          {/* heavy lids */}
          <Path d={`M70 ${eyeY - 3} h20`} stroke={ink} strokeWidth="4" strokeLinecap="round" />
          <Path d={`M110 ${eyeY - 3} h20`} stroke={ink} strokeWidth="4" strokeLinecap="round" />
          <Path
            d={`M86 ${mouthY + 4} q7 -6 14 0 q7 6 14 0`}
            stroke={ink}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        </G>
      );
    case 'meh':
      return (
        <G>
          <Eye cx={80} cy={eyeY} r={7} />
          <Eye cx={120} cy={eyeY} r={7} />
          <Path d={`M90 ${mouthY} h20`} stroke={ink} strokeWidth="4" strokeLinecap="round" />
        </G>
      );
    case 'happy':
      return (
        <G>
          <Eye cx={80} cy={eyeY} r={9} />
          <Eye cx={120} cy={eyeY} r={9} />
          <Path d={`M86 ${mouthY - 2} q14 14 28 0`} stroke={ink} strokeWidth="4" fill="none" strokeLinecap="round" />
        </G>
      );
    case 'radiant':
      return (
        <G>
          {/* ^ ^ joyful eyes */}
          <Path d={`M70 ${eyeY + 4} q10 -14 20 0`} stroke={ink} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <Path d={`M110 ${eyeY + 4} q10 -14 20 0`} stroke={ink} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <Path d={`M84 ${mouthY - 4} q16 22 32 0 Z`} fill={ink} />
          <Path d={`M92 ${mouthY + 4} q8 6 16 0`} fill="#FF8C7A" />
        </G>
      );
  }
}

function Eye({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill="#3A2A1C" />
      <Circle cx={cx + r * 0.35} cy={cy - r * 0.4} r={r * 0.35} fill="#FFFFFF" />
    </G>
  );
}

function Sparkle({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <Path
      d="M0 -10 C1.5 -2 2 -1.5 10 0 C2 1.5 1.5 2 0 10 C-1.5 2 -2 1.5 -10 0 C-2 -1.5 -1.5 -2 0 -10 Z"
      transform={`translate(${x} ${y}) scale(${s})`}
    />
  );
}
