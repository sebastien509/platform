import { useEffect, useRef, useState } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ContentGrid } from './ContentGrid';
import { CommandBar } from './CommandBar';
import { NotificationStack, NotificationsSidebar } from '@/components/notifications';
import { TraceDrawer } from '@/features/trace';
import { useUIStore, UI } from '@/lib/stores/uiStore';
import { cn } from '@/lib/utils/cn';

interface NavShellProps { children?: ReactNode; }
const VENTURE_ROUTE_RE = /^\/ventures\/([^/]+)/;

export function NavShell({ children }: NavShellProps) {
  const location = useLocation();
  const setVentureAutoCollapse = useUIStore((s) => s.setVentureAutoCollapse);
  const wasInVenture = useRef(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const ventureMatch = location.pathname.match(VENTURE_ROUTE_RE);
  const currentVentureId = ventureMatch?.[1];
  const isVentureRoute = Boolean(currentVentureId);

  useEffect(() => {
    const inVenture = Boolean(currentVentureId);
    if (inVenture && !wasInVenture.current) setVentureAutoCollapse(true);
    else if (!inVenture && wasInVenture.current) setVentureAutoCollapse(false);
    wasInVenture.current = inVenture;
  }, [currentVentureId, setVentureAutoCollapse]);

  useEffect(() => { setMobileNavOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileNavOpen]);

  return (
    <div className="iv-nav-shell flex h-screen w-full overflow-hidden bg-[var(--surface-0)]">
      {mobileNavOpen && (
        <button type="button" className="iv-nav-shell__backdrop"
          aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />
      )}
      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      <div className="iv-nav-shell__workspace relative flex min-w-0 flex-1 flex-col">
        {/* Topbar is the sole top navigation on every viewport. */}
        <Topbar
              currentVentureId={currentVentureId}
              onMobileMenuClick={() => setMobileNavOpen(true)}
            />
        <main
          className={cn('iv-nav-shell__main relative min-h-0 flex-1',
            isVentureRoute ? 'overflow-hidden' : 'overflow-y-auto')}
          style={{ '--monitoring-strip-height': `${UI.MONITORING_STRIP_COLLAPSED_HEIGHT}px` } as CSSProperties}
        >
          <ContentGrid fill={isVentureRoute}>{children ?? <Outlet />}</ContentGrid>
        </main>
        <CommandBar />
        <NotificationStack />
        <NotificationsSidebar />
        <TraceDrawer />
      </div>
    </div>
  );
}
