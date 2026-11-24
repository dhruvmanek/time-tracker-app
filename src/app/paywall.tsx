// Hard paywall: shown after onboarding (and on launch if the subscription ends).
// It explains exactly how the free trial works, so nobody is charged by surprise.

import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Tikko } from '@/components/tikko';
import { Button } from '@/components/ui';
import { C, F, R, S, sticker } from '@/constants/theme';
import { track } from '@/lib/analytics';
import { useCheckInsOn } from '@/hooks/use-checkins-on';
import { scheduleTrialReminder } from '@/lib/notifications';
import { buy, loadPlans, restore, storeReady, type Plan } from '@/lib/purchases';


export default function Paywall() {
  const insets = useSafeAreaInsets();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [selected, setSelected] = useState<Plan['id']>('annual');
  const [busy, setBusy] = useState(false);

  const ringing = useCheckInsOn();
  const fetchPlans = () => {
    setPlans(null);
    loadPlans().then(setPlans);
  };
  useEffect(() => {
    track('paywall_viewed');
    loadPlans().then(setPlans);
  }, []);

  const plan = plans?.find((p) => p.id === selected) ?? plans?.[0];
  const annual = plans?.find((p) => p.id === 'annual');
  const monthly = plans?.find((p) => p.id === 'monthly');
  const trialDays = plan?.trialDays ?? 0;
  const savings = savingsPercent(annual, monthly);

  const unlock = () => router.replace('/');

  const onBuy = async () => {
    if (!plan || busy) return;
    setBusy(true);
    const result = await buy(plan);
    setBusy(false);
    const props = { plan: plan.id, price: plan.price, trial_days: plan.trialDays };
    if (result === 'success') track(plan.trialDays > 0 ? 'trial_started' : 'subscribed', props);
    else track(result === 'cancelled' ? 'purchase_cancelled' : 'purchase_failed', props);
    if (result === 'success') {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (plan.trialDays > 0) scheduleTrialReminder(plan.trialDays);
      unlock();
    } else if (result === 'error') {
      Alert.alert('Something went wrong', 'The purchase didn’t go through. Please try again.');
    }
  };

  const onRestore = async () => {
    track('restore_tapped');
    setBusy(true);
    const ok = await restore();
    setBusy(false);
    if (ok) unlock();
    else Alert.alert('Nothing to restore', 'We couldn’t find an active Tikko subscription for this Apple ID.');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + S.sm, paddingBottom: insets.bottom + S.sm }]}>
      <Pressable onPress={onRestore} style={styles.restore} hitSlop={10} disabled={busy}>
        <Text style={styles.restoreText}>Restore</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center' }}>
          <Tikko mood="happy" prop="clipboard" size={150} />
          <Text style={styles.title}>{trialDays > 0 ? 'How your free trial works' : 'Unlock Tikko'}</Text>
          <Text style={styles.lead}>
            {trialDays > 0
              ? ringing
                ? 'No surprises. We’ll remind you before it ends.'
                : 'No surprises. Cancel anytime before it ends.'
              : 'Know exactly where your time goes.'}
          </Text>
        </View>

        {trialDays > 0 && plan && (
          <View style={styles.card}>
            <Step icon="🔓" bg={C.accentSoft} title="Today" text="Full access to everything. Tikko starts ringing." />
            {/* The reminder is a local notification, so only promise it if notifications are on. */}
            {ringing && trialDays >= 2 && (
              <Step
                icon="🔔"
                bg="#FFF4DA"
                title={`In ${trialDays - 1} days`}
                text="We remind you that your trial ends tomorrow."
              />
            )}
            <Step
              icon="⭐"
              bg={C.cardAlt}
              title={`In ${trialDays} days`}
              text={`Your trial ends and you’re charged ${plan.price}/${plan.id === 'annual' ? 'year' : 'month'}. Cancel anytime before.`}
              last
            />
          </View>
        )}

        {!plans ? (
          <ActivityIndicator color={C.accent} style={{ marginTop: S.lg }} />
        ) : plans.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>Couldn’t load plans</Text>
            <Text style={styles.stepText}>Check your internet connection and try again.</Text>
            <Pressable onPress={fetchPlans} style={styles.retry}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {annual && (
              <PlanRow
                selected={selected === 'annual'}
                onPress={() => {
                  setSelected('annual');
                  track('paywall_plan_selected', { plan: 'annual' });
                }}
                name="Yearly"
                meta={annual.perMonth ? `${annual.perMonth} / month` : 'Billed yearly'}
                price={annual.price}
                per="per year"
                badge={[annual.trialDays > 0 ? `${annual.trialDays} DAYS FREE` : null, savings ? `SAVE ${savings}%` : null]
                  .filter(Boolean)
                  .join(' · ')}
              />
            )}
            {monthly && (
              <PlanRow
                selected={selected === 'monthly'}
                onPress={() => {
                  setSelected('monthly');
                  track('paywall_plan_selected', { plan: 'monthly' });
                }}
                name="Monthly"
                meta="Billed monthly"
                price={monthly.price}
                per="per month"
              />
            )}
          </View>
        )}
      </ScrollView>

      <View style={{ gap: 8 }}>
        <Button
          label={busy ? 'One moment…' : trialDays > 0 ? 'Start my free trial' : 'Subscribe'}
          onPress={onBuy}
          disabled={!plan || busy}
        />
        {plan && (
          <Text style={styles.fine}>
            {trialDays > 0
              ? `${trialDays} days free, then ${plan.price}/${plan.id === 'annual' ? 'year' : 'month'}. Cancel anytime.`
              : `${plan.price}/${plan.id === 'annual' ? 'year' : 'month'}. Renews automatically. Cancel anytime.`}
          </Text>
        )}
        <Text style={styles.links}>
          <Text onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })}>Terms</Text>
          {'  ·  '}
          <Text onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })}>Privacy</Text>
          {!storeReady ? '  ·  Test mode' : ''}
        </Text>
      </View>
    </View>
  );
}

