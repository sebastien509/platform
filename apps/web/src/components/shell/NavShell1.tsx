
import {
  useEffect,
  useRef,
  useState,
} from 'react';

import type { ReactNode } from 'react';

import {
  Outlet,
  useLocation,
} from 'react-router-dom';

import { Menu } from 'lucide-react';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ContentGrid } from './ContentGrid';
import { CommandBar } from './CommandBar';

import {
  NotificationStack,
  NotificationsSidebar,
} from '@/components/notifications';

import { TraceDrawer } from '@/features/trace';

import {
  useUIStore,
  UI,
} from '@/lib/stores/uiStore';

import { cn } from '@/lib/utils/cn';

interface NavShellProps {
  children?: ReactNode;
}

const VENTURE_ROUTE_RE = /^\/ventures\/([^/]+)/;

const IV_LOGO_ICON =
  'https://res.cloudinary.com/dvcmopd4q/image/upload/e_trim/v1789515612/Branding_IV_Basic_color_Blue_kawkqg.png';

export function NavShell({ children }: NavShellProps) {
  const location = useLocation();

  const setVentureAutoCollapse = useUIStore(
    (s) => s.setVentureAutoCollapse
  );

  const wasInVenture = useRef(false);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const ventureMatch = location.pathname.match(
    VENTURE_ROUTE_RE
  );

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
  }, [
    currentVentureId,
    setVentureAutoCollapse,
  ]);

  // Navigation closes automatically when the route changes.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileNavOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileNavOpen]);

  return (
    <div className="iv-nav-shell flex h-screen w-full overflow-hidden bg-[var(--surface-0)]">
      {mobileNavOpen && (
        <button
          type="button"
          className="iv-nav-shell__backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="iv-nav-shell__workspace relative flex min-w-0 flex-1 flex-col">
        {/* Visible only on mobile. The existing desktop
            Topbar continues to render unchanged. */}
        <div className="iv-nav-shell__mobile-bar">
          <button
            type="button"
            className="iv-nav-shell__menu-button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
            aria-expanded={mobileNavOpen}
          >
            <Menu size={19} />
          </button>

          <img
            src={IV_LOGO_ICON}
            alt="IV"
            className="iv-nav-shell__mobile-logo"
          />

          <span className="iv-nav-shell__mobile-label">
            Workspace
          </span>
        </div>

        <Topbar currentVentureId={currentVentureId} />

        <main
          className={cn(
            'iv-nav-shell__main',
            'relative min-h-0 flex-1',
            isVentureRoute
              ? 'overflow-hidden'
              : 'overflow-y-auto'
          )}
          style={
            {
              '--monitoring-strip-height':
                `${UI.MONITORING_STRIP_COLLAPSED_HEIGHT}px`,
            } as React.CSSProperties
          }
        >
          <ContentGrid fill={isVentureRoute}>
            {children ?? <Outlet />}
          </ContentGrid>
        </main>

        <CommandBar />

        <NotificationStack />
        <NotificationsSidebar />
        <TraceDrawer />
      </div>
    </div>
  );
}
