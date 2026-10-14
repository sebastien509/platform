import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { OpsCard } from './OpsCard';
import { getActionDefs } from './page-actions';
import { useDeliverablesStore } from '@/lib/deliverables';
import type { ActionDef } from './page-actions';

interface OpsGridProps {
  recommendedActionIds?: string[];
  moreActionIds?: string[];
  allActionIds: string[];
  pageId: string;
  ventureId?: string;
  pageBlocked?: boolean;
}

/**
 * OpsGrid — the ops discovery surface.
 *
 * Three sections, all always visible when populated:
 *   1. Recommended (all, active + completed interleaved by state)
 *   2. More (collapsed by default)
 *   3. Completed (any validated op — recommended or more — muted)
 *
 * Nothing filters out. If an op is listed, it renders somewhere.
 */
export function OpsGrid({
  recommendedActionIds,
  moreActionIds,
  allActionIds,
  pageId,
  ventureId,
  pageBlocked = false,
}: OpsGridProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const { ventureId: routeVentureId } = useParams<{ ventureId: string }>();
  const scopeVentureId = routeVentureId ?? ventureId;

  const deliverables = useDeliverablesStore((s) => s.deliverables);

  /* Scoped to THIS venture. Without the ventureId filter, a
     validated deliverable in another venture makes this page
     think the op is complete — the card moves to the
     "completed" section but renders as available (blue),
     which is exactly the mismatch the founder saw. */
  const hasValidated = useMemo(() => {
    const set = new Set<string>();
    for (const d of Object.values(deliverables)) {
      if (d.pageId !== pageId) continue;
      if (d.status !== 'validated') continue;
      if (scopeVentureId && d.ventureId !== scopeVentureId) continue;
      set.add(d.opId);
    }
    return set;
  }, [deliverables, pageId, scopeVentureId]);

  const hasGrouping =
    Array.isArray(recommendedActionIds) && recommendedActionIds.length > 0;

  const recommended: ActionDef[] = hasGrouping
    ? getActionDefs(recommendedActionIds!)
    : getActionDefs(allActionIds);

  const more: ActionDef[] = hasGrouping
    ? getActionDefs(
        moreActionIds ??
          allActionIds.filter((id) => !recommendedActionIds!.includes(id))
      )
    : [];

  /* Split recommended + more by completion state, but keep both
   * visible. Completed ones dim in place. */
  const recActive = recommended.filter((d) => !hasValidated.has(d.id));
  const recComplete = recommended.filter((d) => hasValidated.has(d.id));
  const moreActive = more.filter((d) => !hasValidated.has(d.id));
  const moreComplete = more.filter((d) => hasValidated.has(d.id));

  /* Completed row aggregates across recommended + more so
   * validated deliverables never disappear behind the toggle. */
  const completed = [...recComplete, ...moreComplete];

  return (
    <div className="ops-grid-wrap">
      {/* Recommended — active cards */}
      {recActive.length > 0 && (
        <div className="ops-grid">
          {recActive.map((def) => (
            <OpsCard
              key={def.id}
              def={def}
              pageId={pageId}
              ventureId={ventureId}
              pageBlocked={pageBlocked}
            />
          ))}
        </div>
      )}

      {/* More — collapsed toggle */}
      {moreActive.length > 0 && (
        <div className="ops-more">
          <button
            type="button"
            className="ops-more__toggle"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
          >
            {moreOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            {moreOpen ? 'Hide' : 'More operations'}
            <span className="ops-more__count">{moreActive.length}</span>
          </button>

          {moreOpen && (
            <div className="ops-grid ops-grid--secondary">
              {moreActive.map((def) => (
                <OpsCard
                  key={def.id}
                  def={def}
                  pageId={pageId}
                  ventureId={ventureId}
                  pageBlocked={pageBlocked}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Completed — always visible, muted, at the bottom */}
      {completed.length > 0 && (
        <div className="ops-grid ops-grid--completed">
          {completed.map((def) => (
            <OpsCard
              key={def.id}
              def={def}
              pageId={pageId}
              ventureId={ventureId}
              pageBlocked={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
