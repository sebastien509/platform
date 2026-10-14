
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import {
  Search,
  Bell,
  Command,
  ChevronDown,
  Briefcase,
  Plus,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
} from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { useVentures } from '@/lib/hooks/useVentures';
import { useNotificationStore } from '@/lib/stores/notificationStore';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { supabase } from '@/lib/supabase';

const OPEN_COMMAND_BAR_EVENT = 'iv:open-command-bar';

const IV_LOGO_ICON =
  'https://res.cloudinary.com/dvcmopd4q/image/upload/e_trim/v1789515612/Branding_IV_Basic_color_Blue_kawkqg.png';

interface TopbarProps {
  currentVentureId?: string;
  onMobileMenuClick?: () => void;
}

function initials(
  name: string | null | undefined,
  email: string
): string {
  const base = (name ?? email ?? '').trim();

  if (!base) return '?';

  const parts = base.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return base.slice(0, 2).toUpperCase();
}

export function Topbar({
  currentVentureId,
  onMobileMenuClick,
}: TopbarProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showVentureDropdown, setShowVentureDropdown] =
    useState(false);

  const [showFounderMenu, setShowFounderMenu] =
    useState(false);

  const founderMenuRef = useRef<HTMLDivElement>(null);
  const ventureMenuRef = useRef<HTMLDivElement>(null);

  const { data: me } = useCurrentUser();

  const displayName = me?.profile?.name ?? 'Founder';
  const displayEmail = me?.profile?.email ?? '';
  const ini = initials(me?.profile?.name, displayEmail);

  const notificationsOpen = useNotificationStore(
    (state) => state.sidebarOpen
  );

  const openNotifications = useNotificationStore(
    (state) => state.openSidebar
  );

  const closeNotifications = useNotificationStore(
    (state) => state.closeSidebar
  );

  const unreadCount = useNotificationStore(
    (state) =>
      state.notifications.filter(
        (notification) => notification.state !== 'read'
      ).length
  );

  const hasAny = useNotificationStore(
    (state) => state.notifications.length > 0
  );

  const { data: ventures = [] } = useVentures();

  const currentVenture = ventures.find(
    (venture) => venture.id === currentVentureId
  );

  const insideVenture = Boolean(currentVenture);

  /* -----------------------------------------------
     Close account menu on outside click / Escape
     ----------------------------------------------- */

  useEffect(() => {
    if (!showFounderMenu) return;

    const onPointerDown = (event: MouseEvent) => {
      if (
        founderMenuRef.current &&
        !founderMenuRef.current.contains(
          event.target as Node
        )
      ) {
        setShowFounderMenu(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowFounderMenu(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener(
        'mousedown',
        onPointerDown
      );
      document.removeEventListener(
        'keydown',
        onKeyDown
      );
    };
  }, [showFounderMenu]);

  /* -----------------------------------------------
     Close venture dropdown
     ----------------------------------------------- */

  useEffect(() => {
    if (!showVentureDropdown) return;

    const onPointerDown = (event: MouseEvent) => {
      if (
        ventureMenuRef.current &&
        !ventureMenuRef.current.contains(
          event.target as Node
        )
      ) {
        setShowVentureDropdown(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowVentureDropdown(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener(
        'mousedown',
        onPointerDown
      );
      document.removeEventListener(
        'keydown',
        onKeyDown
      );
    };
  }, [showVentureDropdown]);

  function openSearch() {
    window.dispatchEvent(
      new Event(OPEN_COMMAND_BAR_EVENT)
    );
  }

  function toggleNotifications() {
    if (notificationsOpen) {
      closeNotifications();
    } else {
      openNotifications();
    }
  }

  async function handleSignOut() {
    setShowFounderMenu(false);

    await supabase.auth.signOut();

    queryClient.clear();

    navigate('/login', { replace: true });
  }

  return (
    <header
      className={cn(
        'iv-topbar',
        'relative z-30 flex h-14 shrink-0',
        'w-full min-w-0 items-center',
        'bg-[var(--surface-1)]',
        'border-b border-[var(--border-subtle)]',
        'px-4 lg:px-6'
      )}
    >
      <div className="iv-topbar__inner flex w-full min-w-0 items-center gap-3 lg:gap-4">

        {/* ===========================================
            MOBILE LEFT
            Menu + official IV icon
            No Workspace label
            No venture dropdown
            =========================================== */}

        <div className="iv-topbar__mobile-left flex shrink-0 items-center gap-3 md:hidden">
          <button
            type="button"
            onClick={onMobileMenuClick}
            aria-label="Open navigation"
            className={cn(
              'iv-topbar__menu',
              'flex h-9 w-9 shrink-0',
              'items-center justify-center',
              'rounded-lg',
              'border-0 shadow-none',
              'bg-transparent',
              'text-[var(--text-primary)]',
              'transition-colors',
              'hover:bg-[var(--surface-2)]'
            )}
          >
            <Menu className="h-[19px] w-[19px]" />
          </button>

          <div className="iv-topbar__mobile-brand flex h-9 items-center">
            <img
              src={IV_LOGO_ICON}
              alt="IV"
              className="h-8 w-8 object-contain"
            />
          </div>
        </div>

        {/* ===========================================
            DESKTOP VENTURE SELECTOR
            Hidden entirely on mobile
            =========================================== */}

        <div
          className="iv-topbar__venture hidden shrink-0 md:flex"
          ref={ventureMenuRef}
        >
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setShowVentureDropdown((value) => !value)
              }
              aria-expanded={showVentureDropdown}
              aria-haspopup="menu"
              className={cn(
                'flex max-w-full items-center gap-2',
                'rounded-lg px-3 py-1.5',
                'text-sm font-medium',
                'transition-colors',
                insideVenture
                  ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--accent-muted)] hover:text-[var(--accent)]'
              )}
            >
              <Briefcase className="h-4 w-4 shrink-0" />

              <span className="max-w-[180px] truncate">
                {currentVenture
                  ? currentVenture.name
                  : 'Select Venture'}
              </span>

              <ChevronDown className="h-4 w-4 shrink-0" />
            </button>

            {showVentureDropdown && (
              <div
                role="menu"
                className={cn(
                  'absolute left-0 top-full z-50 mt-1',
                  'w-56 max-w-[90vw]',
                  'rounded-lg bg-[var(--surface-1)]',
                  'py-1',
                  'border border-[var(--border-subtle)]',
                  'shadow-[var(--elevation-floating)]'
                )}
              >
                {ventures.map((venture) => {
                  const isSelected =
                    venture.id === currentVentureId;

                  return (
                    <button
                      key={venture.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        navigate(
                          `/ventures/${venture.id}`
                        );
                        setShowVentureDropdown(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-2',
                        'px-3 py-2 text-left text-sm',
                        'transition-colors',
                        isSelected
                          ? 'bg-[var(--accent-muted)] text-[var(--accent)] font-medium'
                          : 'text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
                      )}
                    >
                      <Briefcase
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isSelected
                            ? 'text-[var(--accent)]'
                            : 'text-[var(--text-muted)]'
                        )}
                      />

                      <span className="truncate">
                        {venture.name}
                      </span>
                    </button>
                  );
                })}

                {ventures.length === 0 && (
                  <div className="px-3 py-3 text-xs text-[var(--text-muted)]">
                    No ventures yet.
                  </div>
                )}

                <div className="my-1 border-t border-[var(--border)]" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    navigate('/ventures');
                    setShowVentureDropdown(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2',
                    'px-3 py-2 text-left text-sm',
                    'text-[var(--accent)]',
                    'transition-colors',
                    'hover:bg-[var(--accent-muted)]'
                  )}
                >
                  <Plus className="h-4 w-4" />

                  {ventures.length === 0
                    ? 'Create your first venture'
                    : 'View all ventures'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===========================================
            DESKTOP SEARCH
            Hidden entirely on mobile
            =========================================== */}

        <div className="iv-topbar__search hidden min-w-0 flex-1 justify-center md:flex">
          <div className="w-full max-w-md">
            <div className="rounded-lg bg-[var(--border)] p-px">
              <button
                type="button"
                onClick={openSearch}
                className={cn(
                  'group flex w-full items-center gap-2',
                  'rounded-[calc(var(--radius-lg)-1px)]',
                  'bg-[var(--surface-1)]',
                  'px-3 py-1.5',
                  'text-sm text-[var(--text-muted)]',
                  'transition-colors',
                  'hover:text-[var(--text-primary)]'
                )}
              >
                <Search className="h-4 w-4 shrink-0" />

                <span className="truncate">
                  Search or command...
                </span>

                <kbd
                  className={cn(
                    'ml-auto hidden items-center gap-0.5',
                    'rounded border border-[var(--border-subtle)]',
                    'bg-[var(--surface-2)]',
                    'px-1.5 py-0.5',
                    'font-mono text-[10px]',
                    'text-[var(--text-muted)]',
                    'lg:flex'
                  )}
                >
                  <Command className="h-2.5 w-2.5" />
                  K
                </kbd>
              </button>
            </div>
          </div>
        </div>

        {/* ===========================================
            RIGHT ACTIONS
            Notifications + founder avatar
            Visible on desktop and mobile
            =========================================== */}

        <div className="iv-topbar__right ml-auto flex shrink-0 items-center gap-2">

          {/* Notifications */}

          <button
            type="button"
            onClick={toggleNotifications}
            aria-label={
              unreadCount > 0
                ? `Notifications (${unreadCount} unread)`
                : 'Notifications'
            }
            aria-pressed={notificationsOpen}
            className={cn(
              'relative flex h-9 w-9 shrink-0',
              'items-center justify-center',
              'rounded-full transition-colors',
              notificationsOpen
                ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'
            )}
          >
            <Bell className="h-[18px] w-[18px]" />

            {unreadCount > 0 && (
              <span
                className={cn(
                  'absolute -right-0.5 -top-0.5',
                  'flex h-4 min-w-4',
                  'items-center justify-center',
                  'rounded-full px-0.5',
                  'bg-[var(--accent)]',
                  'text-[8px] font-semibold text-white'
                )}
                style={{
                  boxShadow:
                    '0 0 0 3px var(--surface-1)',
                }}
              >
                {unreadCount > 99
                  ? '99+'
                  : unreadCount}
              </span>
            )}

            {unreadCount === 0 && hasAny && (
              <span
                className={cn(
                  'absolute -right-0.5 -top-0.5',
                  'h-2.5 w-2.5 rounded-full',
                  'bg-[var(--info)]'
                )}
                style={{
                  boxShadow:
                    '0 0 0 3px var(--surface-1)',
                }}
              />
            )}
          </button>

          {/* Founder account */}

          <div
            className="relative"
            ref={founderMenuRef}
          >
            <button
              type="button"
              onClick={() =>
                setShowFounderMenu((value) => !value)
              }
              aria-haspopup="menu"
              aria-expanded={showFounderMenu}
              aria-label={`Account menu — ${displayName}`}
              className={cn(
                'flex items-center gap-2',
                'rounded-full p-1',
                'transition-colors',
                showFounderMenu
                  ? 'bg-[var(--accent-muted)]'
                  : 'hover:bg-[var(--surface-2)]'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0',
                  'items-center justify-center',
                  'rounded-full text-white'
                )}
                style={{
                  background:
                    'linear-gradient(135deg, var(--accent), var(--accent-hover))',
                }}
              >
                <span className="text-[11px] font-bold">
                  {ini}
                </span>
              </div>

              <span className="hidden max-w-[120px] truncate text-sm font-medium text-[var(--text-primary)] lg:inline">
                {displayName}
              </span>

              <ChevronDown className="hidden h-3.5 w-3.5 text-[var(--text-muted)] lg:block" />
            </button>

            {showFounderMenu && (
              <div
                role="menu"
                className={cn(
                  'absolute right-0 top-full z-50',
                  'mt-1 w-60 max-w-[calc(100vw-24px)]',
                  'rounded-lg bg-[var(--surface-1)] py-1',
                  'border border-[var(--border-subtle)]',
                  'shadow-[var(--elevation-floating)]'
                )}
              >
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {displayName}
                  </p>

                  {displayEmail && (
                    <p className="truncate text-2xs text-[var(--text-muted)]">
                      {displayEmail}
                    </p>
                  )}
                </div>

                <div className="my-1 border-t border-[var(--border)]" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    navigate('/settings');
                    setShowFounderMenu(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2',
                    'px-3 py-2 text-left text-sm',
                    'text-[var(--text-primary)]',
                    'transition-colors',
                    'hover:bg-[var(--surface-2)]'
                  )}
                >
                  <Settings className="h-4 w-4 text-[var(--text-muted)]" />
                  Settings
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() =>
                    setShowFounderMenu(false)
                  }
                  className={cn(
                    'flex w-full items-center gap-2',
                    'px-3 py-2 text-left text-sm',
                    'text-[var(--text-primary)]',
                    'transition-colors',
                    'hover:bg-[var(--surface-2)]'
                  )}
                >
                  <HelpCircle className="h-4 w-4 text-[var(--text-muted)]" />
                  Help & docs
                </button>

                <div className="my-1 border-t border-[var(--border)]" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  className={cn(
                    'flex w-full items-center gap-2',
                    'px-3 py-2 text-left text-sm',
                    'text-[var(--text-primary)]',
                    'transition-colors',
                    'hover:bg-[var(--surface-2)]'
                  )}
                >
                  <LogOut className="h-4 w-4 text-[var(--text-muted)]" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
