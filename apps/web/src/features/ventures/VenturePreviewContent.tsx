import { Venture } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/status';
import { useAgents } from '@/lib/hooks/useAgents';
import { ArrowRight } from 'lucide-react';

interface VenturePreviewContentProps {
  venture: Venture;
  onOpenFull: () => void;
}

const DIMENSION_LABELS: Array<[keyof Venture['health'], string]> = [
  ['strategy', 'Strategy'],
  ['product', 'Product'],
  ['engineering', 'Engineering'],
  ['gtm', 'GTM'],
  ['marketing', 'Marketing'],
  ['content', 'Content'],
  ['sales', 'Sales'],
  ['growth', 'Growth'],
  ['analytics', 'Analytics'],
  ['knowledge', 'Knowledge'],
  ['outcomes', 'Outcomes'],
];

export function VenturePreviewContent({
  venture,
  onOpenFull,
}: VenturePreviewContentProps) {
  const { data: agentsData } = useAgents();
  const agents = (agentsData?.data || []).filter((a: any) =>
    venture.agentIds?.includes(a.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <StatusBadge status={venture.status} dot />
        <span className="text-sm text-[var(--text-muted)]">
          {agents.length} agent{agents.length === 1 ? '' : 's'} ·{' '}
          {venture.outcomeIds?.length || 0} outcome
          {(venture.outcomeIds?.length || 0) === 1 ? '' : 's'}
        </span>
      </div>

      <section>
        <h4 className="text-sm font-medium text-[var(--text-muted)] mb-2">
          Description
        </h4>
        <p className="text-sm leading-relaxed">{venture.description}</p>
      </section>

      <section>
        <h4 className="text-sm font-medium text-[var(--text-muted)] mb-3">
          Health breakdown
        </h4>
        <div className="space-y-2.5">
          {DIMENSION_LABELS.map(([key, label]) => {
            const value = venture.health?.[key] ?? 0;
            return (
              <div key={String(key)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--text-secondary)]">
                    {label}
                  </span>
                  <span className="text-xs font-medium tabular-nums">
                    {value}%
                  </span>
                </div>
                <Progress value={value} className="h-1" />
              </div>
            );
          })}
        </div>
      </section>

      <Button className="w-full gap-2" onClick={onOpenFull}>
        Open venture
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
