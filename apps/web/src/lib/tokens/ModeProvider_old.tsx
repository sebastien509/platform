/* ============================================================
   IV by InthraOS — Mode Provider
   ============================================================
   Watches the route and sets data-mode on <html>.
   Wrap the app once; components never touch this directly.
   ============================================================ */

import { ReactNode } from 'react';
import { useModeTokens } from './useModeTokens';

export function ModeProvider({ children }: { children: ReactNode }) {
  useModeTokens();
  return <>{children}</>;
}
