import { cn } from '@/lib/utils/cn';
import { runAction } from './runAction';
import { getActionDefs } from './page-actions';
import { useCurrentPage } from '@/features/venture-pages/engine/PageContext';
import type { ActionDef } from './page-actions';

interface CardActionsProps {
  actionIds: string[];
  /** Optional override. Falls back to PageContext. */
  pageId?: string;
  ventureId?: string;
  className?: string;
}

/**
 * CardActions — inline ops inside a card.
 * Reads pageId from PageContext so consumers don't have to pass it.
 */
export function CardActions({
  actionIds,
  pageId: pageIdProp,
  ventureId: ventureIdProp,
  className,
}: CardActionsProps) {
  const ctx = useCurrentPage();
  const pageId = pageIdProp ?? ctx.pageId;
  const ventureId = ventureIdProp ?? ctx.ventureId;

  const defs = getActionDefs(actionIds);
  if (defs.length === 0) return null;

  const handleClick = (def: ActionDef) => {
    runAction(def, { ventureId, pageId });
  };

  return (
    <div className={cn('card-actions', className)}>
      {defs.map((def) => (
        <button
          key={def.id}
          type="button"
          className={cn('card-actions__btn', def.primary && 'is-primary')}
          onClick={() => handleClick(def)}
        >
          {def.verb}
        </button>
      ))}
    </div>
  );
}
