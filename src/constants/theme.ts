// Tikko's look: calm and premium. A warm off-white page, white cards with hairline
// borders, one teal accent (from Tikko's rim), and Tikko as the only colourful thing.
// Change values here to restyle the whole app.

export const C = {
  ink: '#22252B',
  sub: '#8A8F98',
  faint: '#D9D6D0',
  line: '#ECEAE6',
  white: '#FFFFFF',
  bg: '#FAF8F5',
  card: '#FFFFFF',
  cardAlt: '#F2F0EC',
  /** The one accent colour: buttons, selection, active tab. */
  accent: '#1E9A93',
  accentSoft: '#E3F4F2',
  // Data colours, used only in charts and the day strip.
  focus: '#3FA88A',
  neutral: '#C9CDD3',
  drain: '#E07A6B',
  empty: '#EFEDE9',
  // Kept for the few celebratory spots.
  sand: '#F6C453',
  coral: '#E07A6B',
  good: '#3FA88A',
  warn: '#E8B04A',
} as const;

export const F = {
  /** Friendly rounded headings. */
  display: 'Fredoka_600SemiBold',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  round: 'Fredoka_600SemiBold',
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
  md: 16,
  lg: 22,
  pill: 999,
} as const;

/** Card surface: hairline border and a soft, low shadow. (Name kept from the old style.) */
export const sticker = {
  borderWidth: 1,
  borderColor: C.line,
  shadowColor: '#000',
  shadowOpacity: 0.04,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 1,
} as const;
