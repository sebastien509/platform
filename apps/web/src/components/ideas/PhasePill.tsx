import { Phase } from '@/lib/types';
import { PHASE_LABELS, PHASE_COLORS, PHASE_ICONS } from '@/lib/utils/phaseHelpers';
import { cn } from '@/lib/utils/cn';

interface PhasePillProps {
  phase: Phase;
  className?: string;
}

export function PhasePill({ phase, className }: PhasePillProps) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 text-xs font-medium',
        PHASE_COLORS[phase],
        className
      )}
    >
      {PHASE_ICONS[phase]} {PHASE_LABELS[phase]}
    </span>
  );
}
