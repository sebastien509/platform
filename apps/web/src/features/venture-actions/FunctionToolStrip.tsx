/* ============================================================
   IV — Function Tool Strip
   The real-world action surface on every venture page.

   Native actions run in-platform. Connected actions fall back
   to "Copy and open" until a connector is linked.
   ============================================================ */

import { useState } from 'react';
import { OpsRowItem } from './OpsRowItem';
import { ActionPreviewModal } from './ActionPreviewModal';
import { getActionsForPage } from './page-actions';
import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import { useVentureStore } from '@/lib/stores/ventureStore';
import type { ActionDef, ActionPayload } from './page-actions';
import type { Action } from '@/lib/types';

interface FunctionToolStripProps {
  pageKey: string;
  ventureId?: string;
  /** When present, only render the actions whose ids are in this list. */
  onlyActionIds?: string[];
}

export function FunctionToolStrip({
  pageKey,
  ventureId,
  onlyActionIds,
}: FunctionToolStripProps) {
  const allActions = getActionsForPage(pageKey);
  const actions = onlyActionIds
    ? allActions.filter((a) => onlyActionIds.includes(a.id))
    : allActions;

  const confirmAction = useAgentDrawerStore((s) => s.confirmAction);
  const executeAction = useAgentDrawerStore((s) => s.executeAction);
  const recordOutcome = useAgentDrawerStore((s) => s.recordOutcome);
  const addOutcome = useVentureStore((s) => s.addOutcome);

  const [preview, setPreview] = useState<{
    action: Action;
    def: ActionDef;
    payload: ActionPayload;
  } | null>(null);

  if (actions.length === 0) return null;

  const handleConfirm = () => {
    if (!preview) return;
    const { action, def, payload } = preview;

    /* Confirm → Execute → (auto) Record in Native mode.
     * Connected mode falls back to copy-to-clipboard, which is
     * a Native-ish outcome — we still record it. */
    confirmAction(action.id);
    executeAction(action.id);

    /* Record the outcome for Proven tracking. */
    const recordId = `outcome_${Date.now()}`;
    if (ventureId) {
      addOutcome({
        id: recordId,
        decision: 'win',
        title: def.verb,
        summary: def.description ?? def.verb,
        decisionMadeAt: new Date().toISOString(),
        decidedBy: 'agent_recommended',
        sourceVentureId: ventureId,
        sourceFunction: pageKey,
        measuredResult:
          def.mode === 'native'
            ? 'Shipped from IV — no connectors required.'
            : `Copied for manual action in ${def.connector ?? 'external tool'}.`,
        measuredAt: new Date().toISOString(),
      });
    }

    /* Connected mode: copy the primary content to clipboard so the
     * founder can paste it into the external tool. */
    if (def.mode === 'connected') {
      const copyText = extractCopyText(payload);
      if (copyText && typeof navigator !== 'undefined') {
        navigator.clipboard?.writeText(copyText).catch(() => {});
      }
    }

    /* Mark proven after a beat — the mock world always succeeds. */
    setTimeout(() => recordOutcome(action.id), 800);

    setPreview(null);
  };

  return (
    <>
      <div className="function-tool-strip">
        <div className="function-tool-strip__actions">
          {actions.map((def) => (
              <OpsRowItem
                key={def.id}
                def={def}
                pageId={pageKey}
                ventureId={ventureId}
              />
          ))}
        </div>
      </div>

      <ActionPreviewModal
        action={preview?.action ?? null}
        def={preview?.def ?? null}
        payload={preview?.payload ?? null}
        onClose={() => setPreview(null)}
        onConfirm={handleConfirm}
      />
    </>
  );
}

/* ---------- Clipboard helper ---------- */

function extractCopyText(payload: ActionPayload): string | null {
  switch (payload.type) {
    case 'email':
      return `To: ${payload.to}\nSubject: ${payload.subject}\n\n${payload.body}`;
    case 'text':
      return payload.text;
    case 'json':
      return JSON.stringify(payload.data, null, 2);
    case 'html':
      return payload.html;
    case 'confirm':
      return payload.body;
    case 'link':
      return payload.url;
    default:
      return null;
  }
}
