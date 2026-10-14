import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Bot,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  Sparkles,
} from 'lucide-react';
import {
  AgentIdentity,
  AgentKey,
  AgentState,
} from './identity';
import { ConfidenceSignal, ConfidenceTooltip } from './confidence';
import { CitationStack, Citation } from './citation';
import { PlanStepList, PlanStepData, PlanApproval } from './plan';
import { ToolCallBlock, ToolCallStatus } from './toolcall';
import { AgentFailureState } from './failure';
import { LongRunningWorkspace } from './longrunning';
import { TraceButton } from '@/features/trace';

export type AgentStatus =
  | 'idle'
  | 'working'
  | 'blocked'
  | 'needs_founder'
  | 'complete'
  | 'error';

/**
 * @deprecated Use 'needs_founder' — kept so existing call sites
 * that pass 'waiting' don't need to change immediately.
 */
export type AgentStatusLegacy = AgentStatus | 'waiting';

export interface AgentAction {
  label: string;
  primary?: boolean;
  destructive?: boolean;
  onClick: () => void;
}

export interface EmbeddedToolCall {
  id: string;
  name: string;
  status: ToolCallStatus;
  duration?: number;
  input?: unknown;
  output?: unknown;
}

interface EmbeddedAgentProps {
  id: string;
  name: string;
  role: string;
  status: AgentStatusLegacy;
  currentTask?: string;
  progress?: number;
  finding?: string;
  recommendation?: string;
  /** 0–100. Required by the master spec for every agent finding. */
  confidence?: number;
  evidence?: string[];
  actions?: AgentAction[];
  /** NEW — two equal-weight paths. When provided, replaces actions. */
  options?: Array<{ id: string; label: string; description?: string; tone?: 'default' | 'destructive' }>;
  onSelect?: (optionId: string) => void;
  className?: string;
  compact?: boolean;
  onViewDetails?: () => void;

  /* ---- Phase 3 trust additions (all optional) ---- */
  agent?: AgentKey;
  confidenceBasis?: string;
  citations?: Citation[];
  plan?: PlanStepData[];
  planApproved?: boolean;
  onPlanChange?: (steps: PlanStepData[]) => void;
  onPlanApprove?: () => void;
  onPlanStop?: () => void;
  toolCalls?: EmbeddedToolCall[];
  failure?: {
    reason: string;
    attempts: number;
    lastAttemptAt: string;
    onRetry?: () => void;
    onEscalate?: () => void;
    onIgnore?: () => void;
    onViewTrace?: () => void;
  };
  longRunning?: {
    day: number;
    totalDays: number;
    milestones: Array<{
      id: string;
      label: string;
      status: 'pending' | 'active' | 'complete';
      detail?: string;
    }>;
    entries: Array<{
      id: string;
      timestamp: string;
      message: string;
      tone?: 'default' | 'success' | 'warning' | 'error';
    }>;
  };
}

const statusLabels: Record<AgentStatus, string> = {
  idle: 'Idle',
  working: 'Working',
  blocked: 'Blocked',
  needs_founder: 'Needs founder',
  complete: 'Complete',
  error: 'Failed',
};

const statusColors: Record<AgentStatus, string> = {
  idle: 'text-[var(--text-muted)]',
  working: 'text-[var(--info)]',
  blocked: 'text-[var(--error)]',
  needs_founder: 'text-[var(--warning)]',
  complete: 'text-[var(--success)]',
  error: 'text-[var(--error)]',
};

const statusIcons: Record<AgentStatus, React.ReactNode> = {
  idle: <Clock className="h-3.5 w-3.5" />,
  working: (
    <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
  ),
  blocked: <XCircle className="h-3.5 w-3.5" />,
  needs_founder: <Clock className="h-3.5 w-3.5" />,
  complete: <CheckCircle2 className="h-3.5 w-3.5" />,
  error: <XCircle className="h-3.5 w-3.5" />,
};

/** Normalize legacy 'waiting' to 'needs_founder'. */
function normalizeStatus(status: AgentStatusLegacy): AgentStatus {
  if (status === 'waiting') return 'needs_founder';
  return status;
}

