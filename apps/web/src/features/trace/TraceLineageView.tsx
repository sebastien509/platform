import { ArrowDown } from 'lucide-react';
import { TraceItemRow } from './TraceItemRow';
import type { TraceLineage, TraceItem } from '@/lib/stores/traceStore';

interface TraceLineageViewProps {
  lineage: TraceLineage;
  onWalk: (item: TraceItem) => void;
  onOpen: (item: TraceItem) => void;
}

interface SectionProps {
  label: string;
  items: TraceItem[];
  onWalk: (item: TraceItem) => void;
  onOpen: (item: TraceItem) => void;
}

function Section({ label, items, onWalk, onOpen }: SectionProps) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)] px-2.5 mb-1.5">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <TraceItemRow
            key={item.id}
            item={item}
            onWalk={onWalk}
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  );
}

export function TraceLineageView({ lineage, onWalk, onOpen }: TraceLineageViewProps) {
  const { origin, current, evidence, downstream, related } = lineage;

  return (
    <div className="space-y-3">
      {/* Origin chain */}
      {origin.length > 0 && (
        <>
          <Section
            label="Came from"
            items={origin}
            onWalk={onWalk}
            onOpen={onOpen}
          />
          <div className="flex justify-center py-1">
            <ArrowDown className="h-3 w-3 text-[var(--text-muted)]" />
          </div>
        </>
      )}

      {/* Current — highlighted */}
      <div>
        <p className="text-2xs font-medium uppercase tracking-wider text-[var(--accent)] px-2.5 mb-1.5">
          You are here
        </p>
        <TraceItemRow item={current} isCurrent />
      </div>

      {/* Evidence */}
      {evidence.length > 0 && (
        <>
          <div className="flex justify-center py-1">
            <ArrowDown className="h-3 w-3 text-[var(--text-muted)]" />
          </div>
          <Section
            label="Evidence"
            items={evidence}
            onWalk={onWalk}
            onOpen={onOpen}
          />
        </>
      )}

      {/* Downstream */}
      {downstream.length > 0 && (
        <>
          <div className="flex justify-center py-1">
            <ArrowDown className="h-3 w-3 text-[var(--text-muted)]" />
          </div>
          <Section
            label="Led to"
            items={downstream}
            onWalk={onWalk}
            onOpen={onOpen}
          />
        </>
      )}

      {/* Related — detached */}
      {related.length > 0 && (
        <div className="pt-2 border-t border-[var(--border-subtle)]">
          <Section
            label="Related"
            items={related}
            onWalk={onWalk}
            onOpen={onOpen}
          />
        </div>
      )}
    </div>
  );
}
