/**
 * tiers.ts — the single source of truth for the tier model.
 *
 *   Free    → 1 idea. No venture. Unlimited research (50/day abuse cap).
 *   Pro     → Unlimited ideas. 1 active venture. 5 op categories.
 *   Founder → Unlimited ideas + ventures. All 10 categories + priority.
 *   Team    → Founder + members + roles.
 */

export type TierKey = 'free' | 'pro' | 'founder' | 'team';

/** DB uses 'starter' for free. Map here so the UI never sees it. */
export const DB_TIER_TO_KEY: Record<string, TierKey> = {
  starter: 'free',
  free: 'free',
  pro: 'pro',
  founder: 'founder',
  team: 'team',
};

export const KEY_TO_DB_TIER: Record<TierKey, string> = {
  free: 'starter',
  pro: 'pro',
  founder: 'founder',
  team: 'team',
};

/**
 * Every venture page. Pro has 5 of these. Founder has all 10.
 * The category split IS the value ladder — not an invented
 * "premium op" flag on arbitrary ops.
 */
export type VenturePageId =
  | 'strategy'
  | 'product'
  | 'engineering'
  | 'gtm'
  | 'campaigns'
  | 'sales'
  | 'growth'
  | 'funding'
  | 'analytics'
  | 'knowledge'
  | 'outcomes'
  | 'connectors'
  | 'overview';

/** Pages Pro gets. */
export const PRO_PAGES: VenturePageId[] = [
  'strategy',
  'product',
  'gtm',
  'campaigns',
  'sales',
  'overview',       // always free to view
  'outcomes',       // always free to view
  'connectors',     // always free to view
];

/** Pages Founder/Team get — everything Pro has, plus these. */
export const FOUNDER_ONLY_PAGES: VenturePageId[] = [
  'engineering',
  'growth',
  'funding',
  'analytics',
  'knowledge',
];

/** Human labels for the gate copy. */
export const PAGE_LABELS: Record<string, string> = {
  strategy: 'Strategy',
  product: 'Product',
  engineering: 'Engineering',
  gtm: 'GTM',
  campaigns: 'Campaigns',
  sales: 'Sales',
  growth: 'Growth',
  funding: 'Funding',
  analytics: 'Analytics',
  knowledge: 'Knowledge',
  outcomes: 'Outcomes',
  connectors: 'Connectors',
  overview: 'Overview',
};

export interface TierConfig {
  key: TierKey;
  label: string;
  pricePerMonth: number;
  tagline: string;

  /** How many ideas the founder can create, ever. */
  ideas: number;

  /** How many ventures can be active at once. Archived don't count. */
  activeVentures: number;

  /** Venture pages they can run ops on. */
  pages: VenturePageId[];

  /** Max versions kept per deliverable. Infinity = all. */
  versionsPerDeliverable: number;

  /** Priority LLM routing (skip the queue). */
  priorityOps: boolean;

  /** Members allowed in the workspace (including the owner). */
  maxMembers: number;

  /** Whether the owner can invite anyone. */
  canInvite: boolean;

  /** Pricing page bullets — what the founder sees on the card. */
  features: string[];
}

/** All pages — used as the founder/team list. */
const ALL_PAGES: VenturePageId[] = [
  ...PRO_PAGES,
  ...FOUNDER_ONLY_PAGES,
];

export const TIER_CONFIG: Record<TierKey, TierConfig> = {
  free: {
    key: 'free',
    label: 'Free',
    pricePerMonth: 0,
    tagline: 'Shape one idea with the full agent pipeline.',
    ideas: 1,
    activeVentures: 0,
    pages: [],
    versionsPerDeliverable: 0,
    priorityOps: false,
    maxMembers: 1,
    canInvite: false,
    features: [
      '1 idea — the full journey',
      'Unlimited research on that idea',
      'Capture · Clean · Research · Synthesize',
      'The finalized idea card',
      'No ventures',
    ],
  },
  pro: {
    key: 'pro',
    label: 'Pro',
    pricePerMonth: 29,
    tagline: 'One active venture, run in full.',
    ideas: Infinity,
    activeVentures: 1,
    pages: PRO_PAGES,
    versionsPerDeliverable: 3,
    priorityOps: false,
    maxMembers: 1,
    canInvite: false,
    features: [
      'Unlimited ideas',
      '1 active venture at a time',
      '5 op categories — Strategy, Product, GTM, Campaigns, Sales',
      'Full research engine',
      'Deliverable versions (3 per op)',
      'Gmail · Slack · Notion · GitHub · Vercel',
    ],
  },
  founder: {
    key: 'founder',
    label: 'Founder Premium',
    pricePerMonth: 59,
    tagline: 'Unlimited ventures. Every op. Priority processing.',
    ideas: Infinity,
    activeVentures: Infinity,
    pages: ALL_PAGES,
    versionsPerDeliverable: Infinity,
    priorityOps: true,
    maxMembers: 1,
    canInvite: false,
    features: [
      'Unlimited ideas + ventures',
      'All 10 op categories + Engineering, Growth, Funding, Analytics',
      'Unlimited deliverable versions',
      'Priority processing on every run',
      'Advanced analytics + founder templates',
      'Early access to new ops',
    ],
  },
  team: {
    key: 'team',
    label: 'Team',
    pricePerMonth: 149,
    tagline: 'Founder Premium, plus your team.',
    ideas: Infinity,
    activeVentures: Infinity,
    pages: ALL_PAGES,
    versionsPerDeliverable: Infinity,
    priorityOps: true,
    maxMembers: 10,
    canInvite: true,
    features: [
      'Everything in Founder Premium',
      'Invite up to 10 teammates',
      'Roles — owner · admin · member · viewer',
      'Shared ventures, deliverables, comments',
      'Notification routing per member',
    ],
  },
};

/* ── Runtime checks ── */

export function canRunOpOnPage(
  tier: TierKey,
  pageId: string | null | undefined,
): boolean {
  if (!pageId) return false;
  const cfg = TIER_CONFIG[tier];
  return cfg.pages.includes(pageId as VenturePageId);
}

/**
 * Legacy name — kept so existing call sites still typecheck.
 * Now backed by the page-category split.
 */
export function canRunOp(
  tier: TierKey,
  opId: string | null | undefined,
): boolean {
  if (!opId) return false;
  /* op ids look like "strategy.define-icp", "engineering.scaffold-repo" */
  const page = opId.split('.')[0];
  return canRunOpOnPage(tier, page);
}

export function canCreateVenture(
  tier: TierKey,
  activeVentures: number,
): boolean {
  return activeVentures < TIER_CONFIG[tier].activeVentures;
}

export function canCreateIdea(tier: TierKey, totalIdeas: number): boolean {
  return totalIdeas < TIER_CONFIG[tier].ideas;
}

export function canInviteMember(
  tier: TierKey,
  currentMembers: number,
): boolean {
  const cfg = TIER_CONFIG[tier];
  return cfg.canInvite && currentMembers < cfg.maxMembers;
}

/**
 * Which pages would this tier gain by upgrading to the next one?
 * Used by the gate copy to say exactly what they're unlocking.
 */
export function pagesUnlockedByUpgrade(
  from: TierKey,
  to: TierKey,
): VenturePageId[] {
  const fromPages = new Set(TIER_CONFIG[from].pages);
  return TIER_CONFIG[to].pages.filter((p) => !fromPages.has(p));
}
