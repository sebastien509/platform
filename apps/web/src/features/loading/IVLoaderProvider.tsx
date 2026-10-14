import { ReactNode, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLoadingStore, useLoadingVisible } from '@/lib/stores/loadingStore';
import { IVLoadingScreen } from './IVLoadingScreen';

interface IVLoaderProviderProps {
  children: ReactNode;
}

export function IVLoaderProvider({ children }: IVLoaderProviderProps) {
  const visible = useLoadingVisible();
  const message = useLoadingStore((s) => s.message);
  const setBootReady = useLoadingStore((s) => s.setBootReady);

  /* Boot: fonts + minimum dwell so the screen doesn't flash. */
  useEffect(() => {
    const minTime = new Promise<void>((r) => setTimeout(r, 1400));
    const fonts =
      typeof document !== 'undefined' && document.fonts
        ? document.fonts.ready
        : Promise.resolve();
    Promise.all([minTime, fonts]).then(() => setBootReady(true));
  }, [setBootReady]);

  return (
    <>
      {children}
      <AnimatePresence>
        {visible && <IVLoadingScreen message={message} />}
      </AnimatePresence>
    </>
  );
}
