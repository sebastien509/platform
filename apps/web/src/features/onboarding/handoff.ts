/**
 * Handoff helpers — persist the founder's handoff ID across
 * login/signup, then read it back after auth.
 *
 * The landing page opens:
 *   /onboarding?handoff=hd_xxxx
 *
 * If the founder isn't signed in yet, we stash the ID, send them
 * to /login, and pick it back up when they return.
 */

const KEY = 'iv:pending-handoff';

export function readHandoffFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('handoff');
  return id && id.startsWith('hd_') ? id : null;
}

export function savePendingHandoff(id: string) {
  try {
    sessionStorage.setItem(KEY, id);
  } catch {
    /* private mode — ignore */
  }
}

export function readPendingHandoff(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearPendingHandoff() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
