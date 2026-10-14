import {
  FileText,
  Table2,
  File,
  BarChart3,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useSurfaceViewer } from '@/lib/stores/surfaceViewerStore';
import { useDocumentViewer } from '@/lib/stores/documentViewerStore';
import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import { useDeliverablesStore } from '@/lib/deliverables';
import { useShareStore } from '@/lib/share';
import { createShareLink } from '@/lib/share/createLink';
import { getActionDef } from '@/features/venture-actions/page-actions';
import { snapshotToDocument } from '@/features/venture-actions/viewers/deliverableToDocument';
import { researchEntryToDocument } from '@/features/venture-docs/researchEntryToDocument';
import type { OutputBlock, OutputKind } from '@/lib/types';
import type { ShareSnapshot } from '@/lib/share';
import { EmailBatchBlockView } from './EmailBatchBlockView';
import { ActionExecuteBlockView } from './ActionExecuteBlockView';
import { ShareRow } from './ShareRow';
import { useState } from 'react';

const KIND_META: Record<
  OutputKind,
  { icon: typeof FileText; label: string; kind: string }
> = {
  document: { icon: FileText, label: 'Doc', kind: 'document' },
  field_update: { icon: Sparkles, label: 'Field', kind: 'document' },
  table: { icon: Table2, label: 'Table', kind: 'dataset' },
  file: { icon: File, label: 'File', kind: 'document' },
  chart: { icon: BarChart3, label: 'Chart', kind: 'dataset' },
  email_batch: { icon: FileText, label: 'Batch', kind: 'document' },
  action: { icon: FileText, label: 'Action', kind: 'document' },
};