/** Map EmbeddedAgent status to the canonical 7-state AgentState. */
function toAgentState(status: AgentStatus): AgentState {
  if (status === 'error') return 'failed';
  return status;
}

export function EmbeddedAgent({
  id,
  name,
  role,
  status,
  currentTask,
  progress = 0,
  finding,
  recommendation,
  confidence,
  evidence = [],
  actions = [],
  options,
  onSelect,
  className,
  compact = false,
  onViewDetails,
  agent,
  confidenceBasis,
  citations,
  plan,
  planApproved,
  onPlanChange,
  onPlanApprove,
  onPlanStop,
  toolCalls,
  failure,
  longRunning,
}: EmbeddedAgentProps) {
  const [expanded, setExpanded] = useState(false);

  const normalized = normalizeStatus(status);
  const agentState = toAgentState(normalized);
  const isActive =
    normalized === 'working' || normalized === 'needs_founder';
  const hasFinding = !!finding || !!recommendation;
  const hasActions = actions.length > 0;
  const agentColor = agent ? `var(--agent-${agent})` : 'var(--accent)';

  /* ---- Failure takes precedence — replaces the whole card ---- */
  if (normalized === 'error' && failure) {
    return (
      <AgentFailureState
        agent={agent || 'engineering'}
        agentName={name}
        reason={failure.reason}
        attempts={failure.attempts}
        lastAttemptAt={failure.lastAttemptAt}
        citations={citations}
        onRetry={failure.onRetry}
        onEscalate={failure.onEscalate}
        onIgnore={failure.onIgnore}
        onViewTrace={failure.onViewTrace}
        className={className}
      />
    );
  }

  /* ---- Long-running takes over the finding + confidence format ---- */
  if (longRunning && normalized === 'working') {
    return (
      <div
        className={cn(
          'rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4',
          className
        )}
      >
        {agent ? (
          <AgentIdentity agent={agent} state="working" />
        ) : (
          <p className="font-medium text-sm">{name}</p>
        )}
        {currentTask && (
          <p className="mt-2 text-sm text-[var(--text-muted)]">{currentTask}</p>
        )}
        <div className="mt-3">
          <LongRunningWorkspace
            day={longRunning.day}
            totalDays={longRunning.totalDays}
            milestones={longRunning.milestones}
            entries={longRunning.entries}
          />
        </div>
      </div>
    );
  }

  /* ---- Standard card ---- */
  return (
    <div
      className={cn(
        'rounded-lg border border-[var(--border)] bg-[var(--surface-1)] transition-all',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center gap-3 p-3',
          hasFinding && 'cursor-pointer hover:bg-[var(--surface-2)] transition-colors'
        )}
        onClick={() => hasFinding && setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          {agent ? (
            <AgentIdentity
              agent={agent}
              state={agentState}
              size="sm"
              rightSlot={
                isActive && progress > 0 ? (
                  <span className="text-2xs text-[var(--text-muted)] tabular-nums">
                    {Math.round(progress)}%
                  </span>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[var(--accent)]">
                    <Bot className="h-4 w-4" />
                  </div>
                </div>
                <p className="font-medium text-sm">{name}</p>
                <span className="text-xs text-[var(--text-muted)]">
                  · {role}
                </span>
                <span
                  className={cn(
                    'flex items-center gap-1 text-2xs font-medium',
                    statusColors[normalized]
                  )}
                >
                  {statusIcons[normalized]}
                  {statusLabels[normalized]}
                </span>
              </div>
            </>
          )}
          {currentTask && (
            <p className="text-sm text-[var(--text-muted)] truncate mt-0.5">
              {currentTask}
            </p>
          )}
        </div>

        {isActive && progress > 0 && !agent && (
          <div className="w-20 hidden sm:block">
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {hasFinding && (
          <div className="shrink-0">
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
            )}
          </div>
        )}
      </div>

      {expanded && hasFinding && (
        <div className="border-t border-[var(--border)] px-4 pb-4 pt-3 space-y-4">
          {/* Finding — with confidence indicator when provided */}
          {finding && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-2xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Finding
                </p>
                {confidence !== undefined && (
                  <ConfidenceTooltip
                    pct={confidence}
                    basis={confidenceBasis || 'Based on available evidence.'}
                    sources={citations?.map((c) => ({
                      id: c.id,
                      label: c.label,
                      onClick: c.onClick || (() => {}),
                    }))}
                  >
                    <span className="inline-flex items-center gap-1 text-2xs text-[var(--text-muted)]">
                      <ConfidenceSignal
                        pct={confidence}
                        agentColor={agentColor}
                      />
                      {confidence}%
                    </span>
                  </ConfidenceTooltip>
                )}
                <TraceButton id={id} kind="agent_finding" />
              </div>
              <p className="text-sm">{finding}</p>
              {citations && citations.length > 0 && (
                <div className="mt-2">
                  <CitationStack citations={citations} maxVisible={2} />
                </div>
              )}
            </div>
          )}

          {recommendation && (
            <div className="rounded-lg border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] bg-[var(--accent-muted)] p-3">
              <p className="text-2xs font-medium text-[var(--accent)] uppercase tracking-wider">
                Recommendation
              </p>
              <p className="mt-1 text-sm">{recommendation}</p>
            </div>
          )}

          {evidence.length > 0 && (
            <div>
              <p className="text-2xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                Evidence
              </p>
              <ul className="space-y-1">
                {evidence.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-[var(--text-muted)]"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Options — two equal-weight paths, when provided */}
          {options && options.length > 0 && onSelect && (
            <div>
              <p className="text-2xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Next step
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(option.id);
                    }}
                    className={cn(
                      'text-left rounded-lg border p-3 transition-colors',
                      'border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]',
                      option.tone === 'destructive' &&
                        'hover:border-[color-mix(in_srgb,var(--error)_40%,transparent)]'
                    )}
                  >
                    <p
                      className={cn(
                        'font-medium text-sm',
                        option.tone === 'destructive'
                          ? 'text-[var(--error)]'
                          : 'text-[var(--text-primary)]'
                      )}
                    >
                      {option.label}
                    </p>
                    {option.description && (
                      <p className="mt-1 text-2xs text-[var(--text-secondary)] leading-relaxed">
                        {option.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Plan-and-Execute — shown when plan is provided */}
          {plan && plan.length > 0 && (
            <div>
              <p className="text-2xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Plan
              </p>
              <PlanStepList
                steps={plan}
                editable={!planApproved}
                onChange={onPlanChange}
              />
              <PlanApproval
                approved={planApproved}
                onApprove={onPlanApprove}
                onStop={onPlanStop}
              />
            </div>
          )}

          {/* Tool calls — rendered inline when provided */}
          {toolCalls && toolCalls.length > 0 && (
            <div className="space-y-2">
              <p className="text-2xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Tools used
              </p>
              {toolCalls.map((tc) => (
                <ToolCallBlock
                  key={tc.id}
                  name={tc.name}
                  status={tc.status}
                  duration={tc.duration}
                  input={tc.input}
                  output={tc.output}
                />
              ))}
            </div>
          )}

          {hasActions && (
            <div className="flex flex-wrap gap-2 pt-2">
              {actions.map((action, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant={
                    action.primary
                      ? 'default'
                      : action.destructive
                      ? 'destructive'
                      : 'outline'
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                  }}
                  className="gap-1"
                >
                  {action.primary && <Sparkles className="h-3 w-3" />}
                  {action.label}
                </Button>
              ))}
              {onViewDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails();
                  }}
                  className="gap-1"
                >
                  <Eye className="h-3 w-3" />
                  View Details
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {compact && (
        <div className="flex items-center gap-2 px-3 pb-3">
          <span
            className={cn(
              'flex items-center gap-1 text-xs',
              statusColors[normalized]
            )}
          >
            {statusIcons[normalized]}
            {statusLabels[normalized]}
          </span>
          {currentTask && (
            <span className="text-xs text-[var(--text-muted)]">
              · {currentTask}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
