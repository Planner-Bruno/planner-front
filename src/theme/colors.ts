export type ThemeMode = 'dark' | 'light';

const neonAccent = {
  pink: '#F471B5',
  teal: '#2DD4BF',
  yellow: '#FACC15',
  orange: '#FB923C'
} as const;

export const palettes = {
  dark: {
    background: '#050915',
    surface: '#0F182B',
    mutedSurface: '#15203A',
    border: '#223052',
    primary: '#7C5CFF',
    primaryMuted: '#A78BFA',
    accent: neonAccent.pink,
    accentAlt: neonAccent.teal,
    success: '#22C55E',
    warning: neonAccent.yellow,
    danger: '#FB7185',
    text: '#F8FAFC',
    textMuted: '#94A3B8'
  },
  light: {
    background: '#F3F6FF',
    surface: '#FFFFFF',
    mutedSurface: '#EEF2FF',
    border: '#CBD5F5',
    primary: '#5840D9',
    primaryMuted: '#8B5CF6',
    accent: neonAccent.orange,
    accentAlt: neonAccent.teal,
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    text: '#0F172A',
    textMuted: '#475569'
  }
} as const;

export type Palette = typeof palettes.dark;

export const palette = palettes.dark;

export const priorityColors = {
  low: '#22C55E',
  medium: '#FACC15',
  high: '#F97316'
} as const;
