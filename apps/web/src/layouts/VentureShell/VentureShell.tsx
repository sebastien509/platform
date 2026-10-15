
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Outlet,
  useLocation,
  useParams,
} from 'react-router-dom';

import {
  Menu,
  PanelLeftClose,
} from 'lucide-react';

import { VentureHeader } from './VentureHeader';
import { VentureSidebar } from './VentureSidebar';

import { useVenture } from '@/lib/hooks/useVentures';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import { useDeliverablesStore } from '@/lib/deliverables';

import { VentureIntelligence } from
  '@/features/venture-intelligence/VentureIntelligence';

export function VentureShell() {
  const { ventureId } = useParams<{ ventureId: string }>();
  const location = useLocation();

  const { data: ventureData, isLoading } =
    useVenture(ventureId!);

  const venture = ventureData ?? undefined;

  const setAgentVentureId = useAgentDrawerStore(
    (s) => s.setActiveVentureId
  );

  const setDeliverablesVentureId = useDeliverablesStore(
    (s) => s.setActiveVentureId
  );

  const [mobileVentureNavOpen, setMobileVentureNavOpen] =
    useState(false);

  const mobileNavButtonRef =
    useRef<HTMLButtonElement>(null);

  const closeMobileVentureNav = useCallback(() => {
    setMobileVentureNavOpen(false);
  }, []);

  useEffect(() => {
    const id = ventureId ?? null;

    setAgentVentureId(id);
    setDeliverablesVentureId(id);
  }, [
    ventureId,
    setAgentVentureId,
    setDeliverablesVentureId,
  ]);

  useEffect(() => {
    closeMobileVentureNav();
  }, [location.pathname, closeMobileVentureNav]);

  useEffect(() => {
    if (!mobileVentureNavOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMobileVentureNav();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [
    mobileVentureNavOpen,
    closeMobileVentureNav,
  ]);

  return (
    <div className="iv-venture-shell flex h-full w-full min-w-0 overflow-hidden">
      {mobileVentureNavOpen && (
        <button
          type="button"
          className="iv-venture-shell__backdrop"
          onClick={closeMobileVentureNav}
          aria-label="Close venture navigation"
        />
      )}

      <VentureSidebar
        mobileOpen={mobileVentureNavOpen}
        onMobileClose={closeMobileVentureNav}
      />

      <div className="iv-venture-shell__main flex min-w-0 flex-1 flex-col">
        <VentureHeader venture={venture} />

        {isLoading && (
          <div className="px-4 py-2">
            <LoadingSkeleton
              count={1}
              className="h-6"
            />
          </div>
        )}

        <div className="iv-venture-shell__mobile-nav">
          <button
            ref={mobileNavButtonRef}
            type="button"
            className="iv-venture-shell__mobile-nav-button"
            onClick={() => setMobileVentureNavOpen(true)}
            aria-label="Open venture navigation"
            aria-expanded={mobileVentureNavOpen}
          >
            <Menu size={17} />
            <span>Venture pages</span>
          </button>

          <PanelLeftClose
            size={15}
            aria-hidden="true"
            className="iv-venture-shell__mobile-nav-icon"
          />
        </div>

        <div className="venture-shell__scroll">
          <Outlet />
        </div>

        {ventureId && !isLoading && (
          <VentureIntelligence
            key={ventureId}
            ventureId={ventureId}
            ventureName={venture?.name ?? 'This venture'}
            pathname={location.pathname}
            suspended={mobileVentureNavOpen}
          />
        )}
      </div>
    </div>
  );
}
