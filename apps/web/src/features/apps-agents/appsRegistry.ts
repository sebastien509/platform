import type { AgentKey } from '@/components/agents/identity';

/* ============================================================
   FUNCTION AREAS — the pages a listing can live on
   ============================================================ */
export type FunctionArea =
  | 'research'
  | 'strategy'
  | 'product'
  | 'engineering'
  | 'gtm'
  | 'campaigns'
  | 'sales'
  | 'growth'
  | 'analytics'
  | 'knowledge'
  | 'outcomes'
  | 'funding';

export const FUNCTION_LABEL: Record<FunctionArea, string> = {
  research: 'Research',
  strategy: 'Strategy',
  product: 'Product',
  engineering: 'Engineering',
  gtm: 'GTM',
  campaigns: 'Campaigns',
  sales: 'Sales',
  growth: 'Growth',
  analytics: 'Analytics',
  knowledge: 'Knowledge',
  outcomes: 'Outcomes',
  funding: 'Funding',
};

/* ============================================================
   LISTING TYPES
   ============================================================ */
export interface BaseAgentListing {
  type: 'base_agent';
  id: string;
  agentKey: AgentKey;
  name: string;
  role: string;
  description: string;
  /** Where the founder goes when they click. */
  home: FunctionArea;
}

export interface ToolListing {
  type: 'tool';
  id: string;
  name: string;
  description: string;
  category: string;
  /** Function pages where this surfaces in the tool strip. */
  surfacesIn: FunctionArea[];
}

export interface SpecializedAgentListing {
  type: 'specialized_agent';
  id: string;
  agentKey: AgentKey;
  name: string;
  description: string;
  /** Single function page where this surfaces. */
  surfacesIn: FunctionArea;
}

export type Listing = BaseAgentListing | ToolListing | SpecializedAgentListing;

/* ============================================================
   BASE AGENTS — included with IV, always available
   ============================================================ */
export const BASE_AGENTS: BaseAgentListing[] = [
  {
    type: 'base_agent',
    id: 'base_research',
    agentKey: 'research',
    name: 'Research Agent',
    role: 'Researcher',
    description:
      'Runs market, competitor, and customer research for ideas and ventures. Produces reports that carry forward into Knowledge.',
    home: 'research',
  },
  {
    type: 'base_agent',
    id: 'base_strategy',
    agentKey: 'strategy',
    name: 'Strategy Agent',
    role: 'Strategist',
    description:
      'Shapes vision, ICP, positioning, and assumptions. Surfaces what needs validating before it costs you.',
    home: 'strategy',
  },
  {
    type: 'base_agent',
    id: 'base_product',
    agentKey: 'product',
    name: 'Product Agent',
    role: 'Product',
    description:
      'Turns customer problems into requirements. Reviews scope, drafts roadmap, flags what blocks the MVP.',
    home: 'product',
  },
  {
    type: 'base_agent',
    id: 'base_engineering',
    agentKey: 'engineering',
    name: 'Engineering Agent',
    role: 'Engineer',
    description:
      'Diagnoses issues, proposes fixes, shows its plan, and executes with full tool-call transparency.',
    home: 'engineering',
  },
  {
    type: 'base_agent',
    id: 'base_gtm',
    agentKey: 'gtm',
    name: 'GTM Agent',
    role: 'GTM',
    description:
      'Analyzes segments, channels, and ICP fit. Flags when market signals suggest a change.',
    home: 'gtm',
  },
  {
    type: 'base_agent',
    id: 'base_campaign',
    agentKey: 'campaign',
    name: 'Campaign Agent',
    role: 'Campaign',
    description:
      'Drafts campaigns from GTM signals — copy, channel mix, send timing, calendar.',
    home: 'campaigns',
  },
  {
    type: 'base_agent',
    id: 'base_sales',
    agentKey: 'sales',
    name: 'Sales Agent',
    role: 'Sales',
    description:
      'Scores leads against ICP, prioritizes outreach, drafts personalized touches.',
    home: 'sales',
  },
  {
    type: 'base_agent',
    id: 'base_growth',
    agentKey: 'growth',
    name: 'Growth Agent',
    role: 'Growth',
    description:
      'Runs acquisition, funnel, and experiment analysis. Surfaces wins worth propagating.',
    home: 'growth',
  },
  {
    type: 'base_agent',
    id: 'base_analysis',
    agentKey: 'analysis',
    name: 'Analysis Agent',
    role: 'Analyst',
    description:
      'Watches KPIs, retention, and cohort behavior. Flags anomalies before they compound.',
    home: 'analytics',
  },
  {
    type: 'base_agent',
    id: 'base_knowledge',
    agentKey: 'knowledge',
    name: 'Knowledge Agent',
    role: 'Curator',
    description:
      'Curates your research base, surfaces beliefs that need confirming, links related evidence.',
    home: 'knowledge',
  },
  {
    type: 'base_agent',
    id: 'base_outcomes',
    agentKey: 'outcomes',
    name: 'Outcomes Agent',
    role: 'Synthesizer',
    description:
      'Synthesizes cross-function data into decision recommendations. Every call traces back to evidence.',
    home: 'outcomes',
  },
];

