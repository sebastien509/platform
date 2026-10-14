import { useState, useEffect, useRef } from 'react';

import { useNavigate } from 'react-router-dom';

import { useQueryClient } from '@tanstack/react-query';

import {

  Search, Bell, Command, ChevronDown, Briefcase, Plus,

  Settings, HelpCircle, LogOut,

} from 'lucide-react';

import { cn } from '@/lib/utils/cn';


import { useVentures } from '@/lib/hooks/useVentures';

import { useNotificationStore } from '@/lib/stores/notificationStore';

import { useCurrentUser } from '@/features/auth/useCurrentUser';

import { supabase } from '@/lib/supabase';



const OPEN_COMMAND_BAR_EVENT = 'iv:open-command-bar';



interface TopbarProps {

  currentVentureId?: string;

}



function initials(name: string | null | undefined, email: string): string {

  const base = (name ?? email ?? '').trim();

  if (!base) return '?';

  const parts = base.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();

  return base.slice(0, 2).toUpperCase();

}



export function Topbar({ currentVentureId }: TopbarProps) {

  const navigate = useNavigate();

  const qc = useQueryClient();

  const [showVentureDropdown, setShowVentureDropdown] = useState(false);

  const [showFounderMenu, setShowFounderMenu] = useState(false);

  const founderMenuRef = useRef<HTMLDivElement>(null);

  const { data: me } = useCurrentUser();



  const displayName = me?.profile?.name ?? 'Founder';

  const displayEmail = me?.profile?.email ?? '';

  const ini = initials(me?.profile?.name, displayEmail);



  const notificationsOpen = useNotificationStore((s) => s.sidebarOpen);

  const openNotifications = useNotificationStore((s) => s.openSidebar);

  const closeNotifications = useNotificationStore((s) => s.closeSidebar);



  const unreadCount = useNotificationStore(
    (s) => s.notifications.filter((n) => n.state !== 'read').length,
  );

  const hasAny = useNotificationStore((s) => s.notifications.length > 0);

  const { data: ventures = [] } = useVentures();

  const currentVenture = ventures.find((v) => v.id === currentVentureId);

  const insideVenture = Boolean(currentVenture);



  useEffect(() => {

    if (!showFounderMenu) return;

    const onPointerDown = (e: MouseEvent) => {

      if (founderMenuRef.current && !founderMenuRef.current.contains(e.target as Node)) {

        setShowFounderMenu(false);

      }

    };

    const onKey = (e: KeyboardEvent) => {

      if (e.key === 'Escape') setShowFounderMenu(false);

    };

    document.addEventListener('mousedown', onPointerDown);

    document.addEventListener('keydown', onKey);

    return () => {

      document.removeEventListener('mousedown', onPointerDown);

      document.removeEventListener('keydown', onKey);

    };

  }, [showFounderMenu]);



  const openSearch = () => {

    window.dispatchEvent(new Event(OPEN_COMMAND_BAR_EVENT));

  };



  const toggleNotifications = () => {

    if (notificationsOpen) closeNotifications();

    else openNotifications();

  };



  async function handleSignOut() {

    setShowFounderMenu(false);

    await supabase.auth.signOut();

    qc.clear();

    navigate('/login', { replace: true });

  }



  return (

    <header

      className={cn(

        'relative flex h-14 shrink-0 items-center bg-[var(--surface-1)] px-6 gap-4',

        'border-b border-[var(--border-subtle)]'

      )}

    >

      {/* ---- LEFT ZONE ---- */}

      <div className="flex items-center shrink-0">

        <div className="relative">

          <button

            onClick={() => setShowVentureDropdown(!showVentureDropdown)}

            className={cn(

              'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',

              insideVenture

                ? 'bg-[var(--accent-muted)] text-[var(--accent)]'

                : 'text-[var(--text-muted)] hover:bg-[var(--accent-muted)] hover:text-[var(--accent)]'

            )}

          >

            <Briefcase className="h-4 w-4" />

            <span className="max-w-[180px] truncate">

              {currentVenture ? currentVenture.name : 'Select Venture'}

            </span>

            <ChevronDown className="h-4 w-4" />

          </button>



          {showVentureDropdown && (

            <div className="absolute top-full left-0 mt-1 w-56 rounded-lg bg-[var(--surface-1)] shadow-[var(--elevation-floating)] py-1 z-50">

              {ventures.map((venture) => {

                const isSelected = venture.id === currentVentureId;

                return (

                  <button

                    key={venture.id}

                    onClick={() => {

                      navigate(`/ventures/${venture.id}`);

                      setShowVentureDropdown(false);

                    }}

                    className={cn(

                      'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',

                      isSelected

                        ? 'bg-[var(--accent-muted)] text-[var(--accent)] font-medium'

                        : 'text-[var(--text-primary)] hover:bg-[var(--surface-2)]'

                    )}

                  >

                    <Briefcase

                      className={cn(

                        'h-4 w-4',

                        isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'

                      )}

                    />

                    {venture.name}

                  </button>

                );

              })}

              {ventures.length === 0 && (

                <div className="px-3 py-3 text-xs text-[var(--text-muted)]">

                  No ventures yet.

                </div>

              )}

              <div className="border-t border-[var(--border)] my-1" />

              <button

                onClick={() => {

                  navigate('/ventures');

                  setShowVentureDropdown(false);

                }}

                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent-muted)] transition-colors"

              >

                <Plus className="h-4 w-4" />

                {ventures.length === 0 ? 'Create your first venture' : 'View all ventures'}

              </button>

            </div>

          )}

        </div>

      </div>



      {/* ---- CENTER ZONE ---- */}

      <div className="flex-1 flex justify-center min-w-0">

        <div className="w-full max-w-md">

          <div className="rounded-lg p-px bg-[var(--border)]">

            <button

              type="button"

              onClick={openSearch}

              className="group flex w-full items-center gap-2 rounded-[calc(var(--radius-lg)-1px)] bg-[var(--surface-1)] px-3 py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"

            >

              <Search className="h-4 w-4" />

              <span className="hidden sm:inline">Search or command...</span>

              <span className="sm:hidden">Search...</span>

              <kbd className="ml-auto hidden items-center gap-0.5 rounded border border-[var(--border-subtle)] bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)] sm:flex">

                <Command className="h-2.5 w-2.5" />K

              </kbd>

            </button>

          </div>

        </div>

      </div>



      {/* ---- RIGHT ZONE ---- */}

      <div className="flex items-center gap-1 shrink-0">





        <button

          type="button"

          onClick={toggleNotifications}

          aria-label="Notifications"

          aria-pressed={notificationsOpen}

          className={cn(

            'relative rounded-full p-2 transition-colors',

            notificationsOpen

              ? 'bg-[var(--accent-muted)] text-[var(--accent)]'

              : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'

          )}

        >

          <Bell className="h-4 w-4" />

          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[8px] font-medium text-white"
              style={{ boxShadow: '0 0 0 3px var(--accent-muted)' }}
            >
              {unreadCount}
            </span>
          )}
          {unreadCount === 0 && hasAny && (
            <span
              className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[var(--info)]"
              style={{ boxShadow: '0 0 0 3px var(--info-soft-border)' }}
            />
          )}

        </button>



        <div className="relative" ref={founderMenuRef}>

          <button

            type="button"

            onClick={() => setShowFounderMenu((v) => !v)}

            aria-haspopup="menu"

            aria-expanded={showFounderMenu}

            className={cn(

              'flex items-center gap-2 rounded-full p-1 pl-1 pr-3 transition-colors',

              showFounderMenu ? 'bg-[var(--accent-muted)]' : 'hover:bg-[var(--surface-2)]'

            )}

          >

            <div

              className="flex h-8 w-8 items-center justify-center rounded-full text-white"

              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))' }}

            >

              <span className="text-[11px] font-bold">{ini}</span>

            </div>

            <span className="hidden sm:inline text-sm font-medium text-[var(--text-primary)]">

              {displayName}

            </span>

            <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-[var(--text-muted)]" />

          </button>



          {showFounderMenu && (

            <div

              role="menu"

              className="absolute top-full right-0 mt-1 w-60 rounded-lg bg-[var(--surface-1)] shadow-[var(--elevation-floating)] py-1 z-50"

            >

              <div className="px-3 py-2">

                <p className="text-sm font-medium text-[var(--text-primary)] truncate">

                  {displayName}

                </p>

                {displayEmail && (

                  <p className="text-2xs text-[var(--text-muted)] truncate">

                    {displayEmail}

                  </p>

                )}

              </div>

              <div className="border-t border-[var(--border)] my-1" />

              <button

                role="menuitem"

                onClick={() => {

                  navigate('/settings');

                  setShowFounderMenu(false);

                }}

                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"

              >

                <Settings className="h-4 w-4 text-[var(--text-muted)]" />

                Settings

              </button>

              <button

                role="menuitem"

                onClick={() => setShowFounderMenu(false)}

                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"

              >

                <HelpCircle className="h-4 w-4 text-[var(--text-muted)]" />

                Help & docs

              </button>

              <div className="border-t border-[var(--border)] my-1" />

              <button

                role="menuitem"

                onClick={handleSignOut}

                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"

              >

                <LogOut className="h-4 w-4 text-[var(--text-muted)]" />

                Sign out

              </button>

            </div>

          )}

        </div>

      </div>

    </header>

  );

}
