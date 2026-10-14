/* ============================================================
   IV by InthraOS — Mode Configuration
   ============================================================
   Determines which visual mode a route should use:
   - "warm"       → onboarding, first-contact, marketing
   - "structured" → everything inside the product
   ============================================================ */

export type VisualMode = 'warm' | 'structured';

/* Route prefix → mode mapping.
   Longest prefix wins, so order doesn't matter as long as
   more specific routes are also listed if needed. */
const WARM_ROUTES = [
  '/signup',
  '/welcome',
  '/onboarding',
  '/marketing',
] as const;

export function getModeForPath(pathname: string): VisualMode {
  for (const prefix of WARM_ROUTES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return 'warm';
    }
  }
  return 'structured';
}
