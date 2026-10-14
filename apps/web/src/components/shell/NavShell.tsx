import { ReactNode, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ContentGrid } from './ContentGrid';
import { CommandBar } from './CommandBar';
import { NotificationStack, NotificationsSidebar } from '@/components/notifications';
import { TraceDrawer } from '@/features/trace';
import { useUIStore, UI } from '@/lib/stores/uiStore';
import { cn } from '@/lib/utils/cn';

interface NavShellProps {
  children?: ReactNode;
}

const VENTURE_ROUTE_RE = /^\/ventures\/([^/]+)/;



export function NavShell({ children }: NavShellProps) {
  const location = useLocation();
  const setVentureAutoCollapse = useUIStore((s) => s.setVentureAutoCollapse);
  const wasInVenture = useRef(false);

  const ventureMatch = location.pathname.match(VENTURE_ROUTE_RE);
  const currentVentureId = ventureMatch?.[1];
  const isVentureRoute = Boolean(currentVentureId);

  useEffect(() => {
    const inVenture = Boolean(currentVentureId);
    if (inVenture && !wasInVenture.current) {
      setVentureAutoCollapse(true);
    } else if (!inVenture && wasInVenture.current) {
      setVentureAutoCollapse(false);
    }
    wasInVenture.current = inVenture;
  }, [currentVentureId, setVentureAutoCollapse]);
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--surface-0)]">
      <Sidebar />
      <div className="relative flex flex-1 flex-col min-w-0">
        <Topbar currentVentureId={currentVentureId} />
        <main
          className={cn(
            'flex-1 relative min-h-0',
            isVentureRoute ? 'overflow-hidden' : 'overflow-y-auto',
                      )}
          style={{
            ['--monitoring-strip-height' as any]: `${UI.MONITORING_STRIP_COLLAPSED_HEIGHT}px`,
          }}
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
