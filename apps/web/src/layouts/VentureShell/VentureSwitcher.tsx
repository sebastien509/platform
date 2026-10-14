import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVentures } from '@/lib/hooks/useVentures';
import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import { ChevronDown, Briefcase, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface VentureSwitcherProps {
  currentVentureId?: string;
}

export function VentureSwitcher({ currentVentureId }: VentureSwitcherProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: ventures = [] } = useVentures();

  /* Close the agent drawer when the founder switches ventures —
     its runs belong to the previous venture and shouldn't persist
     visually into the new one. */
  const closeDrawer = useAgentDrawerStore((s) => s.closeDrawer);

  const currentVenture = ventures.find((v: any) => v.id === currentVentureId);

  function goToVenture(id: string) {
    if (id !== currentVentureId) closeDrawer();
    navigate(`/ventures/${id}`);
    setOpen(false);
  }

  function goToAll() {
    closeDrawer();
    navigate('/ventures');
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
          'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'
        )}
      >
        <Briefcase className="h-4 w-4" />
        {currentVenture ? currentVenture.name : 'Select Venture'}
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--elevation-floating)] py-1 z-50">
          {ventures.map((venture: any) => {
            const isSelected = venture.id === currentVentureId;
            return (
              <button
                key={venture.id}
                type="button"
                onClick={() => goToVenture(venture.id)}
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
                    isSelected
                      ? 'text-[var(--accent)]'
                      : 'text-[var(--text-muted)]'
                  )}
                />
                {venture.name}
              </button>
            );
          })}
          <div className="border-t border-[var(--border)] my-1" />
          <button
            type="button"
            onClick={goToAll}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent-muted)] transition-colors"
          >
            <Plus className="h-4 w-4" />
            View all ventures
          </button>
        </div>
      )}
    </div>
  );
}