function savingsPercent(annual?: Plan, monthly?: Plan): number | null {
  const a = annual?.pkg?.product.price;
  const m = monthly?.pkg?.product.price;
  if (a && m) return Math.round((1 - a / (m * 12)) * 100);
  return annual && monthly ? 33 : null; // test mode: $39.99 vs $4.99 × 12
}

function Step({ icon, bg, title, text, last }: { icon: string; bg: string; title: string; text: string; last?: boolean }) {
  return (
    <View style={styles.step}>
      <View style={{ alignItems: 'center' }}>
        <View style={[styles.dot, { backgroundColor: bg }]}>
          <Text style={{ fontSize: 13 }}>{icon}</Text>
        </View>
        {!last && <View style={styles.line} />}
      </View>
      <View style={{ flex: 1, paddingBottom: last ? 0 : 12 }}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepText}>{text}</Text>
      </View>
    </View>
  );
}

function PlanRow({
  selected,
  onPress,
  name,
  meta,
  price,
  per,
  badge,
}: {
  selected: boolean;
  onPress: () => void;
  name: string;
  meta: string;
  price: string;
  per: string;
  badge?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.plan, selected && styles.planOn]}>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <View style={[styles.radio, selected && styles.radioOn]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.planName}>{name}</Text>
        <Text style={styles.planMeta}>{meta}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.planPrice}>{price}</Text>
        <Text style={styles.planMeta}>{per}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, paddingHorizontal: S.md + 4 },
  restore: { alignSelf: 'flex-end', paddingVertical: 4 },
  restoreText: { fontFamily: F.medium, fontSize: 14, color: C.sub },
  scroll: { gap: S.md, paddingBottom: S.md },
  title: { fontFamily: F.display, fontSize: 26, color: C.ink, textAlign: 'center', marginTop: 4 },
  lead: { fontFamily: F.medium, fontSize: 14.5, color: C.sub, textAlign: 'center', marginTop: 4 },
  card: { ...sticker, backgroundColor: C.card, borderRadius: R.md, padding: 14 },
  step: { flexDirection: 'row', gap: 12 },
  dot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  line: { flex: 1, width: 2, backgroundColor: C.line, marginVertical: 2 },
  stepTitle: { fontFamily: F.semibold, fontSize: 14.5, color: C.ink },
  stepText: { fontFamily: F.regular, fontSize: 13, color: C.sub, marginTop: 1, lineHeight: 18 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: R.md,
    borderWidth: 1.5,
    borderColor: C.line,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  planOn: { borderWidth: 2, borderColor: C.accent },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D3D0CA' },
  radioOn: { borderWidth: 6.5, borderColor: C.accent },
  planName: { fontFamily: F.semibold, fontSize: 16, color: C.ink },
  planMeta: { fontFamily: F.medium, fontSize: 12.5, color: C.sub, marginTop: 2 },
  planPrice: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  badge: {
    position: 'absolute',
    top: -10,
    right: 14,
    backgroundColor: C.accent,
    borderRadius: R.pill,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  badgeText: { fontFamily: F.bold, fontSize: 10.5, color: '#FFFFFF', letterSpacing: 0.3 },
  retry: { alignSelf: 'flex-start', marginTop: 10, backgroundColor: C.accent, borderRadius: R.md, paddingVertical: 8, paddingHorizontal: 16 },
  retryText: { fontFamily: F.semibold, fontSize: 14.5, color: '#FFFFFF' },
  fine: { fontFamily: F.medium, fontSize: 12.5, color: C.sub, textAlign: 'center' },
  links: { fontFamily: F.medium, fontSize: 11.5, color: '#A3A7AE', textAlign: 'center' },
});
