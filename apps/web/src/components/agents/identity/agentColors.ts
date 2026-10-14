export type AgentKey =
  | 'research' | 'strategy' | 'product' | 'engineering' | 'gtm'
  | 'campaign' | 'sales' | 'growth' | 'analysis' | 'knowledge' | 'outcomes';

export interface AgentMeta {
  key: AgentKey;
  label: string;
  role: string;
  shape: 'circle' | 'diamond' | 'square' | 'triangle' | 'half';
}

export const AGENTS: Record<AgentKey, AgentMeta> = {
  research:    { key: 'research',    label: 'Research',    role: 'Researcher',  shape: 'circle'   },
  strategy:    { key: 'strategy',    label: 'Strategy',    role: 'Strategist',  shape: 'diamond'  },
  product:     { key: 'product',     label: 'Product',     role: 'Product',     shape: 'square'   },
  engineering: { key: 'engineering', label: 'Engineering', role: 'Engineer',    shape: 'square'   },
  gtm:         { key: 'gtm',         label: 'GTM',         role: 'GTM',         shape: 'diamond'  },
  campaign:    { key: 'campaign',    label: 'Campaign',    role: 'Campaign',    shape: 'triangle' },
  sales:       { key: 'sales',       label: 'Sales',       role: 'Sales',       shape: 'triangle' },
  growth:      { key: 'growth',      label: 'Growth',      role: 'Growth',      shape: 'triangle' },
  analysis:    { key: 'analysis',    label: 'Analysis',    role: 'Analyst',     shape: 'circle'   },
  knowledge:   { key: 'knowledge',   label: 'Knowledge',   role: 'Curator',     shape: 'half'     },
  outcomes:    { key: 'outcomes',    label: 'Outcomes',    role: 'Synthesizer', shape: 'diamond'  },
};

export function agentVar(key: AgentKey): string {
  return `var(--agent-${key})`;
}

export function agentMutedVar(key: AgentKey): string {
  return `var(--agent-${key}-muted)`;
}
