import { Agent } from '@/lib/types';
import { ObjectDrawer } from './ObjectDrawer';
import { AgentIdentity, AgentKey, AgentState } from '@/components/agents/identity';
import { AgentStepList, AgentRunStep } from '@/components/agents/AgentStepList';
import { ToolCallBlock, ToolCallStatus } from '@/components/agents/toolcall';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils/format';
import { Play, Activity, Zap } from 'lucide-react';

interface EmbeddedToolCall {
  id: string;
  name: string;
  status: ToolCallStatus;
  duration?: number;
  input?: unknown;
  output?: unknown;
}

interface AgentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent | null;
  steps?: AgentRunStep[];
  toolCalls?: EmbeddedToolCall[];
  onRun?: () => void;
}

function toAgentKey(role: string): AgentKey {
  const r = role.toLowerCase().replace(/[^a-z]/g, '');
  if (r.includes('research')) return 'research';
  if (r.includes('strateg')) return 'strategy';
  if (r.includes('product')) return 'product';
  if (r.includes('engineer')) return 'engineering';
  if (r.includes('gtm')) return 'gtm';
  if (r.includes('campaign') || r.includes('content') || r.includes('copy'))
    return 'campaign';
  if (r.includes('sales')) return 'sales';
  if (r.includes('growth')) return 'growth';
  if (r.includes('analyst') || r.includes('analysis')) return 'analysis';
  if (r.includes('knowledge')) return 'knowledge';
  if (r.includes('outcome')) return 'outcomes';
  return 'research';
}

function toAgentState(status: string): AgentState {
  const s = status.toLowerCase();
  if (s === 'working') return 'working';
  if (s === 'waiting' || s === 'needs_founder' || s === 'needs_input')
    return 'needs_founder';
  if (s === 'complete' || s === 'completed') return 'complete';
  if (s === 'blocked') return 'blocked';
  if (s === 'paused') return 'paused';
  if (s === 'failed') return 'failed';
  return 'idle';
}

export function AgentDrawer({
  open,
  onOpenChange,
  agent,
  steps,
  toolCalls,
  onRun,
}: AgentDrawerProps) {
  if (!agent) return null;
  const key = toAgentKey(agent.role);
  const state = toAgentState(agent.status);

  return (
    <ObjectDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={agent.name}
      description={agent.description}
    >
      <div className="space-y-6 py-4">
        <AgentIdentity agent={key} state={state} size="lg" />

        {agent.currentTask && (
          <div className="rounded-lg bg-[var(--surface-2)] p-3">
            <p className="text-2xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Current task
            </p>
            <p className="text-sm mt-1">{agent.currentTask}</p>
          </div>
        )}

        {steps && steps.length > 0 && (
          <section>
            <h4 className="text-2xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" />
              Live task list
            </h4>
            <AgentStepList steps={steps} variant="full" />
          </section>
        )}

        {toolCalls && toolCalls.length > 0 && (
          <section>
            <h4 className="text-2xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5" />
              Tool calls
            </h4>
            <div className="space-y-2">
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
          </section>
        )}

        {agent.activity && agent.activity.length > 0 && (
          <section>
            <h4 className="text-2xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Activity log
            </h4>
            <ul className="space-y-2">
              {agent.activity.slice(0, 10).map((act: any) => (
                <li key={act.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-primary)]">{act.action}</p>
                    <p className="text-2xs text-[var(--text-muted)]">
                      {act.result}
                    </p>
                  </div>
                  <span className="text-2xs text-[var(--text-muted)] whitespace-nowrap">
                    {formatDate(act.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {onRun && state === 'idle' && (
          <Button className="w-full gap-2" onClick={onRun}>
            <Play className="h-4 w-4" />
            Run Agent
          </Button>
        )}
      </div>
    </ObjectDrawer>
  );
}
