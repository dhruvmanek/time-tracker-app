// Tikko: a little alarm-clock critter, drawn in a sticker style (thick outlines,
// flat colours), with arms, legs, poses and props for each activity.
//
// This is a code-drawn stand-in. Before launch, an illustrator should redraw it
// (and an animator bring it to life in Rive) using the same moods, poses and props.

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import type { Mood } from '@/lib/types';

export type Pose = 'idle' | 'wave' | 'cheer' | 'hold';
export type PropId =
  | 'laptop'
  | 'book'
  | 'dumbbell'
  | 'phone'
  | 'gamepad'
  | 'mug'
  | 'basket'
  | 'heart'
  | 'wheel'
  | 'clipboard'
  | 'swirl'
  | 'sunglasses';

type Props = {
  mood: Mood;
  pose?: Pose;
  /** Something Tikko is holding or wearing. Held props switch Tikko to the "hold" pose. */
  prop?: PropId;
  /** 1 = plain, 2 = gold star badge (level 4+), 3 = crown (level 8+). */
  stage?: 1 | 2 | 3;
  size?: number;
  /** Increment to make Tikko jump and ring (e.g. after a check-in or a tap). */
  bounceKey?: number;
};

const INK = '#1E1A2E';

const LOOK: Record<Mood, { body: string; rim: string; face: string; bell: string; bellAngle: number; drop: number }> = {
  radiant: { body: '#FF6F5B', rim: '#E5533F', face: '#FFF6E6', bell: '#FFC93C', bellAngle: 22, drop: 0 },
  happy: { body: '#FF6F5B', rim: '#E5533F', face: '#FFF6E6', bell: '#FFC93C', bellAngle: 28, drop: 0 },
  meh: { body: '#E99A86', rim: '#CF7F6C', face: '#FBF1E6', bell: '#E9C878', bellAngle: 42, drop: 6 },
  drained: { body: '#A994B8', rim: '#8F7AA0', face: '#F1ECF4', bell: '#CDBB86', bellAngle: 68, drop: 16 },
};

/** Props drawn in Tikko's hands (the rest are worn or float nearby). */
const HELD: PropId[] = ['laptop', 'book', 'dumbbell', 'phone', 'gamepad', 'mug', 'basket', 'heart', 'wheel', 'clipboard'];

