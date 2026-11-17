// First-run onboarding: a short quiz that personalises Tikko, a "this is your life"
// moment, choosing waking hours, a commitment step (hold to wind up Tikko), and
// notification permission. The paywall will slot in right before finishing.

import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  HoldToWind,
  HoursSlider,
  NotificationPreview,
  OptionList,
  ProgressHeader,
  type Option,
} from '@/components/onboarding-kit';
import { Scene } from '@/components/scene';
import { Tikko } from '@/components/tikko';
import { Typewriter } from '@/components/typewriter';
import { BigNumber, Button, Card } from '@/components/ui';
import { C, F, R, S } from '@/constants/theme';
import { requestPermission, rescheduleAll } from '@/lib/notifications';
import { checkInHours } from '@/lib/stats';
import { completeOnboarding, updateProfile, updateSettings } from '@/lib/store';
import { formatHour } from '@/lib/time';
import type { Mood } from '@/lib/types';

// ---- Quiz content ----

const GOALS: Option[] = [
  { id: 'waste', emoji: '🕳️', label: 'Stop wasting time' },
  { id: 'productive', emoji: '🚀', label: 'Get more done' },
  { id: 'habits', emoji: '🌱', label: 'Build better habits' },
  { id: 'understand', emoji: '🔍', label: 'See where my day goes' },
  { id: 'curious', emoji: '🤔', label: 'Just curious' },
];

/** Ids match activity categories, so the top pick becomes a quick-log button. */
const SINKS: Option[] = [
  { id: 'scroll', emoji: '📱', label: 'Social media' },
  { id: 'tv', emoji: '🎮', label: 'YouTube, TV & games' },
  { id: 'procrastinate', emoji: '🌀', label: 'Procrastinating / overthinking' },
  { id: 'meetings', emoji: '📅', label: 'Meetings & admin' },
  { id: 'commute', emoji: '🚗', label: 'Commuting' },
  { id: 'unsure', emoji: '🤷', label: 'Honestly, no idea' },
];

const PERSONAS: Option[] = [
  { id: 'student', emoji: '🎓', label: 'Student' },
  { id: 'professional', emoji: '💼', label: 'Working professional' },
  { id: 'founder', emoji: '🛠️', label: 'Founder / creator' },
  { id: 'freelancer', emoji: '💻', label: 'Freelancer' },
  { id: 'parent', emoji: '👨‍👩‍👧', label: 'Parent' },
  { id: 'other', emoji: '✨', label: 'Something else' },
];

const AGES: (Option & { mid: number })[] = [
  { id: 'u18', emoji: '🧒', label: 'Under 18', mid: 16 },
  { id: '18', emoji: '🧑', label: '18–24', mid: 21 },
  { id: '25', emoji: '🧑‍💼', label: '25–34', mid: 30 },
  { id: '35', emoji: '🧔', label: '35–44', mid: 40 },
  { id: '45', emoji: '👩‍🦳', label: '45–54', mid: 50 },
  { id: '55', emoji: '🧓', label: '55+', mid: 60 },
];

const DREAMS: Option[] = [
  { id: 'Learning', emoji: '📚', label: 'Learning new things' },
  { id: 'Fitness', emoji: '💪', label: 'Getting fit' },
  { id: 'Family time', emoji: '👨‍👩‍👧', label: 'Family & friends' },
  { id: 'Building', emoji: '🚀', label: 'Building something of my own' },
  { id: 'Hobbies', emoji: '🎨', label: 'Hobbies & creativity' },
  { id: 'Rest', emoji: '😌', label: 'Proper rest' },
];

const STEPS = ['welcome', 'goal', 'sinks', 'persona', 'age', 'hours', 'shock', 'dream', 'schedule', 'how', 'wind', 'notify'] as const;
type Step = (typeof STEPS)[number];

