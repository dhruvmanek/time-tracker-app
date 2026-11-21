import type { PropId } from '@/components/tikko';
import { C } from '@/constants/theme';
import type { Category } from './types';

export const CATEGORIES: Category[] = [
  { id: 'work', name: 'Deep work', emoji: '💻', color: '#2FB37A', kind: 'focus' },
  { id: 'learn', name: 'Learning', emoji: '📚', color: '#3E9BE0', kind: 'focus' },
  { id: 'exercise', name: 'Exercise', emoji: '🏃', color: '#14B8A6', kind: 'focus' },
  { id: 'mindful', name: 'Meditation & self-care', emoji: '🧘', color: '#C084FC', kind: 'focus' },
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
  mindful: 'lotus',
  chores: 'basket',
  social: 'heart',
  meals: 'mug',
  commute: 'wheel',
  meetings: 'clipboard',
  scroll: 'phone',
  tv: 'gamepad',
  procrastinate: 'swirl',
};

/** The optional one-tap follow-up shown after logging each activity. */
export const DETAIL_PROMPTS: Record<string, { question: string; chips: string[] }> = {
  work: { question: 'What were you working on?', chips: [] },
  learn: { question: 'How were you learning?', chips: ['Reading', 'Course', 'Podcast', 'Practice'] },
  exercise: { question: 'What kind?', chips: ['Gym', 'Walk', 'Run', 'Yoga', 'Sport'] },
  mindful: { question: 'What did you do?', chips: ['Meditation', 'Journaling', 'Nap', 'Self-care'] },
  chores: { question: 'What was it?', chips: ['Cleaning', 'Laundry', 'Cooking', 'Groceries', 'Errands'] },
  social: { question: 'Who with?', chips: ['Family', 'Friends', 'Partner', 'Phone call'] },
  meals: { question: 'What was it?', chips: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Break'] },
  commute: { question: 'How did you travel?', chips: ['Car', 'Bus', 'Train', 'Walk', 'Bike'] },
  meetings: { question: 'What kind?', chips: ['Meeting', 'Email', 'Calls', 'Admin'] },
  scroll: { question: 'Which app?', chips: ['Instagram', 'YouTube', 'X', 'Reddit', 'WhatsApp', 'Snapchat'] },
  tv: { question: 'What was it?', chips: ['Netflix', 'YouTube', 'Gaming', 'Prime Video'] },
  procrastinate: { question: 'What pulled you away?', chips: ['Overthinking', 'Phone', 'Daydreaming', 'Snacking'] },
};
