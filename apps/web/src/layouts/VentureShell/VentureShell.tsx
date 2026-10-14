import { useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { VentureHeader } from './VentureHeader';
import { VentureSidebar } from './VentureSidebar';
import { useVenture } from '@/lib/hooks/useVentures';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import { useDeliverablesStore } from '@/lib/deliverables';

/** Existing shell structure, scrolling and venture store scoping preserved. */
export function VentureShell() {
  const { ventureId } = useParams<{ ventureId: string }>();
  const { data: ventureData, isLoading } = useVenture(ventureId!);
  const venture = ventureData ?? undefined;

  const setAgentVentureId = useAgentDrawerStore((s) => s.setActiveVentureId);
  const setDeliverablesVentureId = useDeliverablesStore((s) => s.setActiveVentureId);
  useEffect(() => {
    const id = ventureId ?? null;
    setAgentVentureId(id);
    setDeliverablesVentureId(id);
  }, [ventureId, setAgentVentureId, setDeliverablesVentureId]);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <VentureSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <VentureHeader venture={venture} />
        {isLoading && (
          <div className="px-4 py-2"><LoadingSkeleton count={1} className="h-6" /></div>
        )}
        <div className="venture-shell__scroll"><Outlet /></div>
      </div>
    </div>
  );
}
