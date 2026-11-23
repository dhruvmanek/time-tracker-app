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
  | 'music'
  | 'sleep'
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
  | 'crown'; // spare pose (not used yet)

/** Every illustrated pose Tikko can have. Only some have artwork so far. */
type PoseImage =
  | Act
  | 'happy'
  | 'wave'
  | 'wave-tired'
  | 'wave-drained'
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
  'wave-tired': { src: require('@/assets/mascot/wave-tired.png') },
  'wave-drained': { src: require('@/assets/mascot/wave-drained.png') },
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
  music: { src: require('@/assets/mascot/music.png') },
  dumbbell: { src: require('@/assets/mascot/dumbbell.png'), wide: 1.22 },
  book: { src: require('@/assets/mascot/book.png') },
  laptop: { src: require('@/assets/mascot/laptop.png') },
  crown: { src: require('@/assets/mascot/crown.png') },
  party: { src: require('@/assets/mascot/party.png'), wide: 1.1 },
  windup: { src: require('@/assets/mascot/windup.png'), wide: 1.02 },
  happy: { src: require('@/assets/mascot/happy.png') },
  think: { src: require('@/assets/mascot/think.png') },
  watch: { src: require('@/assets/mascot/watch.png') },
  shocked: { src: require('@/assets/mascot/shocked.png') },
  dreamy: { src: require('@/assets/mascot/dreamy.png') },
  ring: { src: require('@/assets/mascot/ring.png'), wide: 1.01 },
  notify: { src: require('@/assets/mascot/notify.png'), wide: 1.09 },
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
  // Wave in whatever mood Tikko is in.
  if (pose === 'wave') wanted.push(mood === 'drained' ? 'wave-drained' : mood === 'meh' ? 'wave-tired' : 'wave');
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
  size?: number;
  /** Increment to make Tikko do one small hop (e.g. after a check-in). */
  bounceKey?: number;
};

export function Tikko({ mood, pose = 'idle', prop, act, sleeping = false, size = 200, bounceKey = 0 }: Props) {
  const art = pickImage(mood, pose, prop, sleeping, act);
  const wide = art.wide ?? 1;
  const breathe = useSharedValue(0);
  const jump = useSharedValue(0);

  // Breathing: the body gently swells and settles from its feet. No movement
  // up or down, so it reads as breathing rather than bouncing. Slower when tired.
  useEffect(() => {
    const slow = sleeping || mood === 'drained' || mood === 'meh';
    breathe.value = withRepeat(
      withTiming(1, { duration: slow ? 3400 : 2600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breathe, mood, sleeping]);

  // After a check-in: one small, soft hop. No shaking.
  useEffect(() => {
    if (bounceKey === 0) return;
    jump.value = withSequence(
      withTiming(-14, { duration: 220, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 260, easing: Easing.in(Easing.quad) }),
    );
  }, [jump, bounceKey]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: jump.value },
      { scaleY: 1 + breathe.value * 0.018 },
      { scaleX: 1 + breathe.value * 0.008 },
    ],
  }));
  const shadowStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: 1 + Math.min(jump.value, 0) / 90 }],
    opacity: 0.07 + Math.min(jump.value, 0) / 800,
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: size * 0.018,
            left: size * 0.26,
            width: size * 0.48,
            height: size * 0.04,
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
