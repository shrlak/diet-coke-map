// Design tokens for the Diet Coke Map — single source of truth for UI/UX work.
// Mirrors tailwind.config.js values so Figma, HTML, and React all use the same palette.

export const colors = {
  brand: {
    red: '#E8192C',
    dark: '#1A1A1A',
    light: '#F7F7F7',
  },
  ui: {
    background: '#FFFFFF',
    surface: '#F7F7F7',
    border: '#E5E7EB',
    muted: '#6B7280',
    text: '#111827',
  },
  status: {
    open: '#16A34A',
    closed: '#DC2626',
    unknown: '#9CA3AF',
  },
} as const;

export const typography = {
  fontFamily: 'Inter, system-ui, sans-serif',
  weights: { normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
} as const;

export const radii = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
} as const;
