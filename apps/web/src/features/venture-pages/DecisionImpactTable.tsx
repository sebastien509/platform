import { cn } from '@/lib/utils/cn';
import { Check, AlertCircle, X, HelpCircle, Clock } from 'lucide-react';
import type { VentureSection, OutcomeState } from './engine/types';

const IMPACT_META: Record<OutcomeState, { label: string; icon: any; tone: string }> = {
  positive: { label: 'Positive', icon: Check, tone: 'positive' },
  mixed: { label: 'Mixed', icon: AlertCircle, tone: 'mixed' },
  negative: { label: 'Negative', icon: X, tone: 'negative' },
  inconclusive: { label: 'Inconclusive', icon: HelpCircle, tone: 'inconclusive' },
  pending: { label: 'Pending', icon: Clock, tone: 'pending' },
};

export function DecisionImpactTable({
  section,
}: {
  section: Extract<VentureSection, { type: 'decision-impact' }>;
}) {
  return (
    <div className="decision-impact">
      <table className="decision-impact__table">
        <thead>
          <tr>
            <th>Decision</th>
            <th>Expected</th>
            <th>Actual</th>
            <th className="decision-impact__result-col">Result</th>
          </tr>
        </thead>
        <tbody>
          {section.rows.map((row) => {
            const meta = IMPACT_META[row.impact];
            const Icon = meta.icon;
            return (
              <tr key={row.id}>
                <td className="decision-impact__decision">{row.decision}</td>
                <td className="decision-impact__value">{row.expected}</td>
                <td className="decision-impact__value">{row.actual}</td>
                <td className="decision-impact__result-col">
                  <span className={cn('decision-impact__pill', `is-${meta.tone}`)}>
                    <Icon className="h-3 w-3" />
                    {meta.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
