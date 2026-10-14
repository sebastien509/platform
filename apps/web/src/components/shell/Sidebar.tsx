import { NavLink } from 'react-router-dom';
import {
  Calendar, Lightbulb, Rocket, Bot, Library, BookOpen, Settings, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useUIStore, useEffectiveSidebarCollapsed } from '@/lib/stores/uiStore';
import { cn } from '@/lib/utils/cn';
import type { LucideIcon } from 'lucide-react';

const COLLAPSED_ICON_OPACITY = 'opacity-60';

/* e_trim removes the transparent padding on the 3600×3600 canvas so
   sizing is based on the visible mark, not the empty square. */
const IV_LOGO_WORDMARK =
  'https://res.cloudinary.com/dvcmopd4q/image/upload/e_trim/v1789515611/Branding_IV_text_Color_Blue_vovyzb.png';
const IV_LOGO_ICON =
  'https://res.cloudinary.com/dvcmopd4q/image/upload/e_trim/v1789515612/Branding_IV_Basic_color_Blue_kawkqg.png';

interface NavItem { label: string; to: string; icon: LucideIcon; }
interface NavGroup { header: string; items: NavItem[]; }

const NAV_GROUPS: NavGroup[] = [
  { header: 'Today', items: [{ label: 'Today', to: '/today', icon: Calendar }] },
  { header: 'Build', items: [
    { label: 'Ideas', to: '/ideas', icon: Lightbulb },
    { label: 'Ventures', to: '/ventures', icon: Rocket },
  ]},
  { header: 'Intelligence', items: [
    { label: 'Apps & Agents', to: '/apps-agents', icon: Bot },
    { label: 'Library', to: '/library', icon: Library },
    { label: 'Resources', to: '/resources', icon: BookOpen },
  ]},
];

const SETTINGS_ITEM: NavItem = { label: 'Settings', to: '/settings', icon: Settings };

export function Sidebar() {
  const collapsed = useEffectiveSidebarCollapsed();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const expandSidebar = useUIStore((s) => s.expandSidebar);
  const handleNavClick = () => { if (collapsed) expandSidebar(); };

  return (
    <aside
      style={{ width: collapsed ? 56 : 240 }}
      className={cn(
        'relative flex h-full shrink-0 flex-col',
        'bg-[var(--surface-1)] border-r border-[var(--border-subtle)]',
        'transition-[width] duration-200 ease-out'
      )}
    >
      <div className="relative z-10 flex h-full flex-col">
        {/* Logo — real asset. Icon when collapsed, wordmark when expanded.
            overflow-hidden prevents the image compressing during the
            width transition. */}
        <div className="flex h-14 items-center px-3 overflow-hidden ">
          {collapsed ? (
            <img
              src={IV_LOGO_ICON}
              alt="IV"
              className="h-9 w-9  shrink-0 object-contain mx-auto"
            />
          ) : (
            <img
              src={IV_LOGO_WORDMARK}
              alt="InthraOS"
              className="h-7 px-3 w-auto shrink-0 object-contain"
              style={{ maxWidth: 'calc(100% - 8px)' }}
            />
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.header}>
              {!collapsed && (
                <p className="px-3 pb-1 text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  {group.header}
                </p>
              )}
              <ul className="space-y-px">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavItemLink item={item} collapsed={collapsed} onClick={handleNavClick} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--border-subtle)] px-2 py-2">
          <ul className="space-y-px">
            <li><NavItemLink item={SETTINGS_ITEM} collapsed={collapsed} onClick={handleNavClick} /></li>
          </ul>
        </div>

        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'absolute -right-3 top-16 z-20',
            'flex h-6 w-6 items-center justify-center rounded-full',
            'bg-[var(--surface-1)] border border-[var(--border)]',
            'text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]',
            'transition-colors'
          )}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </div>
    </aside>
  );
}

function NavItemLink({ item, collapsed, onClick }: { item: NavItem; collapsed: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-2.5 rounded-md',
          collapsed ? 'h-8 w-8 mx-auto justify-center px-0 py-0' : 'px-3 py-1.5',
          'text-sm transition-colors',
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
  );
}