export function OutputBlockView({
  block,
  onReview,
}: {
  block: OutputBlock;
  onReview?: (href: string) => void;
}) {
  /* Batch blocks get a dedicated component — different buttons,
     different shape. Dispatch before the rest. */
  if (block.kind === 'action') {
    return <ActionExecuteBlockView block={block} />;
  }
  if (block.kind === 'email_batch') {
    return <EmailBatchBlockView block={block} />;
  }

  const meta = KIND_META[block.kind];
  const Icon = meta.icon;

  const addDeliverable = useDeliverablesStore((s) => s.addDeliverable);
  const getLink = useShareStore((s) => s.getLink);
  const endRun = useAgentDrawerStore((s) => s.endRun);
  const closeDrawer = useAgentDrawerStore((s) => s.closeDrawer);

  /* After Validate & Save lands, we keep the drawer open and
     swap the footer to the Share row. */
  const [saved, setSaved] = useState<{
    outputId: string;
    snapshot: ShareSnapshot;
  } | null>(null);

  const isSurface = block.previewHref.startsWith('surface:');
  const isPayload = block.previewHref.startsWith('payload:');
  const isResearch = block.previewHref.startsWith('research:');

  const getLinkId = () =>
    isSurface ? block.previewHref.slice('surface:'.length) : null;

  /* Resolve the op def — used for renderType routing */
  const resolveDef = () => {
    const run = useAgentDrawerStore.getState().runs[block.runId];
    const opId = (run as any)?.opId;
    return opId ? getActionDef(opId) : undefined;
  };

  const handleReview = () => {
    /* Research outputs — the entry payload carries the structured
       memo. Open the DocumentViewerDrawer directly. */
    if (isResearch) {
      const entry = (block as any).payload?.researchEntry;
      if (entry) {
        const run = useAgentDrawerStore.getState().runs[block.runId];
        const ventureId = (run as any)?.ideaId ?? 'local';
        const doc = researchEntryToDocument(entry, ventureId);
        useDocumentViewer.getState().openInline(doc);
      }
      return;
    }

    const def = resolveDef();
    const renderType = def?.renderType ?? 'markdown';

    /* Route by renderType, not by previewHref prefix. */

    const linkId = getLinkId();

    if (linkId) {
      const link = getLink(linkId);
      if (!link) return;

      if (renderType === 'markdown' || renderType === 'report') {
        const doc = snapshotToDocument(
          link.snapshot,
          (link.surfaceId.split('.')[0] as any) ?? 'strategy',
          renderType
        );
        useDocumentViewer.getState().openInline(doc);
        return;
      }

      if (renderType === 'html' || renderType === 'deck') {
        useSurfaceViewer.getState().openFromRun(linkId, block.runId);
        return;
      }

      /* Code/sheet/repo/operational — fall back to surface viewer for now.
       * CodeView activation requires a persisted deliverable, so Review
       * still shows the surface; Validate & Save routes to CodeView. */
      useSurfaceViewer.getState().openFromRun(linkId, block.runId);
      return;
    }

    /* Payload path */
    if (isPayload) {
      const payload = block.payload;
      if (!payload) return;

      if (renderType === 'markdown' || renderType === 'report') {
        const snapshot = snapshotFromPayload(block.title, payload);
        const doc = snapshotToDocument(
          snapshot,
          'strategy',
          renderType
        );
        useDocumentViewer.getState().openInline(doc);
        return;
      }

      if (renderType === 'html' || renderType === 'deck') {
        /* Fall back to the drawer inline preview */
        const snapshot = snapshotFromPayload(block.title, payload);
        const doc = snapshotToDocument(snapshot, 'strategy', renderType);
        useDocumentViewer.getState().openInline(doc);
        return;
      }

      /* Code/sheet — route to CodeView via a temp deliverable */
      if (renderType === 'code' || renderType === 'sheet') {
        openCodeViewForPayload(block, payload);
        return;
      }
    }

    onReview?.(block.previewHref);
  };

  const openCodeViewForPayload = (block: OutputBlock, payload: any) => {
    /* Create a transient deliverable so CodeView can render it. */
    const def = resolveDef();
    const run = useAgentDrawerStore.getState().runs[block.runId];
    const opId = def?.id ?? (run as any)?.opId ?? block.title;
    const pageId = run?.page ?? 'strategy';

    const snapshot = snapshotFromPayload(block.title, payload);

    /* Never send a placeholder venture id to Postgres — it's a
       uuid column. Prefer the run's venture, fall back to the
       link's venture if there was one. */
    const resolvedVentureId =
      run?.ventureId ?? (run as any)?.ideaId ?? '';

    const id = addDeliverable({
      opId,
      pageId,
      ventureId: resolvedVentureId,
      title: block.title,
      kind: meta.kind as any,
      surfaceId: 'strategy.brief' as any,
      snapshot,
      runId: block.runId,
      agentId: block.agentId,
      renderType: (def?.renderType ?? 'code') as any,
      tier: (def?.tier ?? 'primary') as any,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('iv:open-code-view', { detail: { deliverableId: id } })
      );
    }
  };

  const handleValidate = () => {
    /* Research outputs are already persisted on the journey.
       Validate & Save just closes the drawer. */
    if (isResearch) {
      endRun(block.runId, 'done');
      closeDrawer();
      return;
    }

    const def = resolveDef();
    const renderType = def?.renderType ?? 'markdown';
    const tier = def?.tier ?? 'primary';

    /* Surface-backed — create deliverable from share link */
    if (isSurface) {
      const linkId = getLinkId();
      if (!linkId) return;
      const link = getLink(linkId);
      if (!link) return;

      const run = useAgentDrawerStore.getState().runs[block.runId];
      const opId = def?.id ?? (run as any)?.opId ?? block.title;
      const pageId = run?.page ?? link.surfaceId.split('.')[0];

      const deliverableId = addDeliverable({
        opId,
        pageId,
        ventureId: link.ventureId,
        title: link.snapshot.title,
        kind: meta.kind as any,
        surfaceId: link.surfaceId,
        snapshot: link.snapshot,
        /* Local share link id first — replaced by the DB token
           when the async write lands. */
        shareLinkId: linkId,
        runId: block.runId,
        agentId: block.agentId,
        renderType: renderType as any,
        tier: tier as any,
      });

      /* Write a DB-backed share link asynchronously. When it lands,
         patch the deliverable so the token is the DB one — that's
         what guests on other devices can resolve. */
      void createShareLink({
        outputId: deliverableId,
        ventureId: link.ventureId,
        surfaceId: link.surfaceId,
        snapshot: link.snapshot,
        commentsEnabled: true,
      }).then((res) => {
        if ('id' in res) {
          useDeliverablesStore.getState().updateDeliverable(deliverableId, {
            shareLinkId: res.id,
          });
        }
      });

      setSaved({ outputId: deliverableId, snapshot: link.snapshot });
      return;
    }

    /* Payload-only — build snapshot from payload and create deliverable */
    if (isPayload && block.payload) {
      const run = useAgentDrawerStore.getState().runs[block.runId];
      const opId = def?.id ?? (run as any)?.opId ?? block.title;
      const pageId = run?.page ?? 'strategy';

      /* Never a placeholder — uuid column on the DB side. */
      const resolvedVentureId =
        run?.ventureId ?? (run as any)?.ideaId ?? '';

      const snapshot = snapshotFromPayload(block.title, block.payload);

      const linkId = useShareStore.getState().createLink({
        surfaceId: 'strategy.brief' as any,
        ventureId: resolvedVentureId,
        snapshot,
        createdBy: 'Founder',
        commentsEnabled: false,
        expiresAt: null,
      });

      const deliverableId = addDeliverable({
        opId,
        pageId,
        ventureId: resolvedVentureId,
        title: block.title,
        kind: meta.kind as any,
        surfaceId: 'strategy.brief' as any,
        snapshot,
        shareLinkId: linkId,
        runId: block.runId,
        agentId: block.agentId,
        renderType: renderType as any,
        tier: tier as any,
      });

      /* DB-backed share link, same as the surface branch. */
      void createShareLink({
        outputId: deliverableId,
        ventureId: resolvedVentureId,
        surfaceId: 'strategy.brief' as any,
        snapshot,
        commentsEnabled: true,
      }).then((res) => {
        if ('id' in res) {
          useDeliverablesStore.getState().updateDeliverable(deliverableId, {
            shareLinkId: res.id,
          });
        }
      });

      setSaved({ outputId: deliverableId, snapshot });
    }
  };

  return (
    <li className="agent-output-card">
      <div className="agent-output-card__top">
        <span className="agent-output-card__kind">
          <Icon className="h-2.5 w-2.5" />
          {meta.label}
        </span>
        <span
          className={cn(
            'agent-output-card__status',
            `agent-output-card__status--${block.status}`
          )}
        >
          {block.status.replace('_', ' ')}
        </span>
      </div>

      <p className="agent-output-card__title">{block.title}</p>
      <span className="agent-output-card__destination">
        {block.destination}
      </span>

      {saved ? (
        <div className="agent-output-card__footer agent-output-card__footer--saved">
          <div className="agent-output-card__saved-line">
            <CheckCircle2 className="h-3 w-3" />
            <span>Validated</span>
          </div>
          <ShareRow outputId={saved.outputId} snapshot={saved.snapshot} />
          <button
            type="button"
            className="agent-output-card__close"
            onClick={() => {
              endRun(block.runId, 'done');
              closeDrawer();
            }}
          >
            Close
          </button>
        </div>
      ) : (
        <div className="agent-output-card__footer agent-output-card__footer--dual">
          <button
            type="button"
            className="agent-output-card__review"
            onClick={handleReview}
          >
            Review
            <ArrowRight className="h-3 w-3" />
          </button>
          <button
            type="button"
            className="agent-output-card__validate"
            onClick={handleValidate}
          >
            <CheckCircle2 className="h-3 w-3" />
            Validate &amp; Save
          </button>
        </div>
      )}
    </li>
  );
}

