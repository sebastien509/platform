/* ============================================================
   IV — Agent Manifests
   The registry every agent registers against.

   Adding an agent = adding a manifest here + writing its skill.
   No drawer UI changes.
   ============================================================ */

import type { AgentManifest } from '@/lib/types';
import {
  Search,
  Compass,
  Package,
  Code,
  Megaphone,
  Send,
  Users,
  TrendingUp,
  BarChart3,
  Library,
  Trophy,
  Bot,
  Sparkles,
} from 'lucide-react';

/* ---------- Icon registry ---------- */

export const AGENT_ICONS = {
  search: Search,
  compass: Compass,
  package: Package,
  code: Code,
  megaphone: Megaphone,
  send: Send,
  users: Users,
  growth: TrendingUp,
  chart: BarChart3,
  library: Library,
  trophy: Trophy,
  bot: Bot,
  sparkles: Sparkles,
} as const;

export type AgentIconKey = keyof typeof AGENT_ICONS;

export function getIcon(iconKey: string) {
  return AGENT_ICONS[iconKey as AgentIconKey] ?? AGENT_ICONS.bot;
}

/* ---------- Fallback ---------- */

const FALLBACK: AgentManifest = {
  id: 'unknown',
  name: 'Agent',
  icon: 'bot',
  pages: [],
  outputKinds: ['document'],
  quickActions: [],
  approvalPolicy: { default: 'always' },
};

/* ---------- Registry ---------- */

const MANIFESTS: Record<string, AgentManifest> = {
  /* The Research Agent is the first to ship — used by the Idea
   * Journey's research stage and by venture pages for their
   * own research stage. */
  research: {
    id: 'research',
    name: 'Research Agent',
    icon: 'search',
    pages: [
      'strategy',
      'product',
      'engineering',
      'gtm',
      'campaigns',
      'sales',
      'growth',
      'knowledge',
    ],
    outputKinds: ['document', 'table', 'chart'],
    quickActions: [
      { id: 'dig-pricing', label: 'Dig deeper on pricing' },
      { id: 'find-competitors', label: 'Find more competitors' },
      { id: 'summarize', label: 'Summarize so far' },
    ],
    approvalPolicy: { default: 'always' },
  },

  /* Strategy Agent — the first page-migrated agent. Added now so
   * Phase 4 can wire it without a registry change. */
  strategy: {
    id: 'strategy',
    name: 'Strategy Agent',
    icon: 'compass',
    pages: ['strategy'],
    outputKinds: ['document', 'chart'],
    quickActions: [
      { id: 'sharpen-icp', label: 'Sharpen the ICP' },
      { id: 'compare-motions', label: 'Compare launch motions' },
    ],
    approvalPolicy: { default: 'always' },
  },
};

/* ---------- Lookup ---------- */

export function getManifest(agentId: string): AgentManifest {
  return MANIFESTS[agentId] ?? { ...FALLBACK, id: agentId, name: agentId };
}

export function getRegisteredManifests(): AgentManifest[] {
  return Object.values(MANIFESTS);
}
