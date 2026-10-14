import { createContext, useContext, useEffect, type PropsWithChildren } from 'react';
import { DEFAULT_MODE, type UIMode } from '../../styles/tokens/modeConfig';
/** Compatibility API only. There is no selectable theme or toggle. */
type ModeContextValue = {
  mode: UIMode;
  setMode: (next: UIMode) => void;
  toggleMode: () => void;
  isWarm: boolean;
  isStructured: boolean;
};
const fixedMode: ModeContextValue = {
  mode: DEFAULT_MODE,
  setMode: () => {},
  toggleMode: () => {},
  isWarm: true,
  isStructured: false,
};
const ModeContext = createContext<ModeContextValue>(fixedMode);
export function ModeProvider({ children }: PropsWithChildren<{ initialMode?: UIMode }>) {
  useEffect(() => {
    document.documentElement.dataset.mode = 'warm';
    document.documentElement.style.colorScheme = 'light';
    document.documentElement.classList.remove('dark');
  }, []);
  return <ModeContext.Provider value={fixedMode}>{children}</ModeContext.Provider>;
}
export function useModeContext(): ModeContextValue { return useContext(ModeContext); }
