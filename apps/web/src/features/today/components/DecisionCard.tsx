import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Bot, User, Layers } from 'lucide-react';
import type { TodayDecision } from '../hooks/useToday';

interface DecisionCardProps { decision: TodayDecision; onResolve: (value: string) => void; onSkip?: () => void; }
const PRIORITY_STYLES: Record<TodayDecision['priority'], string> = {
  high: 'bg-[var(--error-muted)] text-[var(--error)]',
  medium: 'bg-[var(--warning-muted)] text-[var(--warning)]',
  low: 'bg-[var(--surface-2)] text-[var(--text-secondary)]',
};
const TYPE_LABELS: Record<TodayDecision['type'], string> = { approval: 'Approval', review: 'Review', choice: 'Choice', investigation: 'Investigate' };
const SOURCE_ICON: Record<TodayDecision['sourceType'], typeof Bot> = { agent: Bot, system: Layers, founder: User };

export function DecisionCard({ decision, onResolve, onSkip }: DecisionCardProps) {
  const SourceIcon = SOURCE_ICON[decision.sourceType];
  return <div className="space-y-5">
    <div className="flex items-center gap-2 flex-wrap">
      <Badge className={cn('text-2xs capitalize', PRIORITY_STYLES[decision.priority])}>{decision.priority === 'high' && <AlertTriangle className="h-2.5 w-2.5 mr-1"/>}{decision.priority}</Badge>
      <Badge className="text-2xs bg-[var(--surface-2)] text-[var(--text-secondary)]">{TYPE_LABELS[decision.type]}</Badge>
      <span className="inline-flex items-center gap-1 text-2xs text-[var(--text-secondary)]"><SourceIcon className="h-3 w-3"/>{decision.source}</span>
      <span className="ml-auto text-2xs text-[var(--text-secondary)]">{decision.createdAt}</span>
    </div>
    <div><h3 className="text-lg font-semibold text-[var(--text-primary)] leading-snug">{decision.title}</h3>{decision.description && <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">{decision.description}</p>}</div>
    {decision.options && decision.options.length > 0 ? <div className={cn('grid gap-2', decision.options.length === 2 && 'sm:grid-cols-2', decision.options.length === 3 && 'sm:grid-cols-3')}>
      {decision.options.map(option => <Button key={option.value} onClick={() => onResolve(option.value)} variant={option.primary ? 'default' : 'outline'} className={cn('h-auto py-3 justify-start text-left', option.destructive && 'text-[var(--error)] hover:text-[var(--error)]')}><span className="font-medium text-sm">{option.label}</span></Button>)}
    </div> : <p className="text-xs text-[var(--text-secondary)]">This update is informational. Open the originating workflow to review it.</p>}
    {onSkip && <button type="button" onClick={onSkip} className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Skip for now</button>}
  </div>;
}
