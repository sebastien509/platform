import { useModeContext } from './ModeProvider';
/** Use semantic CSS variables for colors; this hook exposes mode state only. */
export function useModeTokens() {
  return useModeContext();
}