/* ============================================================
   TOOLS — external integrations
   ============================================================ */
export const TOOLS: ToolListing[] = [
  {
    type: 'tool',
    id: 'tool_stripe',
    name: 'Stripe',
    description:
      'Payments, subscriptions, and revenue data. Feeds Analytics and Sales with live numbers.',
    category: 'Payments',
    surfacesIn: ['sales', 'analytics'],
  },
  {
    type: 'tool',
    id: 'tool_hubspot',
    name: 'HubSpot',
    description:
      'CRM contacts, deals, and pipeline stages. Syncs with the Sales function.',
    category: 'CRM',
    surfacesIn: ['sales'],
  },
  {
    type: 'tool',
    id: 'tool_linear',
    name: 'Linear',
    description:
      'Issue tracking and engineering workflow. Engineering Agent reads and writes issues directly.',
    category: 'Issues',
    surfacesIn: ['engineering'],
  },
  {
    type: 'tool',
    id: 'tool_vercel',
    name: 'Vercel',
    description:
      'Deployments, previews, and environment state. Engineering Agent ships through it.',
    category: 'Deploy',
    surfacesIn: ['engineering'],
  },
  {
    type: 'tool',
    id: 'tool_github',
    name: 'GitHub',
    description:
      'Repos, PRs, and CI status. Engineering Agent reads diffs and opens PRs.',
    category: 'Source',
    surfacesIn: ['engineering'],
  },
  {
    type: 'tool',
    id: 'tool_posthog',
    name: 'PostHog',
    description:
      'Product analytics, funnels, and session replays. Feeds Growth and Analytics.',
    category: 'Analytics',
    surfacesIn: ['analytics', 'growth'],
  },
  {
    type: 'tool',
    id: 'tool_apollo',
    name: 'Apollo',
    description:
      'Prospecting and outreach data. Sales Agent scores against your ICP using it.',
    category: 'Prospecting',
    surfacesIn: ['sales'],
  },
  {
    type: 'tool',
    id: 'tool_notion',
    name: 'Notion',
    description:
      'Docs, wikis, and knowledge pages. Syncs into your Knowledge base.',
    category: 'Docs',
    surfacesIn: ['knowledge'],
  },
  {
    type: 'tool',
    id: 'tool_figma',
    name: 'Figma',
    description:
      'Design files and component libraries. Product Agent reads previews from it.',
    category: 'Design',
    surfacesIn: ['product'],
  },
];

/* ============================================================
   SPECIALIZED AGENTS — marketplace additions
   ============================================================ */
export const SPECIALIZED_AGENTS: SpecializedAgentListing[] = [
  {
    type: 'specialized_agent',
    id: 'spec_sales_outreach',
    agentKey: 'sales',
    name: 'Sales Outreach Agent',
    description:
      'Drafts personalized multi-touch sequences grounded in lead usage signals.',
    surfacesIn: 'sales',
  },
  {
    type: 'specialized_agent',
    id: 'spec_seo',
    agentKey: 'campaign',
    name: 'SEO Analyst',
    description:
      'Keyword research, content gap analysis, and rank tracking for organic campaigns.',
    surfacesIn: 'campaigns',
  },
  {
    type: 'specialized_agent',
    id: 'spec_contract_reviewer',
    agentKey: 'product',
    name: 'Contract Reviewer',
    description:
      'Reads contracts, flags non-standard clauses, proposes redlines.',
    surfacesIn: 'product',
  },
  {
    type: 'specialized_agent',
    id: 'spec_growth_exp',
    agentKey: 'growth',
    name: 'Growth Experimenter',
    description:
      'Designs A/B tests with proper power analysis. Tracks significance over time.',
    surfacesIn: 'growth',
  },
  {
    type: 'specialized_agent',
    id: 'spec_content_writer',
    agentKey: 'campaign',
    name: 'Content Writer',
    description:
      'Long-form drafts from research base, with citations. Consistent tone matching.',
    surfacesIn: 'campaigns',
  },
];

/* ============================================================
   LOOKUPS
   ============================================================ */
export function listingsByFunction(area: FunctionArea): {
  tools: ToolListing[];
  agents: SpecializedAgentListing[];
} {
  return {
    tools: TOOLS.filter((t) => t.surfacesIn.includes(area)),
    agents: SPECIALIZED_AGENTS.filter((a) => a.surfacesIn === area),
  };
}

export function routeForBaseAgent(
  agent: BaseAgentListing,
  ventureId: string
): string {
  if (agent.home === 'research') {
    // Research lives in the idea journey — route to the active idea or list.
    return '/ideas';
  }
  return `/ventures/${ventureId}/${agent.home}`;
}

export function routeForListing(
  listing: ToolListing | SpecializedAgentListing,
  ventureId: string
): string {
  const area = Array.isArray((listing as ToolListing).surfacesIn)
    ? (listing as ToolListing).surfacesIn[0]
    : (listing as SpecializedAgentListing).surfacesIn;
  return `/ventures/${ventureId}/${area}`;
}
