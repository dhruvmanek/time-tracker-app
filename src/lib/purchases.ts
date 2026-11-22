// Subscriptions, through RevenueCat.
//
// Setup (once): put the RevenueCat iOS public API key in app.json under
// expo.extra.revenuecatIosKey, create an entitlement called "premium" and an
// offering whose packages are the yearly ($39.99, 3-day free trial) and monthly
// ($4.99) subscriptions. Prices then come from Apple, in each user's currency.
//
// On iOS the key below makes purchases real (sandbox in TestFlight, real money in
// the App Store). Without a key (e.g. the web preview) the paywall shows the US
// prices below and "buying" simply unlocks the app.

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

import { setPremium } from './store';

export const ENTITLEMENT = 'premium';
const API_KEY: string = (Constants.expoConfig?.extra as { revenuecatIosKey?: string } | undefined)?.revenuecatIosKey ?? '';

/** True once RevenueCat is set up; false means test mode (fallback prices, free unlock). */
export const storeReady = Platform.OS === 'ios' && API_KEY.length > 0;

export type Plan = {
  id: 'annual' | 'monthly';
  /** Full price in the user's currency, e.g. "$39.99" or "₹3,499". */
  price: string;
  /** Monthly equivalent for the yearly plan, e.g. "$3.33". */
  perMonth: string | null;
  /** Free trial length in days, or 0. */
  trialDays: number;
  pkg: PurchasesPackage | null;
};

const FALLBACK: Plan[] = [
  { id: 'annual', price: '$39.99', perMonth: '$3.33', trialDays: 3, pkg: null },
  { id: 'monthly', price: '$4.99', perMonth: null, trialDays: 0, pkg: null },
];

function hasPremium(info: CustomerInfo) {
  return info.entitlements.active[ENTITLEMENT] !== undefined;
}

let started = false;

/** Call once at launch. Keeps the cached premium flag in sync with Apple. */
export async function initPurchases() {
  if (!storeReady || started) return;
  started = true;
  Purchases.configure({ apiKey: API_KEY });
  Purchases.addCustomerInfoUpdateListener((info) => setPremium(hasPremium(info)));
  try {
    setPremium(hasPremium(await Purchases.getCustomerInfo()));
  } catch (e) {
    // Offline: keep the cached flag.
    console.warn('Could not check subscription', e);
  }
}

function trialDaysOf(pkg: PurchasesPackage): number {
  const intro = pkg.product.introPrice;
  if (!intro || intro.price !== 0) return 0;
  const unit = intro.periodUnit;
  const n = intro.periodNumberOfUnits;
  if (unit === 'DAY') return n;
  if (unit === 'WEEK') return n * 7;
  if (unit === 'MONTH') return n * 30;
  return 0;
}

/** The yearly and monthly plans, with real local prices when the store is set up. */
export async function loadPlans(): Promise<Plan[]> {
  if (!storeReady) return FALLBACK;
  try {
    const offering = (await Purchases.getOfferings()).current;
    const plans: Plan[] = [];
    if (offering?.annual) {
      plans.push({
        id: 'annual',
        price: offering.annual.product.priceString,
        perMonth: offering.annual.product.pricePerMonthString ?? null,
        trialDays: trialDaysOf(offering.annual),
        pkg: offering.annual,
      });
    }
    if (offering?.monthly) {
      plans.push({
        id: 'monthly',
        price: offering.monthly.product.priceString,
        perMonth: null,
        trialDays: trialDaysOf(offering.monthly),
        pkg: offering.monthly,
      });
    }
    return plans.length ? plans : FALLBACK;
  } catch (e) {
    console.warn('Could not load plans', e);
    return FALLBACK;
  }
}

export type BuyResult = 'success' | 'cancelled' | 'error';

export async function buy(plan: Plan): Promise<BuyResult> {
  if (!storeReady || !plan.pkg) {
    // Test mode: no store yet. Unlock so the rest of the app can be tested.
    setPremium(true);
    return 'success';
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(plan.pkg);
    const ok = hasPremium(customerInfo);
    setPremium(ok);
    return ok ? 'success' : 'error';
  } catch (e) {
    const err = e as { userCancelled?: boolean | null };
    if (err.userCancelled) return 'cancelled';
    console.warn('Purchase failed', e);
    return 'error';
  }
}

/** Returns true if an active subscription was found. */
export async function restore(): Promise<boolean> {
  if (!storeReady) return false;
  try {
    const ok = hasPremium(await Purchases.restorePurchases());
    setPremium(ok);
    return ok;
  } catch (e) {
    console.warn('Restore failed', e);
    return false;
  }
}
