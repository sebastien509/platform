import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { FunctionProgress } from '@/lib/hooks/useVentureProgress';

interface JourneyRailProps {
  functions: FunctionProgress[];
  suggestedNext?: FunctionProgress;
  className?: string;
}

interface RailItem {
  key: string;
  label: string;
  status: string;
  path: string;
}

const STAGE_GROUPS: Array<{ header: string; keys: string[] }> = [
  { header: 'Build', keys: ['strategy', 'product', 'engineering'] },
  { header: 'Launch', keys: ['gtm', 'campaigns', 'sales'] },
  { header: 'Grow', keys: ['growth'] },
  { header: 'System', keys: ['knowledge', 'analytics', 'outcomes', 'connectors'] },
];

/**
 * JourneyRail — the stage progress rail.
 *
 * Visual:
 *   · Empty dot by default
 *   · Filled dot when the item is active (current route)
 *   · No per-state icons — status shows through the active state
 *
 * Groups: Build · Launch · Grow · System
 */
export function JourneyRail({
  functions,
  suggestedNext,
  className,
}: JourneyRailProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { ventureId } = useParams<{ ventureId: string }>();

  /* Build the item list from functions + a Connectors pseudo-item. */
  const items: RailItem[] = [
    ...functions.map((f) => ({
      key: f.key as string,
      label: f.label,
      status: f.status as string,
      path: f.path,
    })),
  ];

  if (ventureId) {
    items.push({
      key: 'connectors',
      label: 'Connectors',
      status: 'not_started',
      path: `/ventures/${ventureId}/connectors`,
    });
  }

  const itemMap = new Map(items.map((i) => [i.key, i]));

  /* Hide entirely on the Overview page — no stage context there. */
  const isOnOverview = /^\/ventures\/[^/]+\/?$/.test(location.pathname);
  if (isOnOverview) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-3 overflow-x-auto',
        'px-6 py-2',
        'border-t border-[var(--border-subtle)] bg-[var(--surface-1)]',
        'scrollbar-none',
        className
      )}
      style={{ scrollbarWidth: 'none' }}
    >
      <div className="flex items-center gap-4 shrink-0">
        {STAGE_GROUPS.map((stage, i) => (
          <div key={stage.header} className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {stage.header}
              </span>
              <div className="flex items-center gap-1">
                {stage.keys.map((key) => {
                  const item = itemMap.get(key);
                  if (!item) return null;
                  const isActive = location.pathname.endsWith(`/${key}`);

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => navigate(item.path)}
                      title={item.label}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-2xs font-medium transition-colors whitespace-nowrap',
                        isActive
                          ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-2 w-2 rounded-full border transition-colors',
                          isActive
                            ? 'bg-[var(--accent)] border-[var(--accent)]'
                            : 'bg-transparent border-[var(--border-strong,var(--border))]'
                        )}
                      />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {i < STAGE_GROUPS.length - 1 && (
              <span className="h-px w-4 bg-[var(--border)] shrink-0" />
            )}
          </div>
        ))}
      </div>

      {suggestedNext && (
        <div className="ml-auto shrink-0">
          <button
            type="button"
            onClick={() => navigate(suggestedNext.path)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
              'bg-[var(--accent-muted)] text-[var(--accent)]',
              'text-2xs font-medium hover:bg-[var(--accent-muted)]/80 transition-colors'
            )}
          >
            <span>Next: {suggestedNext.label}</span>
            <ArrowRight className="h-2.5 w-2.5" />
          </button>
        </div>
      )}
    </div>
  );
}
