import { PlanStep, PlanStepData } from './PlanStep';
import { cn } from '@/lib/utils/cn';

interface PlanStepListProps {
  steps: PlanStepData[];
  editable?: boolean;
  maxVisible?: number;
  onChange?: (steps: PlanStepData[]) => void;
  className?: string;
}

const DEFAULT_MAX_VISIBLE = 6;

export function PlanStepList({
  steps,
  editable = true,
  maxVisible = DEFAULT_MAX_VISIBLE,
  onChange,
  className,
}: PlanStepListProps) {
  const scrollable = steps.length > maxVisible;

  const handleEdit = (id: string, label: string) => {
    onChange?.(steps.map((s) => (s.id === id ? { ...s, label } : s)));
  };
  const handleDelete = (id: string) => {
    onChange?.(steps.filter((s) => s.id !== id));
  };
  const handleMove = (id: string, dir: 'up' | 'down') => {
    const i = steps.findIndex((s) => s.id === id);
    if (i < 0) return;
    const target = dir === 'up' ? i - 1 : i + 1;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[i], next[target]] = [next[target], next[i]];
    onChange?.(next);
  };

  return (
    <div
      className={cn('plan-step-list', scrollable && 'is-scrollable', className)}
      style={
        scrollable
          ? { maxHeight: `${maxVisible * 40}px`, overflowY: 'auto' }
          : undefined
      }
    >
      {steps.map((step, i) => (
        <PlanStep
          key={step.id}
          step={step}
          editable={editable}
          isFirst={i === 0}
          isLast={i === steps.length - 1}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onMove={handleMove}
        />
      ))}
    </div>
  );
}
