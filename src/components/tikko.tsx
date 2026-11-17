// Tikko: a little alarm-clock critter, drawn in a sticker style (thick outlines,
// flat colours). This is a code-drawn stand-in. Before launch, swap in
// illustrated, animated art (e.g. made in Rive) with the same moods and stages.

import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { Mood } from '@/lib/types';

type Props = {
  mood: Mood;
  /** 1 = plain, 2 = gold star badge (level 4+), 3 = crown (level 8+). */
  stage?: 1 | 2 | 3;
  size?: number;
  /** Increment to make Tikko jump and ring (e.g. after a check-in). */
  bounceKey?: number;
};

const INK = '#1E1A2E';

const LOOK: Record<Mood, { body: string; rim: string; face: string; bell: string; bellDark: string; bellAngle: number; drop: number }> = {
  radiant: { body: '#FF6F5B', rim: '#E5533F', face: '#FFF6E6', bell: '#FFC93C', bellDark: '#E0A82E', bellAngle: 22, drop: 0 },
  happy: { body: '#FF6F5B', rim: '#E5533F', face: '#FFF6E6', bell: '#FFC93C', bellDark: '#E0A82E', bellAngle: 28, drop: 0 },
  meh: { body: '#E99A86', rim: '#CF7F6C', face: '#FBF1E6', bell: '#E9C878', bellDark: '#C9A85A', bellAngle: 42, drop: 6 },
  drained: { body: '#A994B8', rim: '#8F7AA0', face: '#F1ECF4', bell: '#CDBB86', bellDark: '#B0A06C', bellAngle: 68, drop: 16 },
};

