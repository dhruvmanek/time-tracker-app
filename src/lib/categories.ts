import type { PropId } from '@/components/tikko';
import { C } from '@/constants/theme';
import type { Category } from './types';

export const CATEGORIES: Category[] = [
  { id: 'work', name: 'Deep work', emoji: '💻', color: '#2FB37A', kind: 'focus' },
  { id: 'learn', name: 'Learning', emoji: '📚', color: '#3E9BE0', kind: 'focus' },
  { id: 'exercise', name: 'Exercise', emoji: '🏃', color: '#14B8A6', kind: 'focus' },
  { id: 'chores', name: 'Chores & errands', emoji: '🧺', color: '#A78BFA', kind: 'neutral' },
  { id: 'social', name: 'Friends & family', emoji: '👥', color: '#F59E0B', kind: 'neutral' },
  { id: 'meals', name: 'Meals & rest', emoji: '🍽️', color: '#C2A27C', kind: 'neutral' },
  { id: 'commute', name: 'Commute', emoji: '🚗', color: '#8E9BB0', kind: 'neutral' },
  { id: 'meetings', name: 'Meetings & admin', emoji: '📅', color: '#64748B', kind: 'neutral' },
  { id: 'scroll', name: 'Social media', emoji: '📱', color: '#E2574C', kind: 'drain' },
  { id: 'tv', name: 'TV & games', emoji: '🎮', color: '#F472B6', kind: 'drain' },
  { id: 'procrastinate', name: 'Procrastinating', emoji: '🌀', color: '#B4533E', kind: 'drain' },
];

export const UNKNOWN: Category = {
  id: 'unknown',
  name: 'Unknown',
  emoji: '❔',
  color: C.faint,
  kind: 'neutral',
};

const byId = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: string): Category {
  return byId.get(id) ?? UNKNOWN;
}

/** Shown as buttons on the check-in notification until the user has some history. */
export const DEFAULT_QUICK_IDS = ['work', 'learn', 'scroll', 'meals'];

/** What Tikko holds while you're doing each activity. */
export const CATEGORY_PROPS: Record<string, PropId> = {
  work: 'laptop',
  learn: 'book',
  exercise: 'dumbbell',
  chores: 'basket',
  social: 'heart',
  meals: 'mug',
  commute: 'wheel',
  meetings: 'clipboard',
  scroll: 'phone',
  tv: 'gamepad',
  procrastinate: 'swirl',
};