/* ---------- Snapshot builder for payload deliverables ---------- */

function snapshotFromPayload(title: string, payload: any): any {
  const sections: any[] = [];

  if (!payload || !payload.type) {
    sections.push({
      type: 'callout',
      id: 'summary',
      tone: 'ready',
      body: 'This op produced a payload.',
    });
    return { title, sections };
  }

  switch (payload.type) {
    case 'text':
      sections.push({
        type: 'paragraph',
        id: 'content',
        label: payload.label ?? 'Output',
        body: payload.text,
      });
      break;
    case 'json':
      sections.push({
        type: 'code',
        id: 'content',
        label: payload.label ?? 'Data',
        language: 'json',
        code: JSON.stringify(payload.data, null, 2),
      });
      break;
    case 'email':
      sections.push({ type: 'paragraph', id: 'to', label: 'To', body: payload.to });
      sections.push({ type: 'paragraph', id: 'subject', label: 'Subject', body: payload.subject });
      sections.push({ type: 'paragraph', id: 'body', label: 'Body', body: payload.body });
      break;
    case 'html':
      sections.push({
        type: 'embed',
        id: 'content',
        label: payload.label ?? null,
        html: payload.body ?? payload.html ?? '',
        aspect: 'auto',
      });
      break;
    case 'confirm':
      sections.push({
        type: 'callout',
        id: 'content',
        tone: 'ready',
        label: payload.heading,
        body: payload.body,
      });
      break;
    case 'link':
      sections.push({
        type: 'paragraph',
        id: 'content',
        label: payload.label ?? 'Link',
        body: payload.url,
      });
      break;
  }

  return { title, sections };
}
