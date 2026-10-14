import { useLatestDeliverable } from '@/lib/deliverables';
import { ActionButton } from './ActionButton';
import { DeliverableCard } from './DeliverableCard';
import type { ActionDef } from './page-actions';

interface OpsRowItemProps {
  def: ActionDef;
  pageId: string;
  ventureId?: string;
}

/**
 * OpsRowItem — renders the ActionButton by default. Once the op has
 * produced a validated deliverable, renders a compact DeliverableCard
 * in the same slot. This is the "ops card replaces itself with the
 * deliverable" behavior.
 *
 * Matching key: (pageId, def.id) — the same pair used when the
 * deliverable was created via OutputBlockView / SurfaceViewerModal.
 */
export function OpsRowItem({ def, pageId, ventureId }: OpsRowItemProps) {
  const deliverable = useLatestDeliverable(pageId, def.id);

  if (deliverable && deliverable.status === 'validated') {
    return (
      <DeliverableCard
        deliverable={deliverable}
        variant="compact"
        ventureId={ventureId}
      />
    );
  }

  return <ActionButton def={def} ventureId={ventureId} pageId={pageId} />;
}
