import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Bot,
  Circle,
} from 'lucide-react';
import { ConfidenceSignal, ConfidenceTooltip } from './confidence';
import { CitationStack, Citation } from './citation';
import { AgentKey } from './identity';

interface RecommendationEvidence {
  title: string;
  description: string;
  confidence: number;
}

export interface RecommendationOption {
  id: string;
  label: string;
  description?: string;
  tone?: 'default' | 'destructive';
}

interface AgentRecommendationProps {
  title: string;
  description: string;
  reasoning: string;
  evidence: RecommendationEvidence[];
  status: 'pending' | 'approved' | 'rejected' | 'modified';
  /** Legacy handlers — still work when `options` is not provided. */
  onApprove?: () => void;
  onReject?: () => void;
  onModify?: () => void;
  className?: string;
  compact?: boolean;
  sourceAgent?: string;
  /** Phase 3 additions */
  agent?: AgentKey;
  confidencePct?: number;
  confidenceBasis?: string;
  citations?: Citation[];
  /** NEW — when present, replaces approve/reject with equal-weight options. */
  options?: RecommendationOption[];
  onSelect?: (optionId: string) => void;
}

const STATUS_CONFIG: Record<
  AgentRecommendationProps['status'],
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  pending: {
    label: 'Pending review',
    icon: Circle,
    className: 'bg-[var(--surface-2)] text-[var(--warning)]',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    className: 'bg-[var(--surface-2)] text-[var(--success)]',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-[var(--surface-2)] text-[var(--error)]',
  },
  modified: {
    label: 'Modified',
    icon: AlertTriangle,
    className: 'bg-[var(--surface-2)] text-[var(--info)]',
  },
};

export function AgentRecommendation({
  title,
  description,
  reasoning,
  evidence,
  status,
  onApprove,
  onReject,
  onModify,
  className,
  compact = false,
  sourceAgent = 'Agent',
  agent,
  confidencePct,
  confidenceBasis,
  citations,
  options,
  onSelect,
}: AgentRecommendationProps) {
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const isPending = status === 'pending';
  const usesOptions = !!options && options.length > 0 && !!onSelect;
  const agentColor = agent ? `var(--agent-${agent})` : 'var(--accent)';

  return (
    <div
      className={cn(
        'rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4 transition-all hover:shadow-md',
        status === 'approved' &&
          'border-[color-mix(in_srgb,var(--success)_30%,transparent)]',
        status === 'rejected' &&
          'border-[color-mix(in_srgb,var(--error)_30%,transparent)]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 rounded-lg p-1.5 shrink-0"
          style={{
            background: agent ? `var(--agent-${agent}-muted)` : 'var(--accent-muted)',
          }}
        >
          <Sparkles className="h-4 w-4" style={{ color: agentColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-[var(--text-primary)]">{title}</p>
            <Badge className={cn('gap-1 text-2xs', config.className)}>
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
            {confidencePct !== undefined && (
              <ConfidenceTooltip
                pct={confidencePct}
                basis={confidenceBasis || 'Based on available evidence.'}
              >
                <span className="inline-flex items-center gap-1.5 text-2xs text-[var(--text-muted)]">
                  <ConfidenceSignal
                    pct={confidencePct}
                    agentColor={agentColor}
                  />
                  {confidencePct}%
                </span>
              </ConfidenceTooltip>
            )}
          </div>

          <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p>

          {citations && citations.length > 0 && (
            <div className="mt-2">
              <CitationStack citations={citations} maxVisible={2} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-2xs text-[var(--text-muted)] shrink-0">
          <Bot className="h-3 w-3" />
          {sourceAgent}
        </div>
      </div>

      {/* Reasoning */}
      {!compact && (
        <div className="mt-3 rounded-lg bg-[var(--surface-2)] p-3">
          <p className="text-2xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Reasoning
          </p>
          <p className="mt-1 text-sm text-[var(--text-primary)] leading-relaxed">
            {reasoning}
          </p>
        </div>
      )}

      {/* Evidence */}
      {evidence.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-2xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            {expanded ? 'Hide evidence' : `Show ${evidence.length} evidence items`}
          </button>
          {expanded && (
            <div className="mt-2 space-y-1.5">
              {evidence.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg bg-[var(--surface-2)] p-2 text-sm"
                >
                  <FileText className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
                  <span className="flex-1 truncate">{item.title}</span>
                  <span className="text-2xs text-[var(--text-muted)] truncate">
                    {item.description}
                  </span>
                  <span className="text-2xs font-medium text-[var(--accent)] tabular-nums">
                    {item.confidence}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Decisions — two paths of equal weight when options provided */}
      {isPending && usesOptions && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {options!.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect!(opt.id)}
              className={cn(
                'text-left rounded-lg border p-3 transition-colors',
                'border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]',
                opt.tone === 'destructive' &&
                  'hover:border-[color-mix(in_srgb,var(--error)_40%,transparent)]'
              )}
            >
              <p
                className={cn(
                  'font-medium text-sm',
                  opt.tone === 'destructive'
                    ? 'text-[var(--error)]'
                    : 'text-[var(--text-primary)]'
                )}
              >
                {opt.label}
              </p>
              {opt.description && (
                <p className="mt-1 text-2xs text-[var(--text-secondary)] leading-relaxed">
                  {opt.description}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Legacy decision buttons — only when options were not provided */}
      {isPending && !usesOptions && (onApprove || onReject || onModify) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {onApprove && (
            <Button size="sm" onClick={onApprove} className="gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approve
            </Button>
          )}
          {onModify && (
            <Button size="sm" variant="outline" onClick={onModify} className="gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Modify
            </Button>
          )}
          {onReject && (
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              className="gap-1 text-[var(--error)] hover:text-[var(--error)]"
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