export function Tikko({ mood, stage = 1, size = 200, bounceKey = 0 }: Props) {
  const look = LOOK[mood];
  const breathe = useSharedValue(0);
  const jump = useSharedValue(0);
  const shake = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(1, { duration: mood === 'drained' ? 2600 : 1500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breathe, mood]);

  useEffect(() => {
    if (bounceKey === 0) return;
    jump.value = withSequence(
      withTiming(-30, { duration: 170, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 320, easing: Easing.bounce }),
    );
    shake.value = withSequence(
      ...Array.from({ length: 8 }, (_, i) => withTiming(i % 2 ? -7 : 7, { duration: 45 })),
      withTiming(0, { duration: 60 }),
    );
  }, [jump, shake, bounceKey]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: jump.value + breathe.value * -4 },
      { rotate: `${shake.value}deg` },
      { scaleY: 1 + breathe.value * 0.03 },
      { scaleX: 1 - breathe.value * 0.012 },
    ],
  }));

  const d = look.drop; // drained Tikko sags lower
  const cy = 118 + d;
  const eyeY = 112 + d;

  return (
    <View style={{ width: size, height: size * 1.1 }}>
      {/* Ground shadow stays put while Tikko bounces */}
      <Svg width="100%" height="100%" viewBox="0 0 200 220" style={{ position: 'absolute' }}>
        <Ellipse cx="100" cy="207" rx={58 + d / 2} ry="9" fill="#000" opacity={0.15} />
      </Svg>
      <Animated.View style={[{ width: '100%', height: '100%' }, style]}>
        <Svg width="100%" height="100%" viewBox="0 0 200 220">
          <G stroke={INK} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round">
            {/* Stage 3: crown */}
            {stage >= 3 && (
              <Path d={`M78 ${14 + d} L84 ${-6 + d} L94 ${8 + d} L100 ${-10 + d} L106 ${8 + d} L116 ${-6 + d} L122 ${14 + d} Z`} fill="#FFC93C" />
            )}
            {/* Top knob + bells */}
            <Rect x="90" y={18 + d} width="20" height="16" rx="5" fill={look.bell} />
            <G transform={`rotate(${-look.bellAngle} 58 ${54 + d})`}>
              <Path d={`M30 ${62 + d} a28 26 0 0 1 56 0 z`} fill={look.bell} />
            </G>
            <G transform={`rotate(${look.bellAngle} 142 ${54 + d})`}>
              <Path d={`M114 ${62 + d} a28 26 0 0 1 56 0 z`} fill={look.bell} />
            </G>
            {/* Legs */}
            {mood !== 'drained' && (
              <>
                <Path d="M72 182 v14 h-14" fill="none" />
                <Path d="M128 182 v14 h14" fill="none" />
              </>
            )}
            {/* Arms */}
            {mood === 'radiant' ? (
              <>
                <Ellipse cx="26" cy="96" rx="12" ry="16" fill={look.body} transform="rotate(30 26 96)" />
                <Ellipse cx="174" cy="96" rx="12" ry="16" fill={look.body} transform="rotate(-30 174 96)" />
              </>
            ) : (
              <>
                <Ellipse cx="29" cy={130 + d} rx="11" ry="15" fill={look.body} transform={`rotate(-20 29 ${130 + d})`} />
                <Ellipse cx="171" cy={130 + d} rx="11" ry="15" fill={look.body} transform={`rotate(20 171 ${130 + d})`} />
              </>
            )}
            {/* Body + face */}
            <Ellipse cx="100" cy={cy} rx={72 + d / 4} ry={72 - d / 4} fill={look.body} />
            <Ellipse cx="100" cy={cy} rx={56 + d / 5} ry={56 - d / 5} fill={look.face} />
          </G>

          {/* Soft shading on the face */}
          <Path d={`M48 ${cy + 26} a56 56 0 0 0 104 0 a64 60 0 0 1 -104 0z`} fill={look.rim} opacity={0.12} />
          {/* Hour dots */}
          <G fill={look.rim} opacity={0.35}>
            <Circle cx="100" cy={cy - 46} r="4.5" />
            <Circle cx="146" cy={cy} r="4.5" />
            <Circle cx="54" cy={cy} r="4.5" />
          </G>
          {/* Shine on the rim */}
          <Path d={`M55 ${cy - 45} A64 64 0 0 1 89 ${cy - 63}`} stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.6} />

          {/* Stage 2+: star badge */}
          {stage >= 2 && (
            <Path
              d="M0 -11 L3.2 -3.5 L11 -3.4 L5 1.8 L7 9.6 L0 5.2 L-7 9.6 L-5 1.8 L-11 -3.4 L-3.2 -3.5 Z"
              transform={`translate(150 ${cy + 44})`}
              fill="#FFC93C"
              stroke={INK}
              strokeWidth={3}
              strokeLinejoin="round"
            />
          )}

          <Face mood={mood} eyeY={eyeY} />

          {/* Ringing lines when radiant */}
          {mood === 'radiant' && (
            <G stroke={INK} strokeWidth={4} strokeLinecap="round">
              <Path d="M14 46 l-10 -6 M12 62 h-10 M186 46 l10 -6 M188 62 h10" />
            </G>
          )}
          {/* Sweat drop when drained */}
          {mood === 'drained' && (
            <Path d="M150 74 q10 14 0 19 q-10 -5 0 -19z" fill="#8FC9F5" stroke={INK} strokeWidth={3} />
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}

function Face({ mood, eyeY }: { mood: Mood; eyeY: number }) {
  const mouthY = eyeY + 22;
  const cheeks = (
    <G fill="#FF8C8C" opacity={0.6}>
      <Ellipse cx="66" cy={eyeY + 22} rx="10" ry="6" />
      <Ellipse cx="134" cy={eyeY + 22} rx="10" ry="6" />
    </G>
  );
  switch (mood) {
    case 'radiant':
      return (
        <G>
          <Path
            d={`M70 ${eyeY + 4} q10 -15 20 0 M110 ${eyeY + 4} q10 -15 20 0`}
            stroke={INK}
            strokeWidth={5.5}
            fill="none"
            strokeLinecap="round"
          />
          {cheeks}
          <Path d={`M84 ${mouthY - 2} q16 24 32 0 z`} fill={INK} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <Path d={`M93 ${mouthY + 8} q7 5 14 0`} fill="#FF8C8C" />
        </G>
      );
    case 'happy':
      return (
        <G>
          <Eye cx={80} cy={eyeY} rx={10} ry={13} />
          <Eye cx={120} cy={eyeY} rx={10} ry={13} />
          {cheeks}
          <Path d={`M89 ${mouthY - 1} q11 13 22 0`} stroke={INK} strokeWidth={5.5} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'meh':
      return (
        <G>
          <Eye cx={80} cy={eyeY} rx={8} ry={10} />
          <Eye cx={120} cy={eyeY} rx={8} ry={10} />
          <Path d={`M90 ${mouthY + 2} h20`} stroke={INK} strokeWidth={5} strokeLinecap="round" />
        </G>
      );
    case 'drained':
      return (
        <G>
          <Ellipse cx="80" cy={eyeY + 4} rx="9" ry="8" fill={INK} />
          <Ellipse cx="120" cy={eyeY + 4} rx="9" ry="8" fill={INK} />
          {/* heavy eyelids */}
          <Rect x="68" y={eyeY - 8} width="24" height="11" fill="#F1ECF4" />
          <Rect x="108" y={eyeY - 8} width="24" height="11" fill="#F1ECF4" />
          <Path d={`M69 ${eyeY + 2} h22 M109 ${eyeY + 2} h22`} stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
          <Path
            d={`M86 ${mouthY + 6} q7 -7 14 0 q7 7 14 0`}
            stroke={INK}
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
          />
        </G>
      );
  }
}

function Eye({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  return (
    <G>
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={INK} />
      <Circle cx={cx + rx * 0.4} cy={cy - ry * 0.45} r={rx * 0.42} fill="#FFFFFF" />
    </G>
  );
}
