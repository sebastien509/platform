import { useState } from 'react';
import { Check, X, Edit3} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CitationStack } from '@/components/agents/citation';
import type { StructuredIdeaField } from '@/lib/types';

interface FieldCollapseProps {
  field: StructuredIdeaField;
  /** True while this field is the current one being confirmed. */
  isCurrent: boolean;
  onConfirm: (fieldId: string, value: string) => void;
  onReject: (fieldId: string) => void;
  onEdit?: (fieldId: string, value: string) => void;
}

export function FieldCollapse({
  field,
  isCurrent,
  onConfirm,
  onReject,
  onEdit,
}: FieldCollapseProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(field.value);

  const isConfirmed = field.status === 'confirmed';
  const isRejected = field.status === 'rejected';
  const isPending = field.status === 'proposed';

  /* ---- Confirmed/rejected — one-line collapsed view ---- */
  if (!isCurrent && (isConfirmed || isRejected)) {
    return (
      <div
        className={cn(
          'flex items-start gap-2.5 rounded-md px-3 py-2',
          isConfirmed && 'bg-[var(--surface-2)]',
          isRejected && 'bg-[var(--surface-2)] opacity-60'
        )}
      >
        <span className="mt-0.5 shrink-0">
          {isConfirmed ? (
            <Check className="h-3.5 w-3.5 text-[var(--success)]" />
          ) : (
            <X className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          )}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            {field.label}
          </p>
          <p
            className={cn(
              'mt-0.5 text-sm text-[var(--text-primary)]',
              isRejected && 'line-through'
            )}
          >
            {field.value}
          </p>
        </div>
      </div>
    );
  }

  /* ---- Pending (current) — full editable view ---- */
  return (
    <div
      className={cn(
        'rounded-md border p-3',
        isCurrent
          ? 'border-[var(--accent)]/30 bg-[var(--surface-1)]'
          : 'border-[var(--border-subtle)] bg-[var(--surface-1)]'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            {field.label}
          </span>
          {isPending && !editing && (
            <span className="rounded-full bg-[var(--accent-muted)] px-1.5 py-0.5 text-2xs font-medium text-[var(--accent)]">
              Proposed
            </span>
          )}
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-2xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Edit3 className="h-3 w-3" />
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="resize-none"
            autoFocus
          />
          <div className="mt-2 flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                onConfirm(field.id, draft.trim());
                setEditing(false);
                onEdit?.(field.id, draft.trim());
              }}
            >
              Confirm
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(field.value);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-[var(--text-primary)] leading-relaxed">
            {field.value}
          </p>

          {field.rationale && (
            <p className="mt-2 text-2xs text-[var(--text-secondary)] leading-relaxed">
              {field.rationale}
            </p>
          )}

          {field.citations && field.citations.length > 0 && (
            <div className="mt-2">
              <CitationStack
                citations={field.citations.map((id) => ({
                  id,
                  label: id,
                }))}
                maxVisible={2}
              />
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => onConfirm(field.id, field.value)}
              className="gap-1"
            >
              <Check className="h-3.5 w-3.5" />
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(field.id)}
              className="gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
