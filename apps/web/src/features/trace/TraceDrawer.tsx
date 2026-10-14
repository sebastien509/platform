import { useNavigate } from 'react-router-dom';
import { DrawerShell } from '@/components/containers';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { useTraceStore } from '@/lib/stores/traceStore';
import { useTrace } from '@/lib/hooks/useTrace';
import { TraceLineageView } from './TraceLineageView';
import type { TraceItem } from '@/lib/stores/traceStore';

export function TraceDrawer() {
  const navigate = useNavigate();
  const open = useTraceStore((s) => s.open);
  const close = useTraceStore((s) => s.closeTrace);
  const walkTo = useTraceStore((s) => s.walkTo);

  const { lineage, loading } = useTrace();

  function handleOpen(item: TraceItem) {
    if (item.href) {
      navigate(item.href);
      close();
    }
  }

  function handleWalk(item: TraceItem) {
    walkTo(item.id, item.kind);
  }

  return (
    <DrawerShell
      open={open}
      onOpenChange={(v) => !v && close()}
      title="Lineage"
      description="Where this came from and what it led to."
      side="right"
      width={440}
    >
      <div className="py-4">
        {loading && (
          <div className="space-y-3 px-2">
            <LoadingSkeleton count={3} className="h-16" />
          </div>
        )}

        {!loading && !lineage && (
          <p className="text-sm text-[var(--text-muted)] py-8 text-center">
            Nothing to trace.
          </p>
        )}

        {!loading && lineage && (
          <TraceLineageView
            lineage={lineage}
            onWalk={handleWalk}
            onOpen={handleOpen}
          />
        )}
      </div>
    </DrawerShell>
  );
}
