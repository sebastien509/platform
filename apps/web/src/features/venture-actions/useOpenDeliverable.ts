import { useCallback } from 'react';
import { useSurfaceViewer } from '@/lib/stores/surfaceViewerStore';
import { useDocumentViewer } from '@/lib/stores/documentViewerStore';
import { useHtmlViewer } from '@/lib/stores/htmlViewerStore';
import { useDeckViewer } from '@/lib/stores/deckViewerStore';
import { useCodeViewer } from '@/lib/stores/codeViewerStore';
import { useSheetViewer } from '@/lib/stores/sheetViewerStore';
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
  const openHtml = useHtmlViewer((s) => s.openHtml);
  const openDeck = useDeckViewer((s) => s.openDeck);
  const openCode = useCodeViewer((s) => s.openCode);
  const openSheet = useSheetViewer((s) => s.openSheet);

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
        case 'html': {
          /* Preferred: open via share link (gives us comments + a
             stable URL). If the deliverable doesn't have one yet —
             or the share system is out of sync — render the html
             payload directly in the HtmlViewerModal. */
          if (d.shareLinkId) {
            openSurface(d.shareLinkId, { deliverableId: d.id });
            return;
          }
          const html = extractHtml(d);
          if (html) {
            openHtml({
              html,
              title: d.title ?? 'HTML preview',
              deliverableId: d.id,
            });
            return;
          }
          /* No html either — fall through to doc viewer as a
             last resort. */
          const doc = deliverableToDocument(d);
          openDoc(doc);
          return;
        }

        case 'deck': {
          if (d.shareLinkId) {
            openSurface(d.shareLinkId, { deliverableId: d.id });
            return;
          }
          const slides = extractSlides(d);
          if (slides && slides.length > 0) {
            openDeck({
              slides,
              title: d.title ?? 'Deck',
              deliverableId: d.id,
            });
            return;
          }
          openDoc(deliverableToDocument(d));
          return;
        }

        case 'markdown':
        case 'report': {
          const doc = deliverableToDocument(d);
          openDoc(doc);
          return;
        }

        case 'code': {
          const code = extractCode(d);
          if (code) {
            openCode({
              language: code.language,
              code: code.code,
              label: code.label ?? d.title ?? 'Code',
              deliverableId: d.id,
            });
            return;
          }
          openDoc(deliverableToDocument(d));
          return;
        }

        case 'sheet': {
          const sheet = extractSheet(d);
          if (sheet && sheet.tabs.length > 0) {
            openSheet({
              tabs: sheet.tabs,
              title: d.title ?? 'Sheet',
              deliverableId: d.id,
            });
            return;
          }
          openDoc(deliverableToDocument(d));
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
    [openSurface, openDoc, openHtml, openDeck, openCode, openSheet]
  );
}

/**
 * extractHtml — pull a self-contained HTML string out of a
 * deliverable's snapshot, regardless of which field the LLM
 * chose to write it into.
 */
function extractHtml(d: Deliverable): string | null {
  const snap: any = d.snapshot;

  /* Direct payload — the standard path. */
  if (snap?.payload?.html && typeof snap.payload.html === 'string') {
    return snap.payload.html;
  }
  if (snap?.payload?.body && snap?.payload?.type === 'html' && typeof snap.payload.body === 'string') {
    return snap.payload.body;
  }

  /* Snapshot with a single embed section — the share-system path. */
  if (Array.isArray(snap?.sections) && snap.sections.length === 1) {
    const s = snap.sections[0];
    if (s?.type === 'embed' && typeof s.html === 'string') return s.html;
  }

  /* Anything else — walk sections looking for an embed. */
  if (Array.isArray(snap?.sections)) {
    for (const s of snap.sections) {
      if (s?.type === 'embed' && typeof s.html === 'string') return s.html;
    }
  }

  return null;
}

/**
 * extractSlides — pull deck slides out of a deliverable's payload.
 * Accepts either `payload.slides` directly, or a snapshot whose
 * sections contain slide-shaped items.
 */
function extractSlides(d: Deliverable) {
  const snap: any = d.snapshot;

  if (Array.isArray(snap?.payload?.slides) && snap.payload.slides.length > 0) {
    return snap.payload.slides;
  }

  /* Fallback: sections that look like slides */
  if (Array.isArray(snap?.sections) && snap.sections.length > 0) {
    const slides = snap.sections
      .filter((s: any) => s.type === 'slide' || s.type === 'hero' || s.type === 'paragraph')
      .map((s: any) => ({
        eyebrow: s.eyebrow ?? s.label ?? null,
        title: s.title ?? s.headline ?? s.label ?? '',
        body: s.body ?? s.paragraph ?? null,
        bullets: s.bullets ?? s.items?.map((i: any) => i.title ?? i) ?? null,
        metric: null,
      }))
      .filter((s: any) => s.title);
    if (slides.length > 0) return slides;
  }

  return null;
}

/**
 * extractCode — pull code out of a deliverable's payload.
 */
function extractCode(d: Deliverable): { language: string | null; code: string; label: string | null } | null {
  const snap: any = d.snapshot;

  if (snap?.payload?.code && typeof snap.payload.code === 'string') {
    return {
      language: snap.payload.language ?? null,
      code: snap.payload.code,
      label: snap.payload.label ?? d.title ?? null,
    };
  }

  /* Sections that carry code blocks */
  if (Array.isArray(snap?.sections)) {
    for (const s of snap.sections) {
      if (s?.type === 'code' && typeof s.code === 'string') {
        return {
          language: s.language ?? null,
          code: s.code,
          label: s.label ?? d.title ?? null,
        };
      }
    }
  }

  return null;
}

/**
 * extractSheet — pull sheet tabs out of a deliverable's payload.
 */
function extractSheet(d: Deliverable): { tabs: { name: string; columns: string[]; rows: any[][] }[] } | null {
  const snap: any = d.snapshot;

  if (Array.isArray(snap?.payload?.tabs) && snap.payload.tabs.length > 0) {
    return { tabs: snap.payload.tabs };
  }

  /* A single table section becomes one tab */
  if (Array.isArray(snap?.sections)) {
    const tables = snap.sections.filter((s: any) => s.type === 'table');
    if (tables.length > 0) {
      return {
        tabs: tables.map((t: any, i: number) => ({
          name: t.label ?? `Table ${i + 1}`,
          columns: t.columns ?? [],
          rows: t.rows ?? [],
        })),
      };
    }
  }

  return null;
}
