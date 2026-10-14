/* ============================================================
   Zone 3 blocks — Needs you
   Question, FileRequest, Approval renderers.
   Pinned above the scroll region.
   ============================================================ */

import { useState } from 'react';
import {
  HelpCircle,
  Paperclip,
  CheckCircle2,
  Check,
  ArrowRight,
  Send,
} from 'lucide-react';
import type {
  QuestionBlock,
  FileRequestBlock,
  ApprovalBlock,
} from '@/lib/types';

interface Handlers {
  onAnswer?: (blockId: string, value: string) => void;
  onFileRequest?: (blockId: string) => void;
  onApprove?: (blockId: string) => void;
  onReject?: (blockId: string) => void;
  onOpenDoc?: (href: string) => void;
}

/* ---------- Question ---------- */

export function QuestionBlockView({
  block,
  onAnswer,
}: { block: QuestionBlock } & Handlers) {
  const [text, setText] = useState('');
  const hasOptions = !!block.options && block.options.length > 0;
  // Show the free-text input when the question explicitly allows it
  // OR when there are no options to pick from (agent asked an open
  // question). Both cases need a way for the founder to answer.
  const showFreeText = block.freeText || !hasOptions;

  function submit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAnswer?.(block.id, trimmed);
    setText('');
  }

  return (
    <div className="agent-needs-you__card">
      <div className="agent-needs-you__head">
        <span className="agent-needs-you__icon">
          <HelpCircle className="h-3.5 w-3.5" />
        </span>
        <p className="agent-needs-you__title">Question</p>
      </div>
      <p className="agent-needs-you__prompt">{block.prompt}</p>

      {hasOptions && (
        <div className="agent-needs-you__actions">
          {block.options!.map((o) => (
            <button
              key={o.value}
              type="button"
              className="agent-composer__chip"
              onClick={() => onAnswer?.(block.id, o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {showFreeText && (
        <form
          className="agent-needs-you__input-row"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            type="text"
            className="agent-needs-you__input"
            placeholder={hasOptions ? 'Or answer in your own words…' : 'Type your answer…'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus={!hasOptions}
            autoComplete="off"
          />
          <button
            type="submit"
            className="agent-needs-you__submit"
            disabled={!text.trim()}
            aria-label="Send answer"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      )}
    </div>
  );
}

/* ---------- File request ---------- */

export function FileRequestBlockView({
  block,
  onFileRequest,
}: { block: FileRequestBlock } & Handlers) {
  return (
    <div className="agent-needs-you__card">
      <div className="agent-needs-you__head">
        <span className="agent-needs-you__icon">
          <Paperclip className="h-3.5 w-3.5" />
        </span>
        <p className="agent-needs-you__title">File request</p>
      </div>
      <p className="agent-needs-you__prompt">{block.prompt}</p>
      <div className="agent-needs-you__actions">
        <button
          type="button"
          className="agent-composer__chip"
          onClick={() => onFileRequest?.(block.id)}
        >
          <Paperclip className="h-3 w-3" />
          Attach {block.acceptedKinds.join(' · ')}
        </button>
      </div>
    </div>
  );
}

/* ---------- Approval ---------- */

export function ApprovalBlockView({
  block,
  onApprove,
  onReject,
  onOpenDoc,
}: { block: ApprovalBlock } & Handlers) {
  return (
    <div className="agent-needs-you__card">
      <div className="agent-needs-you__head">
        <span className="agent-needs-you__icon">
          <CheckCircle2 className="h-3.5 w-3.5" />
        </span>
        <p className="agent-needs-you__title">Approval</p>
      </div>
      <p className="agent-needs-you__prompt">{block.prompt}</p>
      <div className="agent-needs-you__actions">
        {block.editHref && (
          <button
            type="button"
            className="agent-composer__chip"
            onClick={() => onOpenDoc?.(block.editHref!)}
          >
            <ArrowRight className="h-3 w-3" />
            Review
          </button>
        )}
        <button
          type="button"
          className="agent-composer__chip"
          onClick={() => onApprove?.(block.id)}
        >
          <Check className="h-3 w-3" />
          {block.approveLabel ?? 'Approve'}
        </button>
        <button
          type="button"
          className="agent-composer__chip"
          onClick={() => onReject?.(block.id)}
        >
          {block.rejectLabel ?? 'Reject'}
        </button>
      </div>
    </div>
  );
}
