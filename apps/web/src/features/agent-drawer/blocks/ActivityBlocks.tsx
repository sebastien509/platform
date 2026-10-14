/* ============================================================
   Zone 4 blocks — Activity
   StepBlock + ErrorBlock renderers.
   ============================================================ */

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { StepBlock, ErrorBlock } from '@/lib/types';

/* ---------- Step ---------- */

export function StepBlockView({ block }: { block: StepBlock }) {
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const isRunning = !block.completedAt;

  return (
    <li
      className={cn(
        'agent-step',
        isRunning ? 'agent-step--running' : 'agent-step--done'
      )}
    >
      <span className="agent-step__marker">
        {isRunning ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <CheckCircle2 className="h-3 w-3" />
        )}
      </span>
      <div className="agent-step__body">
        <p className="agent-step__label">{block.label}</p>

        {block.sources && block.sources.length > 0 && (
          <div className="agent-step__sources">
            {block.sources.map((s, i) => (
              <span key={i} className="agent-source-chip">
                {s.label}
              </span>
            ))}
          </div>
        )}

        {block.reasoning && (
          <div className="agent-step__reasoning">
            <button
              type="button"
              className="agent-step__reasoning-toggle"
              onClick={() => setReasoningOpen((v) => !v)}
            >
              {reasoningOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Reasoning
            </button>
            {reasoningOpen && (
              <div className="agent-step__reasoning-body">
                {block.reasoning}
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

/* ---------- Error ---------- */

export function ErrorBlockView({
  block,
  onAction,
}: {
  block: ErrorBlock;
  onAction?: (blockId: string, action: ErrorBlock['actions'][number]) => void;
}) {
  return (
    <li className="agent-step agent-step--failed">
      <span className="agent-step__marker">
        <AlertTriangle className="h-3 w-3" />
      </span>
      <div className="agent-step__body">
        <p className="agent-step__label">{block.message}</p>
        <div className="agent-step__sources">
          {block.actions.map((a) => (
            <button
              key={a}
              type="button"
              className="agent-source-chip"
              onClick={() => onAction?.(block.id, a)}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    </li>
  );
}
