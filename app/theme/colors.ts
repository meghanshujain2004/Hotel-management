export const colors = {
  // Backgrounds & Surface layers
  bg: '#07070a',
  surface: '#0f0f17',
  surfaceElevated: '#161624',
  surfaceCard: '#12121c',
  border: '#1f1f33',
  borderLight: '#2a2a44',
  divider: '#161626',

  // Primaries & Accents
  purple: '#8b5cf6',
  purpleLight: '#a78bfa',
  purpleDark: '#6d28d9',
  purpleGlow: 'rgba(139, 92, 246, 0.15)',
  purpleSurface: 'rgba(139, 92, 246, 0.08)',

  gold: '#f59e0b',
  goldLight: '#fbbf24',
  goldDim: '#78490a',
  goldSurface: 'rgba(245, 158, 11, 0.12)',

  green: '#10b981',
  greenLight: '#34d399',
  greenDim: '#064e3b',
  greenSurface: 'rgba(16, 185, 129, 0.12)',

  red: '#ef4444',
  redLight: '#f87171',
  redDim: '#7f1d1d',
  redSurface: 'rgba(239, 68, 68, 0.12)',

  orange: '#f97316',
  orangeLight: '#fb923c',
  orangeSurface: 'rgba(249, 115, 22, 0.12)',

  blue: '#3b82f6',
  blueLight: '#60a5fa',
  blueSurface: 'rgba(59, 130, 246, 0.12)',

  // Neutral Text Scale
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textDisabled: '#475569',
  textPlaceholder: '#475569',

  // Special Overlays
  overlay: 'rgba(0, 0, 0, 0.75)',
  shadow: 'rgba(0, 0, 0, 0.5)',

  // Status colors
  statusNew: '#6366f1',
  statusContacted: '#3b82f6',
  statusInterested: '#f59e0b',
  statusAwaitingFollowup: '#f97316',
  statusRegistered: '#10b981',
  statusNotInterested: '#6b7280',
  statusLost: '#ef4444',
};

export const STATUS_COLORS: Record<string, string> = {
  new: colors.statusNew,
  contacted: colors.statusContacted,
  interested: colors.statusInterested,
  awaiting_followup: colors.statusAwaitingFollowup,
  completed_followup: colors.orange,
  registered: colors.statusRegistered,
  not_interested: colors.statusNotInterested,
  lost: colors.statusLost,
};

export const ESCALATION_COLORS: Record<string, string> = {
  normal: colors.green,
  day1_reminder: colors.gold,
  level1_manager: colors.orange,
  day3_reminder: colors.orange,
  level2_admin: colors.red,
};
