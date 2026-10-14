import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { IdeaStatusBadge } from './IdeaStatusBadge';
import { statusDetail } from './listStatus';
import type { Idea, IdeaJourney, IdeaListStatus } from '@/lib/types';

interface IdeaRowProps {
  idea: Idea;
  journey?: IdeaJourney;
  status: IdeaListStatus;
  onClick: () => void;
}

export function IdeaRow({ idea, journey, status, onClick }: IdeaRowProps) {
  const isKilled = status === 'killed';
  const detail = statusDetail(status, journey);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left',
        'border border-transparent hover:border-[var(--border)]',
        'hover:bg-[var(--surface-2)] transition-colors',
        isKilled && 'opacity-60'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className={cn(
              'text-sm font-medium text-[var(--text-primary)] truncate',
              isKilled && 'line-through'
            )}
          >
            {idea.title || 'Untitled idea'}
          </p>
          {detail && (
            <span className="text-2xs text-[var(--text-muted)] tabular-nums">
              · {detail}
            </span>
          )}
        </div>
        {idea.description && (
          <p className="mt-0.5 text-2xs text-[var(--text-muted)] truncate">
            {idea.description}
          </p>
        )}
      </div>

      <IdeaStatusBadge status={status} />

      <ArrowRight className="h-3 w-3 shrink-0 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
