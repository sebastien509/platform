import { AgentKey, AGENTS } from './agentColors';
import { cn } from '@/lib/utils/cn';

interface AgentIconProps {
  agent: AgentKey;
  size?: number;
  className?: string;
}

export function AgentIcon({ agent, size = 16, className }: AgentIconProps) {
  const { shape } = AGENTS[agent];
  const s = size;
  const half = s / 2;
  const color = `var(--agent-${agent})`;

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      className={cn('agent-icon', className)}
      aria-hidden="true"
    >
      {shape === 'circle' && (
        <>
          <circle cx={half} cy={half} r={half - 1.5} fill="none" stroke={color} strokeWidth={1.5} />
          <circle cx={half} cy={half} r={half * 0.28} fill={color} />
        </>
      )}
      {shape === 'diamond' && (
        <polygon points={`${half},1 ${s - 1},${half} ${half},${s - 1} 1,${half}`} fill={color} />
      )}
      {shape === 'square' && (
        <rect x={1.5} y={1.5} width={s - 3} height={s - 3} rx={1.5} fill={color} />
      )}
      {shape === 'triangle' && (
        <polygon points={`${half},1 ${s - 1},${s - 1} 1,${s - 1}`} fill={color} />
      )}
      {shape === 'half' && (
        <path d={`M ${half} 1 A ${half - 1.5} ${half - 1.5} 0 0 1 ${half} ${s - 1} Z`} fill={color} />
      )}
    </svg>
  );
}
