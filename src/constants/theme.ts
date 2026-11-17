// Tikko's look: thick dark outlines, bold flat colours, chunky rounded type.
// Change values here to restyle the whole app.

export const C = {
  ink: '#1E1A2E',
  sub: '#6E6880',
  faint: '#CFC9DC',
  white: '#FFFFFF',
  bg: '#F3EFFA', // lavender page background for non-scene screens
  card: '#FFFFFF',
  cardAlt: '#ECE6F6',
  sand: '#FFC93C',
  coral: '#FF6F5B',
  focus: '#2FB37A',
  neutral: '#8E9BB0',
  drain: '#E2574C',
  good: '#4FD15E',
  warn: '#FFB020',
} as const;

export const F = {
  display: 'LilitaOne_400Regular',
  regular: 'Fredoka_400Regular',
  medium: 'Fredoka_500Medium',
  semibold: 'Fredoka_600SemiBold',
  bold: 'Fredoka_700Bold',
} as const;

export const S = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const R = {
  sm: 12,
  md: 18,
  lg: 24,
  pill: 999,
} as const;

/** The "sticker" look: thick outline plus a hard drop shadow underneath. */
export const sticker = {
  borderWidth: 3,
  borderColor: C.ink,
  shadowColor: C.ink,
  shadowOpacity: 1,
  shadowRadius: 0,
  shadowOffset: { width: 0, height: 4 },
  elevation: 0,
} as const;
