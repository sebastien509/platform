import { ReactNode } from 'react';
import { AgentKey, AGENTS, agentMutedVar, agentVar } from './agentColors';
import { AgentIcon } from './AgentIcon';
import { AgentStateIndicator, AgentState } from './AgentStateIndicator';
import { cn } from '@/lib/utils/cn';

interface AgentIdentityProps {
  agent: AgentKey;
  state?: AgentState;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  rightSlot?: ReactNode;
}

const SIZE = {
  sm: { icon: 14, name: 'text-xs',   role: 'text-2xs', avatar: 'h-6 w-6' },
  md: { icon: 16, name: 'text-sm',   role: 'text-2xs', avatar: 'h-8 w-8' },
  lg: { icon: 20, name: 'text-base', role: 'text-xs',  avatar: 'h-10 w-10' },
};

export function AgentIdentity({
  agent,
  state,
  size = 'md',
  className,
  rightSlot,
}: AgentIdentityProps) {
  const meta = AGENTS[agent];
  const sz = SIZE[size];

  return (
    <div className={cn('flex items-center gap-2 min-w-0', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-lg shrink-0',
          sz.avatar
        )}
        style={{ background: agentMutedVar(agent) }}
      >
        <AgentIcon agent={agent} size={sz.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn('font-medium truncate', sz.name)}
            style={{ color: agentVar(agent) }}
          >
            {meta.label} Agent
          </span>
          <span className={cn('text-[var(--text-muted)]', sz.role)}>
            {meta.role}
          </span>
        </div>
        {state && <AgentStateIndicator state={state} />}
      </div>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </div>
  );
}
