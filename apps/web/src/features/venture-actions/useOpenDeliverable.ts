import { useCallback } from 'react';
import { useSurfaceViewer } from '@/lib/stores/surfaceViewerStore';
import { useDocumentViewer } from '@/lib/stores/documentViewerStore';
import { deliverableToDocument } from './viewers/deliverableToDocument';
import { getActionDef } from './page-actions';
import { useDeliverablesStore } from '@/lib/deliverables';
import { loadDeliverable } from '@/lib/deliverables/persistence';
import type { Deliverable } from '@/lib/deliverables';
import type { RenderType } from './page-actions';

/**
 * useOpenDeliverable — the single entry point for opening any
 * deliverable. Routes by renderType.
 *
 * Accepts either a Deliverable object (fast path — already in
 * memory) or a string id. When given an id that isn't in the
 * local store, it hydrates from Supabase via `loadDeliverable`.
 */
export function useOpenDeliverable() {
  const openSurface = useSurfaceViewer((s) => s.open);
  const openDoc = useDocumentViewer((s) => s.openInline);

  return useCallback(
    async (input: Deliverable | string) => {
      let d: Deliverable | undefined;

      if (typeof input === 'string') {
        const fromStore =
          useDeliverablesStore.getState().deliverables[input];
        if (fromStore) {
          d = fromStore;
        } else {
          const loaded = await loadDeliverable(input);
          d = loaded ?? undefined;
        }
      } else {
        d = input;
      }

      if (!d) return;

      /* Resolve renderType — from the deliverable, or from its op. */
      const fromDeliverable = d.renderType as RenderType | undefined;
      const fromOp = getActionDef(d.opId)?.renderType;
      const rt: RenderType = fromDeliverable ?? fromOp ?? 'markdown';

      switch (rt) {
        case 'html':
        case 'deck': {
          if (d.shareLinkId) {
            openSurface(d.shareLinkId, { deliverableId: d.id });
          }
          return;
        }

        case 'markdown':
        case 'report': {
          const doc = deliverableToDocument(d);
          openDoc(doc);
          return;
        }

        case 'code':
        case 'sheet': {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('iv:open-code-view', {
                detail: { deliverableId: d.id },
              })
            );
          }
          return;
        }

        case 'repo': {
          const externalUrl = (d.snapshot as any)?.externalUrl;
          if (externalUrl && typeof window !== 'undefined') {
            window.open(externalUrl, '_blank', 'noopener');
          }
          return;
        }

        case 'operational':
        default: {
          /* Operational deliverables (email batches, one-shot
             records) don't have a dedicated surface viewer. But
             when they carry a snapshot with sections — as the
             email_batch deliverable does — render them through
             the DocumentViewerDrawer so the founder can review
             what was prepared. */
          const sections = (d.snapshot as any)?.sections;
          if (Array.isArray(sections) && sections.length > 0) {
            const doc = deliverableToDocument(d);
            openDoc(doc);
          }
          return;
        }
      }
    },
    [openSurface, openDoc]
  );
}