/** Steps drawn over Tikko's world (the rest use the plain lavender page). */
const SCENE_STEPS: Partial<Record<Step, Mood>> = {
  welcome: 'happy',
  shock: 'drained',
  wind: 'happy',
  notify: 'radiant',
};

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const step = STEPS[i];

  // Answers
  const [goal, setGoal] = useState<string[]>([]);
  const [sinks, setSinks] = useState<string[]>([]);
  const [persona, setPersona] = useState<string[]>([]);
  const [age, setAge] = useState<string[]>([]);
  const [hours, setHours] = useState(3);
  const [dream, setDream] = useState<string[]>([]);
  const [dayStart, setDayStart] = useState(8);
  const [dayEnd, setDayEnd] = useState(23);
  const [interval, setIntervalHours] = useState<1 | 2>(1);
  const [wound, setWound] = useState(false);

  const next = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setI((n) => Math.min(n + 1, STEPS.length - 1));
  };
  const back = i > 0 ? () => setI((n) => n - 1) : undefined;

  // Auto-advance a moment after Tikko is wound up.
  useEffect(() => {
    if (step !== 'wind' || !wound) return;
    const t = setTimeout(next, 1400);
    return () => clearTimeout(t);
  }, [step, wound]);

  // The "this is your life" maths: hours lost per day until age 80, as full years.
  const ageMid = AGES.find((a) => a.id === age[0])?.mid ?? 30;
  const yearsLeft = Math.max(10, 80 - ageMid);
  const lostYears = (hours * yearsLeft) / 24;
  const fmtYears = (y: number) => (y >= 10 ? Math.round(y).toString() : y.toFixed(1));
  const dreamLabel = dream[0] ?? 'Learning';

  const finish = async (askPermission: boolean) => {
    updateProfile({
      goal: goal[0],
      sinks: sinks.filter((s) => s !== 'unsure'),
      persona: persona[0],
      ageGroup: age[0],
      hoursLost: hours,
      dream: dream[0],
    });
    updateSettings({ dayStart, dayEnd, interval });
    const granted = askPermission ? await requestPermission() : false;
    updateSettings({ notificationsOn: granted });
    completeOnboarding();
    await rescheduleAll();
    router.replace('/');
  };

  const single = (set: (v: string[]) => void) => (id: string) => set([id]);
  const multi = (list: string[], set: (v: string[]) => void) => (id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  // ---- Screens ----
  let body: ReactNode;
  let cta: ReactNode;
  const continueBtn = (disabled = false, label = 'Continue') => <Button label={label} onPress={next} disabled={disabled} />;

  switch (step) {
    case 'welcome':
      body = (
        <View style={styles.center}>
          <Tikko mood="happy" pose="wave" size={230} bounceKey={1} />
          <Card style={styles.welcomeCard}>
            <Typewriter text="Hi, I’m Tikko!" style={styles.bigTitle} delay={300} />
            <Typewriter
              text="I’m a little alarm clock who helps you find out where your time really goes."
              style={styles.lead}
              delay={800}
              speed={20}
            />
          </Card>
        </View>
      );
      cta = continueBtn(false, 'Get started');
      break;
    case 'goal':
      body = (
        <Question title="What do you want from Tikko?">
          <OptionList options={GOALS} selected={goal} onToggle={single(setGoal)} />
        </Question>
      );
      cta = continueBtn(goal.length === 0);
      break;
    case 'sinks':
      body = (
        <Question title="Where does your time slip away?" subtitle="Pick all that apply.">
          <OptionList options={SINKS} selected={sinks} onToggle={multi(sinks, setSinks)} />
        </Question>
      );
      cta = continueBtn(sinks.length === 0);
      break;
    case 'persona':
      body = (
        <Question title="Which best describes you?">
          <OptionList options={PERSONAS} selected={persona} onToggle={single(setPersona)} />
        </Question>
      );
      cta = continueBtn(persona.length === 0);
      break;
    case 'age':
      body = (
        <Question title="How old are you?" subtitle="Used for one quick calculation. Nothing leaves your phone.">
          <OptionList options={AGES} selected={age} onToggle={single(setAge)} />
        </Question>
      );
      cta = continueBtn(age.length === 0);
      break;
    case 'hours':
      body = (
        <Question title="How many hours a day do you think you lose?" subtitle="Be honest. Tikko doesn’t judge.">
          <View style={{ alignItems: 'center', marginVertical: S.lg }}>
            <BigNumber value={hours % 1 ? hours.toFixed(1) : String(hours)} suffix={hours === 1 ? ' hour' : ' hours'} size={72} />
          </View>
          <HoursSlider value={hours} onChange={setHours} />
          <Text style={[styles.lead, { marginTop: S.md }]}>
            That’s about {Math.round(hours * 7)} hours a week, or {Math.round((hours * 365) / 24)} full days a year.
          </Text>
        </Question>
      );
      cta = continueBtn(false);
      break;
    case 'shock':
      body = (
        <View style={styles.center}>
          <Tikko mood="drained" prop="phone" size={170} />
          <Animated.View entering={FadeInDown.delay(150)} style={styles.shockCard}>
            <Typewriter text={`At ${hours} hours a day, by age 80 you’ll lose`} style={styles.shockSmall} />
            <Animated.View entering={ZoomIn.delay(500).springify().damping(10)}>
              <BigNumber value={fmtYears(lostYears)} suffix=" years" size={80} />
            </Animated.View>
            <Typewriter
              text={`That’s ${fmtYears(lostYears)} full years of your life, gone without noticing.`}
              style={styles.shockSmall}
              delay={1500}
              speed={22}
            />
          </Animated.View>
        </View>
      );
      cta = continueBtn(false, 'I want them back');
      break;
    case 'dream':
      body = (
        <Question title={`Win back just half: that’s ${fmtYears(lostYears / 2)} years.`} subtitle="What would you spend them on?">
          {dream.length > 0 && (
            <Animated.View key={dream[0]} entering={ZoomIn.springify().damping(12)} style={styles.dreamBanner}>
              <Text style={styles.dreamSmall}>+{fmtYears(lostYears / 2)} more years of</Text>
              <Text style={styles.dreamBig}>{dreamLabel}</Text>
            </Animated.View>
          )}
          <OptionList options={DREAMS} selected={dream} onToggle={single(setDream)} />
        </Question>
      );
      cta = continueBtn(dream.length === 0);
      break;
    case 'schedule': {
      const count = checkInHours({ dayStart, dayEnd, interval, notificationsOn: true }).length;
      body = (
        <Question title="When is your day?" subtitle="Tikko only rings while you’re awake.">
          <Card style={{ gap: S.md }}>
            <HourRow label="☀️ I wake up around" value={dayStart} min={4} max={dayEnd - 3} onChange={setDayStart} />
            <HourRow label="🌙 I go to bed around" value={dayEnd} min={dayStart + 3} max={24} onChange={setDayEnd} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>🔔 Check in every</Text>
              <View style={styles.segment}>
                {([1, 2] as const).map((n) => (
                  <Pressable key={n} onPress={() => setIntervalHours(n)} style={[styles.segItem, interval === n && styles.segActive]}>
                    <Text style={styles.segText}>{n}h</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Card>
          <Text style={[styles.lead, { marginTop: S.md }]}>
            Tikko will ring {count} times a day, from {formatHour(dayStart + interval)} to{' '}
            {dayEnd === 24 ? 'midnight' : formatHour(dayEnd)}.
          </Text>
        </Question>
      );
      cta = continueBtn(false);
      break;
    }
    case 'how':
      body = (
        <Question title="Logging takes 2 seconds" subtitle="When Tikko rings, press and hold the notification, then tap what you did.">
          <NotificationPreview />
          <Text style={[styles.lead, { marginTop: S.md }]}>
            Every honest answer earns XP, even the scrolling ones. At night you’ll see exactly where your day went.
          </Text>
        </Question>
      );
      cta = continueBtn(false, 'Got it');
      break;
    case 'wind':
      body = (
        <View style={styles.center}>
          <Card style={styles.welcomeCard}>
            <Typewriter text="Ready to take back your time?" style={[styles.bigTitle, { fontSize: 28, textAlign: 'center' }]} />
            <Typewriter
              text="Hold Tikko to wind it up and make it official."
              style={styles.lead}
              delay={800}
              speed={20}
              haptics={false}
            />
          </Card>
          <HoldToWind onDone={() => setWound(true)} />
        </View>
      );
      cta = null;
      break;
    case 'notify':
      body = (
        <View style={styles.center}>
          <Tikko mood="radiant" pose="cheer" size={200} bounceKey={1} />
          <Card style={styles.welcomeCard}>
            <Typewriter text="Let Tikko ring" style={[styles.bigTitle, { fontSize: 30 }]} />
            <Typewriter
              text="Tikko needs notifications to check in with you. Without them, it can’t do its job."
              style={styles.lead}
              delay={450}
              speed={20}
            />
          </Card>
        </View>
      );
      cta = (
        <View style={{ gap: S.xs }}>
          <Button label="🔔 Allow notifications" onPress={() => finish(true)} />
          <Button label="Not now" variant="ghost" onPress={() => finish(false)} />
        </View>
      );
      break;
  }

  const sceneMood = SCENE_STEPS[step];
  const progress = i / (STEPS.length - 1);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {sceneMood && <Scene mood={sceneMood} />}
      <View style={[styles.container, { paddingTop: insets.top + S.sm, paddingBottom: insets.bottom + S.md }]}>
        {step !== 'welcome' && <ProgressHeader progress={progress} onBack={back} />}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingVertical: S.md }}
          showsVerticalScrollIndicator={false}>
          <Animated.View key={step} entering={FadeIn.duration(220)} style={{ flexGrow: 1 }}>
            {body}
          </Animated.View>
        </ScrollView>
        {cta}
      </View>
    </View>
  );
}