export function Tikko({ mood, pose = 'idle', prop, stage = 1, size = 200, bounceKey = 0 }: Props) {
  const look = LOOK[mood];
  const breathe = useSharedValue(0);
  const jump = useSharedValue(0);
  const shake = useSharedValue(0);
  const holding = prop ? HELD.includes(prop) : false;
  const activePose: Pose = holding ? 'hold' : mood === 'drained' && pose === 'idle' ? 'idle' : pose;

  // Waving: flip between two hand positions.
  const [waveFrame, setWaveFrame] = useState(0);
  useEffect(() => {
    if (activePose !== 'wave') return;
    const t = setInterval(() => setWaveFrame((f) => 1 - f), 330);
    return () => clearInterval(t);
  }, [activePose]);

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
  const cy = 112 + d;
  const eyeY = 106 + d;
  const color = look.body;

  // Hand positions per pose: [left, right]
  const hands: Record<Pose, [[number, number], [number, number]]> = {
    idle: mood === 'drained' ? [[26, cy + 58], [174, cy + 58]] : [[22, cy + 44], [178, cy + 44]],
    wave: [[22, cy + 44], waveFrame ? [186, cy - 62] : [172, cy - 72]],
    cheer: [[18, cy - 58], [182, cy - 58]],
    hold: [[70, cy + 68], [130, cy + 68]],
  };
  const [lh, rh] = hands[activePose];
  const inFront = activePose === 'hold';

  // Holding: arms come out from the sides and wrap round to the front, like a hug.
  const leftArm = inFront
    ? `M46 ${cy + 16} Q10 ${cy + 64} ${lh[0]} ${lh[1]}`
    : `M50 ${cy + 6} Q${lh[0] + 4} ${(cy + 6 + lh[1]) / 2} ${lh[0]} ${lh[1]}`;
  const rightArm = inFront
    ? `M154 ${cy + 16} Q190 ${cy + 64} ${rh[0]} ${rh[1]}`
    : `M150 ${cy + 6} Q${rh[0] - 4} ${(cy + 6 + rh[1]) / 2} ${rh[0]} ${rh[1]}`;

  const sitting = mood === 'drained';
  const legs = sitting
    ? { l: `M74 ${cy + 52} L52 ${cy + 76}`, r: `M126 ${cy + 52} L148 ${cy + 76}`, lf: [46, cy + 80], rf: [154, cy + 80] }
    : { l: `M78 ${cy + 58} L74 ${cy + 88}`, r: `M122 ${cy + 58} L126 ${cy + 88}`, lf: [68, cy + 92], rf: [132, cy + 92] };

  return (
    <View style={{ width: size, height: size * 1.1 }}>
      <Svg width="100%" height="100%" viewBox="0 0 200 220" style={{ position: 'absolute' }}>
        <Ellipse cx="100" cy="210" rx={56 + d} ry="8" fill="#000" opacity={0.15} />
      </Svg>
      <Animated.View style={[{ width: '100%', height: '100%' }, style]}>
        <Svg width="100%" height="100%" viewBox="0 0 200 220">
          {/* Legs + feet (behind the body) */}
          <Limb d={legs.l} color={color} />
          <Limb d={legs.r} color={color} />
          <Ellipse cx={legs.lf[0]} cy={legs.lf[1]} rx="14" ry="8" fill={look.rim} stroke={INK} strokeWidth={4} />
          <Ellipse cx={legs.rf[0]} cy={legs.rf[1]} rx="14" ry="8" fill={look.rim} stroke={INK} strokeWidth={4} />

          {/* Arms (behind the body; hands are drawn on top later) */}
          <Limb d={leftArm} color={color} />
          <Limb d={rightArm} color={color} />

          <G stroke={INK} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round">
            {stage >= 3 && (
              <Path
                d={`M78 ${8 + d} L84 ${-12 + d} L94 ${2 + d} L100 ${-16 + d} L106 ${2 + d} L116 ${-12 + d} L122 ${8 + d} Z`}
                fill="#FFC93C"
              />
            )}
            {/* Top knob + bells */}
            <Rect x="90" y={12 + d} width="20" height="16" rx="5" fill={look.bell} />
            <G transform={`rotate(${-look.bellAngle} 58 ${48 + d})`}>
              <Path d={`M30 ${56 + d} a28 26 0 0 1 56 0 z`} fill={look.bell} />
            </G>
            <G transform={`rotate(${look.bellAngle} 142 ${48 + d})`}>
              <Path d={`M114 ${56 + d} a28 26 0 0 1 56 0 z`} fill={look.bell} />
            </G>
            {/* Body + face */}
            <Ellipse cx="100" cy={cy} rx={72 + d / 4} ry={72 - d / 4} fill={color} />
            <Ellipse cx="100" cy={cy} rx={56 + d / 5} ry={56 - d / 5} fill={look.face} />
          </G>

          {/* Face shading, hour dots, rim shine */}
          <Path d={`M48 ${cy + 26} a56 56 0 0 0 104 0 a64 60 0 0 1 -104 0z`} fill={look.rim} opacity={0.12} />
          <G fill={look.rim} opacity={0.35}>
            <Circle cx="100" cy={cy - 46} r="4.5" />
            <Circle cx="146" cy={cy} r="4.5" />
            <Circle cx="54" cy={cy} r="4.5" />
          </G>
          <Path d={`M55 ${cy - 45} A64 64 0 0 1 89 ${cy - 63}`} stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.6} />

          {stage >= 2 && (
            <Path
              d="M0 -11 L3.2 -3.5 L11 -3.4 L5 1.8 L7 9.6 L0 5.2 L-7 9.6 L-5 1.8 L-11 -3.4 L-3.2 -3.5 Z"
              transform={`translate(${inFront ? 158 : 150} ${cy + (inFront ? -40 : 44)})`}
              fill="#FFC93C"
              stroke={INK}
              strokeWidth={3}
              strokeLinejoin="round"
            />
          )}

          <Face mood={mood} eyeY={eyeY} lookDown={prop === 'phone' || prop === 'book' || prop === 'laptop' || prop === 'gamepad'} />

          {prop === 'sunglasses' && <Sunglasses y={eyeY} />}

          {/* Held prop + arms in front */}
          {inFront && prop && (
            <G transform={`translate(100 ${cy + 62})`}>
              <HeldProp id={prop} />
            </G>
          )}

          {/* Hands on top */}
          <Circle cx={lh[0]} cy={lh[1]} r="10" fill={color} stroke={INK} strokeWidth={4} />
          <Circle cx={rh[0]} cy={rh[1]} r="10" fill={color} stroke={INK} strokeWidth={4} />

          {prop === 'swirl' && (
            <Path
              d="M0 0 m-16 0 a16 12 0 1 0 32 0 a11 8 0 1 0 -22 0 a6 4 0 1 0 12 0"
              transform={`translate(172 ${30 + d})`}
              stroke="#7C5CFF"
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
            />
          )}

          {mood === 'radiant' && activePose !== 'cheer' && (
            <G stroke={INK} strokeWidth={4} strokeLinecap="round">
              <Path d="M14 40 l-10 -6 M12 56 h-10 M186 40 l10 -6 M188 56 h10" />
            </G>
          )}
          {mood === 'drained' && (
            <Path d="M152 66 q10 14 0 19 q-10 -5 0 -19z" fill="#8FC9F5" stroke={INK} strokeWidth={3} />
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}

/** A thick outlined tube for arms and legs. */
function Limb({ d, color }: { d: string; color: string }) {
  return (
    <G fill="none" strokeLinecap="round" strokeLinejoin="round">
      <Path d={d} stroke={INK} strokeWidth={17} />
      <Path d={d} stroke={color} strokeWidth={9} />
    </G>
  );
}

function Face({ mood, eyeY, lookDown }: { mood: Mood; eyeY: number; lookDown?: boolean }) {
  const mouthY = eyeY + 22;
  const look = lookDown ? 3 : 0;
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
          <Path d={`M70 ${eyeY + 4} q10 -15 20 0 M110 ${eyeY + 4} q10 -15 20 0`} stroke={INK} strokeWidth={5.5} fill="none" strokeLinecap="round" />
          {cheeks}
          <Path d={`M84 ${mouthY - 2} q16 24 32 0 z`} fill={INK} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <Path d={`M93 ${mouthY + 8} q7 5 14 0`} fill="#FF8C8C" />
        </G>
      );
    case 'happy':
      return (
        <G>
          <Eye cx={80} cy={eyeY + look} rx={10} ry={13} />
          <Eye cx={120} cy={eyeY + look} rx={10} ry={13} />
          {cheeks}
          <Path d={`M89 ${mouthY - 1} q11 13 22 0`} stroke={INK} strokeWidth={5.5} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'meh':
      return (
        <G>
          <Eye cx={80} cy={eyeY + look} rx={8} ry={10} />
          <Eye cx={120} cy={eyeY + look} rx={8} ry={10} />
          <Path d={`M90 ${mouthY + 2} h20`} stroke={INK} strokeWidth={5} strokeLinecap="round" />
        </G>
      );
    case 'drained':
      return (
        <G>
          <Ellipse cx="80" cy={eyeY + 4} rx="9" ry="8" fill={INK} />
          <Ellipse cx="120" cy={eyeY + 4} rx="9" ry="8" fill={INK} />
          <Rect x="68" y={eyeY - 8} width="24" height="11" fill="#F1ECF4" />
          <Rect x="108" y={eyeY - 8} width="24" height="11" fill="#F1ECF4" />
          <Path d={`M69 ${eyeY + 2} h22 M109 ${eyeY + 2} h22`} stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
          <Path d={`M86 ${mouthY + 6} q7 -7 14 0 q7 7 14 0`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
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

function Sunglasses({ y }: { y: number }) {
  return (
    <G stroke={INK} strokeWidth={4} strokeLinejoin="round">
      <Path d={`M62 ${y - 10} h34 v10 q0 12 -17 12 q-17 0 -17 -12 z`} fill={INK} />
      <Path d={`M104 ${y - 10} h34 v10 q0 12 -17 12 q-17 0 -17 -12 z`} fill={INK} />
      <Line x1="96" y1={y - 6} x2="104" y2={y - 6} />
      <Path d={`M70 ${y - 6} l8 -3`} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
    </G>
  );
}

/** Props are drawn around (0, 0), roughly 70×50, in the same sticker style. */
function HeldProp({ id }: { id: PropId }) {
  const s = { stroke: INK, strokeWidth: 4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  switch (id) {
    case 'laptop':
      return (
        <G {...s}>
          <Rect x="-36" y="-30" width="72" height="44" rx="6" fill="#C3CBDD" />
          <Circle cx="0" cy="-8" r="6" fill="#FFFFFF" />
          <Rect x="-44" y="12" width="88" height="10" rx="5" fill="#8E9BB0" />
        </G>
      );
    case 'book':
      return (
        <G {...s}>
          <Path d="M0 -20 Q-20 -30 -40 -22 V18 Q-20 10 0 20 Z" fill="#FFFFFF" />
          <Path d="M0 -20 Q20 -30 40 -22 V18 Q20 10 0 20 Z" fill="#FFFFFF" />
          <Path d="M-40 18 Q-20 10 0 20 Q20 10 40 18 V24 Q20 16 0 26 Q-20 16 -40 24 Z" fill="#3E9BE0" />
          <Path d="M-32 -12 h20 M-32 -2 h20 M12 -12 h20 M12 -2 h20" strokeWidth={2.5} />
        </G>
      );
    case 'dumbbell':
      return (
        <G {...s}>
          <Rect x="-30" y="-4" width="60" height="8" rx="4" fill="#8E9BB0" />
          <Rect x="-46" y="-20" width="16" height="40" rx="5" fill="#3D3A4F" />
          <Rect x="30" y="-20" width="16" height="40" rx="5" fill="#3D3A4F" />
        </G>
      );
    case 'phone':
      return (
        <G {...s}>
          <Rect x="-16" y="-28" width="32" height="54" rx="7" fill="#2B2838" />
          <Rect x="-11" y="-22" width="22" height="40" rx="3" fill="#7FD3FF" strokeWidth={0} />
          <Path d="M-6 -12 h12 M-6 -4 h8 M-6 4 h12" stroke="#FFFFFF" strokeWidth={2.5} />
        </G>
      );
    case 'gamepad':
      return (
        <G {...s}>
          <Path d="M-38 -10 Q-38 -20 -26 -20 H26 Q38 -20 38 -10 L44 14 Q46 24 36 24 Q28 24 22 14 H-22 Q-28 24 -36 24 Q-46 24 -44 14 Z" fill="#6B6F86" />
          <Path d="M-26 -4 v12 M-32 2 h12" stroke="#FFFFFF" strokeWidth={4} />
          <Circle cx="22" cy="-2" r="4" fill="#FF6F5B" strokeWidth={2.5} />
          <Circle cx="31" cy="6" r="4" fill="#4FD15E" strokeWidth={2.5} />
        </G>
      );
    case 'mug':
      return (
        <G {...s}>
          <Path d="M-8 -34 q-6 -8 0 -14 M4 -34 q-6 -8 0 -14" fill="none" stroke="#B8B2C8" strokeWidth={3.5} />
          <Path d="M18 -14 q16 0 16 12 q0 12 -16 12" fill="none" strokeWidth={6} />
          <Rect x="-24" y="-24" width="44" height="46" rx="10" fill="#FFFFFF" />
          <Path d="M-14 -4 q6 -8 12 0 q6 -8 12 0 q0 10 -12 16 q-12 -6 -12 -16z" fill="#FF8C8C" strokeWidth={2.5} />
        </G>
      );
    case 'basket':
      return (
        <G {...s}>
          <Path d="M-30 -12 Q0 -46 30 -12" fill="none" strokeWidth={5} />
          <Path d="M-40 -12 H40 L32 24 H-32 Z" fill="#E8B76A" />
          <Path d="M-22 -12 L-18 24 M0 -12 V24 M22 -12 L18 24 M-36 6 H36" strokeWidth={2.5} />
        </G>
      );
    case 'heart':
      return (
        <G {...s}>
          <Path d="M0 24 C-40 -2 -36 -32 -16 -30 C-6 -29 -2 -22 0 -16 C2 -22 6 -29 16 -30 C36 -32 40 -2 0 24 Z" fill="#FF5C7A" />
          <Path d="M-18 -18 q-8 4 -8 12" stroke="#FFFFFF" strokeWidth={3.5} fill="none" />
        </G>
      );
    case 'wheel':
      return (
        <G {...s}>
          <Circle cx="0" cy="0" r="28" fill="none" strokeWidth={14} />
          <Circle cx="0" cy="0" r="28" fill="none" stroke="#5A5670" strokeWidth={7} />
          <Circle cx="0" cy="0" r="8" fill="#5A5670" />
          <Path d="M-26 0 H-8 M8 0 H26 M0 8 V26" strokeWidth={6} />
        </G>
      );
    case 'clipboard':
      return (
        <G {...s}>
          <Rect x="-28" y="-30" width="56" height="58" rx="6" fill="#C9935A" />
          <Rect x="-20" y="-20" width="40" height="42" rx="3" fill="#FFFFFF" />
          <Rect x="-12" y="-36" width="24" height="12" rx="4" fill="#8E9BB0" />
          <Path d="M-12 -8 h24 M-12 2 h24 M-12 12 h14" strokeWidth={2.5} />
        </G>
      );
    default:
      return null;
  }
}
