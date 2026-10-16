
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Calendar,
  Lightbulb,
  Rocket,
  Bot,
  Library,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

import {
  useUIStore,
  useEffectiveSidebarCollapsed,
} from '@/lib/stores/uiStore';

import { cn } from '@/lib/utils/cn';
import { getPageState } from '@/lib/config/pageStates';
import type { LucideIcon } from 'lucide-react';

const IV_LOGO_WORDMARK =
  'https://res.cloudinary.com/dvcmopd4q/image/upload/e_trim/v1789515611/Branding_IV_text_Color_Blue_vovyzb.png';

const IV_LOGO_ICON =
  'https://res.cloudinary.com/dvcmopd4q/image/upload/e_trim/v1789515612/Branding_IV_Basic_color_Blue_kawkqg.png';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

interface NavGroup {
  header: string;
  items: NavItem[];
}


/** Derive the page-state key from a nav route. */
function navKey(to: string): string {
  const seg = to.split('/').filter(Boolean)[0]?.toLowerCase() ?? '';
  // Map /apps-agents → 'apps' so pageStates key matches
  if (seg === 'apps-agents') return 'apps';
  return seg;
}

const NAV_GROUPS: NavGroup[] = [
  {
    header: 'Today',
    items: [
      { label: 'Today', to: '/today', icon: Calendar },
    ],
  },
  {
    header: 'Build',
    items: [
      { label: 'Ideas', to: '/ideas', icon: Lightbulb },
      { label: 'Ventures', to: '/ventures', icon: Rocket },
    ],
  },
  {
    header: 'Intelligence',
    items: [
      { label: 'Apps & Agents', to: '/apps-agents', icon: Bot },
      { label: 'Library', to: '/library', icon: Library },
      { label: 'Resources', to: '/resources', icon: BookOpen },
    ],
  },
];

const SETTINGS_ITEM: NavItem = {
  label: 'Settings',
  to: '/settings',
  icon: Settings,
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 767px)').matches
      : false
  );

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');

    const update = () => setIsMobile(query.matches);

    update();
    query.addEventListener('change', update);

    return () => {
      query.removeEventListener('change', update);
    };
  }, []);

  return isMobile;
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const storedCollapsed = useEffectiveSidebarCollapsed();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const expandSidebar = useUIStore((s) => s.expandSidebar);

  const isMobile = useIsMobile();

  // Mobile navigation always opens expanded.
  // Desktop keeps its original collapse behavior.
  const collapsed = isMobile ? false : storedCollapsed;

  const handleNavClick = () => {
    if (isMobile) {
      onMobileClose?.();
      return;
    }

    if (collapsed) {
      expandSidebar();
    }
  };

  return (
    <aside
      className={cn(
        'iv-primary-sidebar',
        'relative flex h-full shrink-0 flex-col',
        'bg-[var(--surface-1)]',
        'border-r border-[var(--border-subtle)]',
        'transition-[width] duration-200 ease-out',
        isMobile && 'iv-primary-sidebar--mobile',
        isMobile && mobileOpen && 'is-open'
      )}
      style={{
        width: collapsed ? 56 : 240,
      }}
      aria-label="Platform navigation"
      aria-hidden={isMobile && !mobileOpen}
      data-collapsed={collapsed}
      data-mobile-open={mobileOpen}
    >
      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <div className="iv-primary-sidebar__brand flex h-14 shrink-0 items-center overflow-hidden px-3">
          
          {collapsed ? (
            <img
              src={IV_LOGO_ICON}
              alt="IV"
              className="mx-auto h-9 w-9 shrink-0 object-contain"
              style={{
                filter:
                  'brightness(0) saturate(100%) invert(13%) sepia(11%) saturate(1450%) hue-rotate(180deg) brightness(92%) contrast(91%)',
              }}
            />
          ) : (
            <img
              src={IV_LOGO_WORDMARK}
              alt="IV by InthraOS"
              className="h-7 w-auto max-w-full shrink-0 object-contain px-3"
              style={{
                filter:
                  'brightness(0) saturate(100%) invert(13%) sepia(11%) saturate(1450%) hue-rotate(180deg) brightness(92%) contrast(91%)',
              }}
            />
          )}

          {isMobile && (
            <button
              type="button"
              className="iv-primary-sidebar__mobile-close"
              onClick={onMobileClose}
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
          )}

        </div>

        <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto px-2 py-2">
          {NAV_GROUPS.map((group) => (
            <div key={group.header}>
              {!collapsed && (
                <p className="px-3 pb-1 text-2xs font-semibold uppercase tracking-wider text-[#7B8494]">
                {group.header}
              </p>
              )}

              <ul className="space-y-px">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavItemLink
                      item={item}
                      collapsed={collapsed}
                      onClick={handleNavClick}
                      tabIndex={isMobile && !mobileOpen ? -1 : undefined}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-[var(--border-subtle)] px-2 py-2">
          <ul className="space-y-px">
            <li>
              <NavItemLink
                item={SETTINGS_ITEM}
                collapsed={collapsed}
                onClick={handleNavClick}
                tabIndex={isMobile && !mobileOpen ? -1 : undefined}
              />
            </li>
          </ul>
        </div>

        {!isMobile && (
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={
              collapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }
            className={cn(
              'absolute -right-3 top-16 z-20',
              'flex h-6 w-6 items-center justify-center rounded-full',
              'bg-[var(--surface-1)] border border-[var(--border)]',
              'text-[var(--text-muted)]',
              'hover:text-[var(--accent)] hover:border-[var(--accent)]',
              'transition-colors'
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </button>
        )}
      </div>
    </aside>
  );
}

interface NavItemLinkProps {
  item: NavItem;
  collapsed: boolean;
  onClick: () => void;
  tabIndex?: number;
}

function NavItemLink({
  item,
  collapsed,
  onClick,
  tabIndex,
}: NavItemLinkProps) {
  const Icon = item.icon;

  const pageState = getPageState(navKey(item.to));

  return (
    <NavLink
      data-page-state={pageState}
      to={item.to}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      tabIndex={tabIndex}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-2.5 rounded-[5px]',
          collapsed
            ? 'mx-auto h-8 w-8 justify-center px-0 py-0'
            : 'px-3 py-1.5',
          'text-sm transition-colors',
          isActive
            ? 'bg-[#EDF2FF] text-[#426BFA] font-semibold'
            : 'text-[#303846] font-medium hover:bg-[#F3F4F6] hover:text-[#202736]'
        )
      }
    >
      {() => (
        <>
          <Icon className="h-3.5 w-3.5 shrink-0" />

          {!collapsed && (
            <span className="truncate">
              {item.label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}