function Question({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const [typed, setTyped] = useState(false);
  const titleMs = title.length * 26;
  return (
    <View style={{ gap: S.md }}>
      <View style={{ gap: 6 }}>
        <Typewriter text={title} style={styles.qTitle} onDone={subtitle ? undefined : () => setTyped(true)} />
        {subtitle ? (
          <Typewriter text={subtitle} style={styles.qSub} speed={16} delay={titleMs} haptics={false} onDone={() => setTyped(true)} />
        ) : null}
      </View>
      {typed && <Animated.View entering={FadeInDown.duration(300)}>{children}</Animated.View>}
    </View>
  );
}

function HourRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable disabled={value <= min} onPress={() => onChange(value - 1)} style={styles.stepBtn}>
          <Text style={[styles.stepText, value <= min && { opacity: 0.3 }]}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>{value === 24 ? '12 AM' : formatHour(value)}</Text>
        <Pressable disabled={value >= max} onPress={() => onChange(value + 1)} style={styles.stepBtn}>
          <Text style={[styles.stepText, value >= max && { opacity: 0.3 }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: S.md + 4 },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: S.md },
  welcomeCard: { alignSelf: 'stretch', alignItems: 'center', gap: S.sm, paddingVertical: S.lg },
  bigTitle: { fontFamily: F.display, fontSize: 34, color: C.ink, textAlign: 'center' },
  lead: { fontFamily: F.medium, fontSize: 16.5, color: C.ink, textAlign: 'center', lineHeight: 23 },
  qTitle: { fontFamily: F.display, fontSize: 30, color: C.ink, lineHeight: 34 },
  qSub: { fontFamily: F.medium, fontSize: 15.5, color: C.sub },
  shockCard: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: S.sm,
    backgroundColor: 'rgba(30,26,46,0.55)',
    borderRadius: R.lg,
    padding: S.lg,
  },
  shockSmall: { fontFamily: F.semibold, fontSize: 17, color: '#FFFFFF', textAlign: 'center' },
  dreamBanner: {
    alignItems: 'center',
    backgroundColor: C.sand,
    borderRadius: R.lg,
    borderWidth: 3,
    borderColor: C.ink,
    paddingVertical: S.md,
  },
  dreamSmall: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  dreamBig: { fontFamily: F.display, fontSize: 40, color: C.ink },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontFamily: F.semibold, fontSize: 16, color: C.ink, flexShrink: 1 },
  segment: { flexDirection: 'row', backgroundColor: C.cardAlt, borderRadius: R.pill, padding: 3 },
  segItem: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: R.pill },
  segActive: { backgroundColor: C.sand },
  segText: { fontFamily: F.bold, color: C.ink },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 22, fontFamily: F.bold, color: C.ink, marginTop: -2 },
  stepValue: { width: 62, textAlign: 'center', fontFamily: F.bold, color: C.ink },
});
