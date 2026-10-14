/** One shipped visual theme; retained for compatibility with existing imports. */
export const MODES = ['warm'] as const;
export type UIMode = 'warm';
export const DEFAULT_MODE: UIMode = 'warm';
/** Legacy key: no longer read or written. */
export const MODE_STORAGE_KEY = 'iv:ui-mode';
export const MODE_LABELS: Record<UIMode, string> = { warm: 'Warm' };
export function isUIMode(value: unknown): value is UIMode { return value === 'warm'; }
export function normalizeMode(_value: unknown, _fallback: UIMode = DEFAULT_MODE): UIMode { return DEFAULT_MODE; }
