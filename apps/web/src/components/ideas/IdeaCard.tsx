import { useNavigate } from 'react-router-dom';
import { Idea } from '@/lib/types';
import { PhasePill } from './PhasePill';
import { formatDate, truncate } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { Progress } from '@/components/ui/progress';

interface IdeaCardProps {
  idea: Idea;
  className?: string;
}

export function IdeaCard({ idea, className }: IdeaCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/ideas/${idea.id}`)}
      className={cn(
        'block rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{idea.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {truncate(idea.description, 120)}
          </p>
        </div>
        <PhasePill phase={idea.phase} className="ml-2 flex-shrink-0" />
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span>Status: <span className="capitalize">{idea.status}</span></span>
        <span>•</span>
        <span>Updated {formatDate(idea.updatedAt)}</span>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{idea.progress}%</span>
        </div>
        <Progress value={idea.progress} className="h-1.5 mt-1" />
      </div>
    </div>
  );
}
