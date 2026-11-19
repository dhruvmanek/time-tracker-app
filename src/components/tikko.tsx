// Tikko, the mascot: illustrated poses (PNG files in assets/mascot) brought to
// life in code with breathing, a gentle sway, a jump-and-ring when tapped, and a
// soft cross-fade whenever the pose changes.
//
// Adding a new pose: drop a transparent PNG cut from the same frame into
// assets/mascot and add one line to POSE_IMAGES below. Until a pose has an
// image, Tikko falls back to the closest mood pose.

import { Image } from 'expo-image';
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

import type { Mood } from '@/lib/types';

export type Pose = 'idle' | 'wave' | 'cheer' | 'hold';

/** Something Tikko is holding or doing, one per activity (plus a few extras). */
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
  | 'lotus'
  | 'swirl'
  | 'sunglasses';

/** One-off acted moments, used on specific screens (onboarding, rewards). */
export type Act =
  | 'think' // hand on chin
  | 'watch' // looking at its wristwatch
  | 'shocked' // hands on cheeks
  | 'dreamy' // hearts in eyes
  | 'notify' // holding a phone showing a notification
  | 'windup' // big wind-up key in its back
  | 'party' // confetti
  | 'ring' // bells ringing loudly
  | 'crown'; // level up

/** Every illustrated pose Tikko can have. Only some have artwork so far. */
type PoseImage =
  | Act
  | 'happy'
  | 'wave'
  | 'cheer'
  | 'tired'
  | 'drained'
  | 'sleep'
  | PropId;

/** Pose artwork. `wide` is for scenes wider than Tikko (e.g. the couch): the image
 * spills out sideways while Tikko itself stays the same size and position. */
type PoseArt = { src: number; wide?: number };

const POSE_IMAGES: Partial<Record<PoseImage, PoseArt>> = {
  wave: { src: require('@/assets/mascot/wave.png') },
  cheer: { src: require('@/assets/mascot/cheer.png') },
  tired: { src: require('@/assets/mascot/tired.png') },
  drained: { src: require('@/assets/mascot/drained.png') },
  sleep: { src: require('@/assets/mascot/sleep.png') },
  gamepad: { src: require('@/assets/mascot/gamepad.png') },
  swirl: { src: require('@/assets/mascot/swirl.png'), wide: 1.51 },
  mug: { src: require('@/assets/mascot/mug.png') },
  wheel: { src: require('@/assets/mascot/wheel.png') },
  phone: { src: require('@/assets/mascot/phone.png') },
  clipboard: { src: require('@/assets/mascot/clipboard.png') },
  heart: { src: require('@/assets/mascot/heart.png') },
  basket: { src: require('@/assets/mascot/basket.png') },
  lotus: { src: require('@/assets/mascot/lotus.png'), wide: 1.01 },
  dumbbell: { src: require('@/assets/mascot/dumbbell.png'), wide: 1.22 },
  book: { src: require('@/assets/mascot/book.png') },
  laptop: { src: require('@/assets/mascot/laptop.png') },
  crown: { src: require('@/assets/mascot/crown.png') },
  party: { src: require('@/assets/mascot/party.png'), wide: 1.1 },
  windup: { src: require('@/assets/mascot/windup.png'), wide: 1.02 },
};

const MOOD_IMAGE: Record<Mood, PoseImage> = {
  radiant: 'cheer',
  happy: 'happy',
  meh: 'tired',
  drained: 'drained',
};

/** Pick the best available artwork, falling back gracefully. */
function pickImage(mood: Mood, pose: Pose, prop: PropId | undefined, sleeping: boolean, act?: Act): PoseArt {
  const wanted: PoseImage[] = [];
  if (sleeping) wanted.push('sleep');
  if (act) wanted.push(act);
  if (prop) wanted.push(prop);
  if (pose === 'cheer') wanted.push('cheer');
  if (pose === 'wave') wanted.push('wave');
  wanted.push(MOOD_IMAGE[mood]);
  // Last resorts, in order: friendly wave, then anything we have.
  wanted.push(mood === 'drained' || mood === 'meh' ? 'tired' : 'wave');
  for (const key of wanted) {
    const img = POSE_IMAGES[key];
    if (img) return img;
  }
  return POSE_IMAGES.wave!;
}

type Props = {
  mood: Mood;
  pose?: Pose;
  prop?: PropId;
  /** A one-off acted pose for a specific screen. */
  act?: Act;
  /** Show Tikko asleep (outside your tracked hours). */
  sleeping?: boolean;
  /** Level stage. Reserved for crown/badge artwork; not shown yet. */
  stage?: 1 | 2 | 3;
  size?: number;
  /** Increment to make Tikko jump and ring (e.g. after a check-in or a tap). */
  bounceKey?: number;
};

export function Tikko({ mood, pose = 'idle', prop, act, sleeping = false, size = 200, bounceKey = 0 }: Props) {
  const art = pickImage(mood, pose, prop, sleeping, act);
  const wide = art.wide ?? 1;
  const breathe = useSharedValue(0);
  const sway = useSharedValue(0);
  const jump = useSharedValue(0);
  const shake = useSharedValue(0);

  // Breathing: slower and heavier when tired or asleep.
  useEffect(() => {
    const slow = sleeping || mood === 'drained' || mood === 'meh';
    breathe.value = withRepeat(
      withTiming(1, { duration: slow ? 2600 : 1500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    sway.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [breathe, sway, mood, sleeping]);

  // Tap / check-in: squash, jump, and a quick ringing wiggle.
  useEffect(() => {
    if (bounceKey === 0) return;
    jump.value = withSequence(
      withTiming(1, { duration: 90 }),
      withTiming(-34, { duration: 180, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 340, easing: Easing.bounce }),
    );
    shake.value = withSequence(
      ...Array.from({ length: 10 }, (_, i) => withTiming(i % 2 ? -6 : 6, { duration: 40 })),
      withTiming(0, { duration: 60 }),
    );
  }, [jump, shake, bounceKey]);

  const bodyStyle = useAnimatedStyle(() => {
    const squash = jump.value > 0 ? jump.value * 0.08 : 0; // little crouch before the jump
    return {
      transform: [
        { translateY: Math.min(jump.value, 0) + breathe.value * -3 },
        { rotate: `${shake.value + (sway.value - 0.5) * 2.4}deg` },
        { scaleY: 1 + breathe.value * 0.025 - squash },
        { scaleX: 1 - breathe.value * 0.01 + squash },
      ],
    };
  });
  const shadowStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: 1 + Math.min(jump.value, 0) / 90 }],
    opacity: 0.16 + Math.min(jump.value, 0) / 400,
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: size * 0.018,
            left: size * 0.22,
            width: size * 0.56,
            height: size * 0.07,
            borderRadius: size,
            backgroundColor: '#000',
          },
          shadowStyle,
        ]}
      />
      <Animated.View style={[{ width: size, height: size, transformOrigin: 'bottom' }, bodyStyle]}>
        <Image
          source={art.src}
          style={{ width: size * wide, height: size, marginLeft: (size - size * wide) / 2 }}
          contentFit="contain"
          transition={180}
        />
      </Animated.View>
    </View>
  );
}
