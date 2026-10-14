import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { DecisionCard } from './DecisionCard';

export interface Decision {
  id: string;
  title: string;
  description: string;
  type: 'approval' | 'review' | 'choice' | 'investigation';
  priority: 'high' | 'medium' | 'low';
  source: string;
  sourceType: 'agent' | 'system' | 'founder';
  createdAt: string;
  options?: Array<{ label: string; value: string; primary?: boolean; destructive?: boolean }>;
  onAction?: (value: string) => void;
}

interface DecisionListProps {
  decisions: Decision[];
  className?: string;
  emptyMessage?: string;
  maxItems?: number;
}

export function DecisionList({
  decisions,
  className,
  emptyMessage = 'No decisions needed right now.',
  maxItems,
}: DecisionListProps) {
  const displayDecisions = maxItems ? decisions.slice(0, maxItems) : decisions;

  if (displayDecisions.length === 0) {
    return (
      <div className={cn('decision-list-empty', className)}>
        <span className="decision-list-empty__icon">
          <CheckCircle2 className="h-4 w-4" />
        </span>
        <p className="decision-list-empty__text">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {displayDecisions.map((decision) => (
        <DecisionCard
          key={decision.id}
          decision={decision}
          onResolve={(value) => decision.onAction?.(value)}
        />
      ))}
    </div>
  );
}
