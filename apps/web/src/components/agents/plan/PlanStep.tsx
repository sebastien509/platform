import { cn } from '@/lib/utils/cn';
import { GripVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';

export type PlanStepStatus = 'pending' | 'active' | 'complete' | 'failed';

export interface PlanStepData {
  id: string;
  label: string;
  status: PlanStepStatus;
}

interface PlanStepProps {
  step: PlanStepData;
  editable?: boolean;
  onEdit?: (id: string, label: string) => void;
  onDelete?: (id: string) => void;
  onMove?: (id: string, direction: 'up' | 'down') => void;
  isFirst?: boolean;
  isLast?: boolean;
  className?: string;
}

const STATE_GLYPH: Record<PlanStepStatus, string> = {
  pending: '○',
  active: '●',
  complete: '✓',
  failed: '✕',
};

const STATE_CLASS: Record<PlanStepStatus, string> = {
  pending: 'text-[var(--text-muted)]',
  active: 'text-[var(--info)]',
  complete: 'text-[var(--success)]',
  failed: 'text-[var(--error)]',
};

export function PlanStep({
  step,
  editable = true,
  onEdit,
  onDelete,
  onMove,
  isFirst,
  isLast,
  className,
}: PlanStepProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(step.label);

  function commit() {
    setEditing(false);
    if (draft.trim() && draft !== step.label) onEdit?.(step.id, draft.trim());
    else setDraft(step.label);
  }

  return (
    <div className={cn('plan-step', className)}>
      {editable && (
        <span className="plan-step__grip" aria-hidden="true">
          <GripVertical className="h-3.5 w-3.5" />
        </span>
      )}
      <span className={cn('plan-step__glyph', STATE_CLASS[step.status])}>
        {STATE_GLYPH[step.status]}
      </span>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(step.label);
              setEditing(false);
            }
          }}
          className="plan-step__input"
        />
      ) : (
        <button
          type="button"
          className="plan-step__label"
          onClick={() => editable && setEditing(true)}
        >
          {step.label}
        </button>
      )}
      {editable && (
        <div className="plan-step__actions">
          <button
            type="button"
            className="plan-step__action"
            aria-label="Move up"
            disabled={isFirst}
            onClick={() => onMove?.(step.id, 'up')}
          >
            ↑
          </button>
          <button
            type="button"
            className="plan-step__action"
            aria-label="Move down"
            disabled={isLast}
            onClick={() => onMove?.(step.id, 'down')}
          >
            ↓
          </button>
          <button
            type="button"
            className="plan-step__action plan-step__action--destructive"
            aria-label="Delete step"
            onClick={() => onDelete?.(step.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
