import {
  NavLink,
  useParams } from 'react-router-dom';
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
} from 'lucide-react';
import { useUIStore } from '@/lib/stores/uiStore';
import { cn } from '@/lib/utils/cn';
import type { LucideIcon } from 'lucide-react';

const COLLAPSED_ICON_OPACITY = 'opacity-60';

interface VentureNavItem {
  label: string;
  segment: string;
  icon: LucideIcon;  soon?: boolean;
}

interface VentureNavGroup {
  header: string;
  items: VentureNavItem[];
}

const VENTURE_NAV: VentureNavGroup[] = [
  {
    header: 'Overview',
    items: [
      { label: 'Overview', segment: '', icon: LayoutDashboard },
    ],
  },
  {
    header: 'Build',
    items: [
      { label: 'Strategy', segment: 'strategy', icon: Target },
      { label: 'Product', segment: 'product', icon: Package },
      { label: 'Engineering', segment: 'engineering', icon: Code },
    ],
  },
  {
    header: 'Launch',
    items: [
      { label: 'GTM', segment: 'gtm', icon: Megaphone },
      { label: 'Campaigns', segment: 'campaigns', icon: Send },
      { label: 'Sales', segment: 'sales', icon: Users },
    ],
  },
  {
    header: 'Grow',
    items: [
      { label: 'Growth', segment: 'growth', icon: TrendingUp },
      { label: 'Funding', segment: 'funding', icon: Wallet },
    ],
  },
  {
    header: 'System',
    items: [
      { label: 'Knowledge', segment: 'knowledge', icon: Library },
      { label: 'Analytics', segment: 'analytics', icon: BarChart3, soon: true },
      { label: 'Outcomes', segment: 'outcomes', icon: Trophy },
      { label: 'Connectors', segment: 'connectors', icon: Plug },
    ],
  },
];

export function VentureSidebar() {
  const { ventureId } = useParams<{ ventureId: string }>();
  const collapsed = useUIStore((s) => s.ventureSidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleVentureSidebar);
  const expand = useUIStore((s) => s.setVentureSidebarCollapsed);

  const base = `/ventures/${ventureId}`;

  const handleNavClick = () => {
    if (collapsed) expand(false);
  };

  return (
    <aside
      style={{ width: collapsed ? 48 : 176 }}
      className={cn(
        'relative flex h-full shrink-0 flex-col',
        'bg-[var(--surface-1)] border-r border-[var(--border-subtle)]',
        'transition-[width] duration-200 ease-out'
      )}
    >
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-3">
        {VENTURE_NAV.map((group) => (
          <div key={group.header}>
            {!collapsed && (
              <p className="px-3 pb-1 text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {group.header}
              </p>
            )}
            <ul className="space-y-px">
              {group.items.map((item) => {
                const to = item.segment ? `${base}/${item.segment}` : base;
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
                          'relative flex items-center gap-2.5 rounded-md text-sm transition-colors',
                          collapsed
                            ? 'h-8 w-8 mx-auto justify-center px-0 py-0'
                            : 'px-3 py-1.5',
                          isActive
                            ? 'bg-[var(--accent-muted)] text-[var(--accent)] font-medium'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]',
                          collapsed && `${COLLAPSED_ICON_OPACITY} hover:opacity-100`
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && !collapsed && (
                            <span
                              className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full"
                              style={{ background: 'var(--accent)' }}
                            />
                          )}
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          {!collapsed && <span className="truncate">{item.label}</span>}
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

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? 'Expand venture menu' : 'Collapse venture menu'}
        className={cn(
          'absolute -right-3 top-16 z-10',
          'flex h-6 w-6 items-center justify-center rounded-full',
          'bg-[var(--surface-1)] border border-[var(--border)]',
          'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
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
