import { useEffect, useState } from 'react';
import { CodeView } from './CodeView';

/**
 * CodeViewHost — listens for the global 'iv:open-code-view' event and
 * renders the CodeView modal. Mount once at the app level so any
 * deliverable can trigger it.
 */
export function CodeViewHost() {
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.deliverableId) {
        setOpenId(detail.deliverableId);
      }
    };
    window.addEventListener('iv:open-code-view', handler);
    return () => window.removeEventListener('iv:open-code-view', handler);
  }, []);

  return (
    <CodeView
      deliverableId={openId}
      onClose={() => setOpenId(null)}
    />
  );
}
