/* ============================================================
   IV by InthraOS — Mode Tokens Hook
   ============================================================
   Returns the current mode and applies it to <html> so CSS
   tokens switch automatically. Also exposes a manual override.
   ============================================================ */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getModeForPath, VisualMode } from './modeConfig';

export function useModeTokens(): VisualMode {
  const location = useLocation();
  const mode = getModeForPath(location.pathname);

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
  }, [mode]);

  return mode;
}
