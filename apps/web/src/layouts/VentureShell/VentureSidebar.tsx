
import {
  useEffect,
  useRef,
} from 'react';

import { NavLink, useParams } from 'react-router-dom';

import {
  LayoutDashboard,
  Target,
  Package,
  Code,
  Megaphone,
  Send,
  Users,
  TrendingUp,
  Wallet,
  BarChart3,
  Library,
  Trophy,
  Plug,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

import { useUIStore } from '@/lib/stores/uiStore';
import { cn } from '@/lib/utils/cn';
import type { LucideIcon } from 'lucide-react';

const COLLAPSED_ICON_OPACITY = 'opacity-60';

interface VentureNavItem {
  label: string;
  segment: string;
  icon: LucideIcon;
  soon?: boolean;
}

interface VentureNavGroup {
  header: string;
  items: VentureNavItem[];
}

interface VentureSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const VENTURE_NAV: VentureNavGroup[] = [
  {
    header: 'Overview',
    items: [
      {
        label: 'Overview',
        segment: '',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    header: 'Build',
    items: [
      {
        label: 'Strategy',
        segment: 'strategy',
        icon: Target,
      },
      {
        label: 'Product',
        segment: 'product',
        icon: Package,
      },
      {
        label: 'Engineering',
        segment: 'engineering',
        icon: Code,
      },
    ],
  },
  {
    header: 'Launch',
    items: [
      {
        label: 'GTM',
        segment: 'gtm',
        icon: Megaphone,
      },
      {
        label: 'Campaigns',
        segment: 'campaigns',
        icon: Send,
      },
      {
        label: 'Sales',
        segment: 'sales',
        icon: Users,
      },
    ],
  },
  {
    header: 'Grow',
    items: [
      {
        label: 'Growth',
        segment: 'growth',
        icon: TrendingUp,
      },
      {
        label: 'Funding',
        segment: 'funding',
        icon: Wallet,
      },
    ],
  },
  {
    header: 'System',
    items: [
      {
        label: 'Knowledge',
        segment: 'knowledge',
        icon: Library,
      },
      {
        label: 'Analytics',
        segment: 'analytics',
        icon: BarChart3,
        soon: true,
      },
      {
        label: 'Outcomes',
        segment: 'outcomes',
        icon: Trophy,
      },
      {
        label: 'Connectors',
        segment: 'connectors',
        icon: Plug,
      },
    ],
  },
];

export function VentureSidebar({
  mobileOpen = false,
  onMobileClose,
}: VentureSidebarProps) {
  const { ventureId } = useParams<{ ventureId: string }>();

  const collapsed = useUIStore(
    (s) => s.ventureSidebarCollapsed
  );

  const toggle = useUIStore(
    (s) => s.toggleVentureSidebar
  );

  const expand = useUIStore(
    (s) => s.setVentureSidebarCollapsed
  );

  const sidebarRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const base = `/ventures/${ventureId}`;

  const handleNavClick = () => {
    onMobileClose?.();

    // Preserve the original desktop click-to-expand behavior.
    // Mobile clicks close the mobile drawer instead.
    if (
      collapsed &&
      !window.matchMedia('(max-width: 767px)').matches
    ) {
      expand(false);
    }
  };

  useEffect(() => {
    if (!mobileOpen) return;

    const mobileQuery = window.matchMedia(
      '(max-width: 767px)'
    );

    if (!mobileQuery.matches) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onMobileClose?.();
      }

      if (event.key !== 'Tab') return;

      const sidebar = sidebarRef.current;
      if (!sidebar) return;

      const focusable = Array.from(
        sidebar.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])'
        )
      ).filter((element) => element.getClientRects().length > 0);

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen, onMobileClose]);

  return (
    <aside
      ref={sidebarRef}
      style={{
        width: collapsed ? 48 : 176,
      }}
      className={cn(
        'iv-venture-sidebar',
        'relative flex h-full shrink-0 flex-col',
        'bg-[var(--surface-1)]',
        'border-r border-[var(--border-subtle)]',
        'transition-[width] duration-200 ease-out',
        mobileOpen && 'is-mobile-open'
      )}
      // aria-label="Venture navigation"
      data-collapsed={collapsed}
      data-mobile-open={mobileOpen}
    >
      <div className="iv-venture-sidebar__mobile-header">
        <span>Venture navigation</span>

        <button
          ref={closeButtonRef}
          type="button"
          onClick={onMobileClose}
          aria-label="Close venture navigation"
          className="iv-venture-sidebar__close"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto px-2 py-3">
        {VENTURE_NAV.map((group) => (
          <div key={group.header}>
            <p
              className={cn(
                'iv-venture-sidebar__group-heading',
                'px-3 pb-1 text-2xs font-medium',
                'uppercase tracking-wider',
                'text-[var(--text-muted)]',
                collapsed && 'iv-venture-sidebar__collapsed-only'
              )}
            >
              {group.header}
            </p>

            <ul className="space-y-px">
              {group.items.map((item) => {
                const to = item.segment
                  ? `${base}/${item.segment}`
                  : base;

                const Icon = item.icon;

                return (
                  <li key={item.segment || 'index'}>
                    <NavLink
                      to={to}
                      end={!item.segment}
                      onClick={handleNavClick}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          'iv-venture-sidebar__link',
                          'relative flex items-center gap-2.5',
                          'rounded-md text-sm transition-colors',
                          collapsed
                            ? 'iv-venture-sidebar__link--collapsed h-8 w-8 mx-auto justify-center px-0 py-0'
                            : 'px-3 py-1.5',
                          isActive
                            ? 'bg-[var(--accent-muted)] text-[var(--accent)] font-medium'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]',
                          collapsed &&
                            `${COLLAPSED_ICON_OPACITY} hover:opacity-100`
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span
                              className="iv-venture-sidebar__active-indicator"
                              style={{
                                background: 'var(--accent)',
                              }}
                            />
                          )}

                          <Icon
                            className="h-3.5 w-3.5 shrink-0"
                            aria-hidden="true"
                          />

                          <span
                            className={cn(
                              'iv-venture-sidebar__label truncate',
                              collapsed &&
                                'iv-venture-sidebar__collapsed-only'
                            )}
                          >
                            {item.label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <button
        type="button"
        onClick={toggle}
        aria-label={
          collapsed
            ? 'Expand venture menu'
            : 'Collapse venture menu'
        }
        className={cn(
          'iv-venture-sidebar__toggle',
          'absolute -right-3 top-16 z-10',
          'flex h-6 w-6 items-center justify-center',
          'rounded-full',
          'bg-[var(--surface-1)] border border-[var(--border)]',
          'text-[var(--text-muted)]',
          'hover:text-[var(--text-primary)]',
          'transition-colors'
        )}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  );
}
