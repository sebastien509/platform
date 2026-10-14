import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { ChevronUp, ChevronDown, Activity } from 'lucide-react';
import { useAgents } from '@/lib/hooks/useAgents';
import { UI } from '@/lib/stores/uiStore';
import { cn } from '@/lib/utils/cn';
import { AgentMonitorRow } from './AgentMonitorRow';
import { AgentStepList, type AgentRunStep } from '@/components/agents/AgentStepList';
import { agentRunSteps } from '@/data/mockData';
import type { AgentKey } from '@/components/agents/identity';

const VENTURE_ROUTE_RE = /^\/ventures\/([^/]+)/;

interface MonitoringAgent {
  id: string;
  key: AgentKey;
  name: string;
  currentTask: string;
  elapsedSeconds: number;
}

/* Map role strings to AgentKey (same helper used elsewhere — kept local to avoid cross-import). */
function toAgentKey(role: string): AgentKey {
  const r = role.toLowerCase();
  if (r.includes('research')) return 'research';
  if (r.includes('strategy')) return 'strategy';
  if (r.includes('product')) return 'product';
  if (r.includes('engineer')) return 'engineering';
  if (r.includes('gtm')) return 'gtm';
  if (r.includes('campaign') || r.includes('content') || r.includes('copy')) return 'campaign';
  if (r.includes('sales')) return 'sales';
  if (r.includes('growth')) return 'growth';
  if (r.includes('analyst') || r.includes('analysis')) return 'analysis';
  if (r.includes('knowledge')) return 'knowledge';
  if (r.includes('outcome')) return 'outcomes';
  return 'research';
}

export function AgentMonitoringStrip() {
  const location = useLocation();
  const params = useParams<{ ventureId?: string }>();
  const { data: agentsData } = useAgents();
  const [expanded, setExpanded] = useState(false);
  const [rotatingIndex, setRotatingIndex] = useState(0);
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);

  const ventureMatch = location.pathname.match(VENTURE_ROUTE_RE);
  const currentVentureId = params.ventureId || ventureMatch?.[1];

  /* Filter to working agents. Context-aware: venture-scoped when inside one. */
  const workingAgents: MonitoringAgent[] = useMemo(() => {
    const all = agentsData?.data ?? [];
    const filtered = all
      .filter((a: any) => a.status === 'working' || a.status === 'needs_founder')
      .filter((a: any) => {
        if (!currentVentureId) return true;
        return a.currentVentureId === currentVentureId || !a.currentVentureId;
      });
    return filtered.map((a: any, i: number) => ({
      id: a.id,
      key: toAgentKey(a.role),
      name: a.name,
      currentTask: a.currentTask || 'Working',
      elapsedSeconds: 60 + i * 137,
    }));
  }, [agentsData, currentVentureId]);

  /* Rotation — only while collapsed and there are more agents than visible slots. */
  useEffect(() => {
    if (expanded) return;
    if (workingAgents.length <= UI.MONITORING_VISIBLE_AGENTS) return;
    const t = setInterval(() => {
      setRotatingIndex(
        (i) => (i + UI.MONITORING_VISIBLE_AGENTS) % workingAgents.length
      );
    }, UI.MONITORING_ROTATE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [expanded, workingAgents.length]);

  /* Hidden entirely if no agents working. */
  if (workingAgents.length === 0) return null;

  /* Collapsed: rotated slice of N agents. Expanded: all agents. */
  const visible = expanded
    ? workingAgents
    : Array.from({ length: UI.MONITORING_VISIBLE_AGENTS }).map((_, i) => {
        const idx = (rotatingIndex + i) % workingAgents.length;
        return workingAgents[idx];
      }).filter(Boolean);

  const stepsFor = (agentId: string): AgentRunStep[] =>
    (agentRunSteps as unknown as Record<string, AgentRunStep[]>)[agentId] ?? [];

  return (
    <div
      style={{
        height: expanded
          ? UI.MONITORING_STRIP_EXPANDED_HEIGHT
          : UI.MONITORING_STRIP_COLLAPSED_HEIGHT,
      }}
      className={cn(
        'absolute bottom-0 left-0 right-0 z-20',
        'border-t border-[var(--border)] bg-[var(--surface-1)]',
        'transition-[height] duration-200 ease-out',
        'flex flex-col overflow-hidden'
      )}
    >
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          'flex h-11 shrink-0 items-center gap-3 px-4 text-left',
          'border-b border-transparent hover:bg-[var(--surface-2)] transition-colors'
        )}
      >
        <Activity className="h-3.5 w-3.5 text-[var(--text-muted)]" />
        <span className="text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {workingAgents.length} agent{workingAgents.length === 1 ? '' : 's'} working
        </span>
        <span className="flex-1" />
        <span className="text-2xs text-[var(--text-muted)]">
          {expanded ? 'Collapse' : 'Expand'}
        </span>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 text-[var(--text-muted)]" />
        )}
      </button>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-px">
        {visible.map((a) => {
          const isRowExpanded = expandedAgentId === a.id;
          const steps = stepsFor(a.id);
          return (
            <div key={a.id}>
              <AgentMonitorRow
                agent={a.key}
                name={a.name}
                currentTask={a.currentTask}
                elapsedSeconds={a.elapsedSeconds}
                expanded={isRowExpanded}
                onToggle={() =>
                  setExpandedAgentId(isRowExpanded ? null : a.id)
                }
              />
              {isRowExpanded && steps.length > 0 && (
                <div className="pl-12 pr-3 pb-3 pt-1">
                  <AgentStepList steps={steps} variant="full" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
