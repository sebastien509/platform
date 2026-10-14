/* ============================================================
   IV by InthraOS — Status Token Mapping
   ============================================================
   One canonical map from any status string to a semantic token.
   Every status surface in the app consumes this — no inline
   ternaries, no hardcoded color utilities.
   ============================================================ */

export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'muted' | 'accent';

const STATUS_MAP: Record<string, StatusTone> = {
  /* Generic */
  active: 'success',
  completed: 'success',
  approved: 'success',
  success: 'success',
  connected: 'success',
  healthy: 'success',
  published: 'success',
  live: 'success',
  win: 'success',

  running: 'info',
  in_progress: 'info',
  testing: 'info',
  reviewing: 'info',
  'in review': 'info',
  'in_review': 'info',
  planning: 'info',
  info: 'info',
  draft: 'info',

  waiting: 'warning',
  paused: 'warning',
  pending: 'warning',
  warning: 'warning',
  'needs attention': 'warning',
  'needs_attention': 'warning',
  proposed: 'warning',
  stale: 'warning',
  scheduled: 'warning',

  failed: 'error',
  blocked: 'error',
  error: 'error',
  rejected: 'error',
  critical: 'error',
  killed: 'error',
  kill: 'error',

  idle: 'muted',
  archived: 'muted',
  cancelled: 'muted',
  skipped: 'muted',
  inactive: 'muted',
  untested: 'muted',
  deprecated: 'muted',
  not_started: 'muted',

  /* Idea-specific */
  captured: 'muted',
  validating: 'info',
  building: 'info',
  launching: 'info',
  measuring: 'info',
  shipped: 'success',

  /* Outcome-specific */
  continue: 'info',
  pivot: 'warning',
  reuse: 'info',
  graduate: 'success',

  /* Agent states */
  working: 'info',
  needs_founder: 'warning',
  needs_input: 'warning',
  complete: 'success',

  /* Roadmap / release */
  released: 'success',
  planned: 'muted',
};

export function toneForStatus(status: string | undefined | null): StatusTone {
  if (!status) return 'muted';
  const key = status.toLowerCase().replace(/-/g, '_');
  return STATUS_MAP[key] ?? 'muted';
}

export function labelForStatus(status: string | undefined | null): string {
  if (!status) return '—';
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
