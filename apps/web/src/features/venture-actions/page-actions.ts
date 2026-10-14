import type { VenturePageKey } from '@/lib/types';
import { EXTRA_OPS } from './extra-ops';

/* ============================================================
   RENDER TYPE / TIER / PAYLOAD — unchanged shape
   ============================================================ */

export type RenderType =
  | 'markdown' | 'html' | 'deck' | 'report'
  | 'code' | 'sheet' | 'operational' | 'repo';

export type OpTier = 'primary' | 'secondary';

export interface ActionDef {
  id: string;
  verb: string;
  destination: string;
  mode: 'native' | 'connected';
  connector?: string;
  description?: string;
  icon?: string;
  build?: () => ActionPayload;
  primary?: boolean;
  surfaceId?: import('@/lib/share').SurfaceId;
  buildSnapshot?: () => import('@/lib/share').ShareSnapshot;
  requires?: RequireInput[];
  produces?: string;
  requiresOps?: string[];
  requiresLabels?: string[];
  softDependency?: string;
  renderType?: RenderType;
  tier?: OpTier;
  refinesOpId?: string;
  conversationMode?: boolean;
  agentMethod?: string;
  expectedOutputKind?: 'snapshot' | 'payload' | 'confirm' | 'email_batch' | 'action';
}

export interface RequireInput {
  id: string;
  kind: 'question' | 'file_request' | 'approval';
  prompt: string;
  options?: Array<{ label: string; value: string; primary?: boolean }>;
  freeText?: boolean;
  acceptedKinds?: string[];
  destinationHint?: string;
  approveLabel?: string;
  rejectLabel?: string;
}

export interface EmailBatchSegment {
  name: string;
  size?: number;
  filter?: string;
  personalizationHint?: string;
}

export interface EmailBatch {
  subjectTemplate: string;
  bodyTemplate: string;
  segments: EmailBatchSegment[];
  personalizationRules: Record<string, string>;
  estimatedRecipients?: number;
}

export type ActionPayload =
  | { type: 'confirm'; heading: string; body: string }
  | { type: 'text'; label: string; text: string }
  | { type: 'email'; to: string; subject: string; body: string }
  | { type: 'email_batch'; label: string; batch: EmailBatch }
  | { type: 'html'; label: string; html: string }
  | { type: 'json'; label: string; data: Record<string, unknown> }
  | { type: 'link'; label: string; url: string; description?: string };

/* ============================================================
   REGISTRY — 30 focused ops across 8 domains
   ============================================================ */

const REGISTRY: Partial<Record<VenturePageKey, ActionDef[]>> = {
  /* ═══════════════ STRATEGY — 5 ═══════════════ */
  strategy: [
    {
      id: 'strategy.define-icp',
      verb: 'Define ICP',
      renderType: 'report',
      tier: 'primary',
      produces: 'ICP',
      destination: 'Strategy › ICP',
      mode: 'native',
      icon: 'users',
      primary: true,
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'strategy.brief',
      description: 'Name the specific buyer segment with the sharpest pain.',
      requires: [
        {
          id: 'req-icp-sector',
          kind: 'question',
          prompt: 'Which sector should the ICP focus on first?',
          options: [
            { label: 'Biotech / Healthtech', value: 'biotech', primary: true },
            { label: 'B2B SaaS', value: 'b2b-saas' },
            { label: 'Fintech', value: 'fintech' },
            { label: 'Legal Tech', value: 'legal-tech' },
            { label: 'Let research decide', value: 'auto' },
          ],
        },
        {
          id: 'req-icp-size',
          kind: 'question',
          prompt: 'What firm size are you picturing?',
          options: [
            { label: 'Startup (1-50)', value: 'startup' },
            { label: 'SMB (50-200)', value: 'smb', primary: true },
            { label: 'Mid-market (200-2000)', value: 'mid-market' },
            { label: 'Enterprise (2000+)', value: 'enterprise' },
            { label: 'Let research decide', value: 'auto' },
          ],
        },
        {
          id: 'req-icp-role',
          kind: 'question',
          prompt: 'Who holds the buying power?',
          options: [
            { label: 'Compliance / Legal', value: 'compliance', primary: true },
            { label: 'Data / IT', value: 'it' },
            { label: 'Operations', value: 'ops' },
            { label: 'Founder / CEO', value: 'founder' },
            { label: 'Let research decide', value: 'auto' },
          ],
        },
      ],
    },
    {
      id: 'strategy.define-positioning',
      verb: 'Define positioning',
      renderType: 'report',
      tier: 'primary',
      produces: 'Positioning',
      destination: 'Strategy › Positioning',
      mode: 'native',
      icon: 'target',
      primary: true,
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'strategy.brief',
      description: 'Write the one-line promise that makes the wedge obvious.',
      requiresOps: ['strategy.define-icp'],
      requiresLabels: ['ICP'],
      requires: [
        {
          id: 'req-positioning-competitor',
          kind: 'question',
          prompt: 'Who is the primary competitor you are positioning against?',
          freeText: true,
        },
        {
          id: 'req-positioning-differentiator',
          kind: 'question',
          prompt: 'What can you claim that no competitor can?',
          freeText: true,
        },
        {
          id: 'req-positioning-category',
          kind: 'question',
          prompt: 'What category do you want to be filed under?',
          options: [
            { label: 'An existing category we lead', value: 'existing' },
            { label: 'A new category we define', value: 'new-category' },
            { label: 'A sub-category of an existing one', value: 'sub-category' },
            { label: 'Let research decide', value: 'auto' },
          ],
        },
        {
          id: 'req-positioning-proof',
          kind: 'question',
          prompt: 'What is your strongest proof point today? (a customer, a metric, a technical edge)',
          freeText: true,
        },
      ],
    },
    {
      id: 'strategy.define-wedge',
      verb: 'Define wedge',
      renderType: 'report',
      tier: 'primary',
      produces: 'Wedge',
      destination: 'Strategy › Wedge',
      mode: 'native',
      icon: 'zap',
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'strategy.brief',
      description: 'The single job you win first.',
      requiresOps: ['strategy.define-icp', 'strategy.define-positioning'],
      requiresLabels: ['ICP', 'Positioning'],
      requires: [
        {
          id: 'req-wedge-first-job',
          kind: 'question',
          prompt: 'What is the ONE job the product must do well before anything else?',
          freeText: true,
        },
        {
          id: 'req-wedge-segment',
          kind: 'question',
          prompt: 'Who is the smallest segment we can win first?',
          freeText: true,
        },
        {
          id: 'req-wedge-timeframe',
          kind: 'question',
          prompt: 'What is a realistic time-to-value for that first job?',
          options: [
            { label: 'Same day', value: 'same-day' },
            { label: 'Within a week', value: 'week' },
            { label: 'Within a month', value: 'month' },
            { label: 'Longer than a month', value: 'long' },
          ],
        },
        {
          id: 'req-wedge-constraint',
          kind: 'question',
          prompt: 'What constraint (technical, resource, market) most limits the wedge?',
          freeText: true,
        },
      ],
    },
    {
      id: 'strategy.generate-brand-brief',
      verb: 'Generate brand brief',
      renderType: 'deck',
      tier: 'primary',
      produces: 'Brand brief',
      destination: 'Strategy › Brand',
      mode: 'native',
      icon: 'sparkles',
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'strategy.brief',
      description: 'Produce the visual + voice brief that guides every design decision.',
      requiresOps: ['strategy.define-positioning'],
      requiresLabels: ['Positioning'],
      requires: [
        {
          id: 'req-brand-tone',
          kind: 'question',
          prompt: 'What is the dominant tone of the brand?',
          options: [
            { label: 'Plain & confident', value: 'plain', primary: true },
            { label: 'Warm & human', value: 'warm' },
            { label: 'Technical & precise', value: 'technical' },
          ],
        },
      ],
    },
    {
      id: 'strategy.draft-pricing-model',
      verb: 'Draft pricing model',
      renderType: 'report',
      tier: 'primary',
      produces: 'Pricing model',
      destination: 'Strategy › Pricing',
      mode: 'native',
      icon: 'dollar-sign',
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'strategy.brief',
      description: 'Tiered pricing with a specific willingness-to-pay signal.',
      requiresOps: ['strategy.define-icp'],
      requiresLabels: ['ICP'],
      requires: [
        {
          id: 'req-pricing-acv',
          kind: 'question',
          prompt: 'What annual contract value do you want to target?',
          options: [
            { label: 'Under $500', value: 'under-500' },
            { label: '$500 to $2k', value: '500-2k' },
            { label: '$2k to $10k', value: '2k-10k' },
            { label: '$10k to $50k', value: '10k-50k' },
            { label: 'Above $50k', value: 'above-50k' },
          ],
        },
        {
          id: 'req-pricing-value-metric',
          kind: 'question',
          prompt: 'What is the single value metric you want to charge on? (seats, usage, outcomes, flat)',
          freeText: true,
        },
        {
          id: 'req-pricing-cadence',
          kind: 'question',
          prompt: 'What billing cadence fits your buyer?',
          options: [
            { label: 'Monthly', value: 'monthly' },
            { label: 'Annual upfront', value: 'annual' },
            { label: 'Both', value: 'both' },
            { label: 'Let research decide', value: 'auto' },
          ],
        },
        {
          id: 'req-pricing-wtp-signal',
          kind: 'question',
          prompt: 'What have you observed about willingness to pay? (a customer yes, a competitor price point, a budget line you map to)',
          freeText: true,
        },
      ],
    },
    {
      id: 'strategy.generate-design-spec',
      verb: 'Generate design spec',
      renderType: 'report',
      tier: 'primary',
      produces: 'Design system',
      destination: 'Strategy › Design',
      mode: 'native',
      icon: 'palette',
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'strategy.brief',
      description: 'Turn the brand brief into a concrete design system — palette, typography, spacing, component patterns.',
      requiresOps: ['strategy.generate-brand-brief'],
      requiresLabels: ['Brand brief'],
      requires: [
        {
          id: 'req-design-feeling',
          kind: 'question',
          prompt: "What should someone feel the moment they land on the product?",
          freeText: true,
        },
        {
          id: 'req-design-references',
          kind: 'question',
          prompt: "Any product or site whose visual language you admire? Name 1-3.",
          freeText: true,
        },
        {
          id: 'req-design-density',
          kind: 'question',
          prompt: "What information density fits your user?",
          options: [
            { label: 'Airy — big spacing, lots of whitespace', value: 'airy', primary: true },
            { label: 'Balanced', value: 'balanced' },
            { label: 'Dense — data-rich, more per screen', value: 'dense' },
          ],
        },
        {
          id: 'req-design-avoid',
          kind: 'question',
          prompt: "What visual style do you explicitly NOT want?",
          freeText: true,
        },
      ],
    },
  ],

  /* ═══════════════ PRODUCT — 2 ═══════════════ */
  product: [
    {
      id: 'product.generate-prd',
      verb: 'Generate PRD',
      renderType: 'markdown',
      tier: 'primary',
      produces: 'PRD',
      destination: 'Product › Requirements',
      mode: 'native',
      icon: 'file-text',
      primary: true,
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'strategy.brief',
      description: 'Turn validated Strategy into an implementation-ready spec.',
      requiresOps: ['strategy.define-icp', 'strategy.define-positioning'],
      requiresLabels: ['ICP', 'Positioning'],
requires: [
        {
          id: 'req-prd-primary-job',
          kind: 'question',
          prompt: 'What is the single most important thing the MVP must do well?',
          freeText: true,
        },
        {
          id: 'req-prd-launch-horizon',
          kind: 'question',
          prompt: 'What is your realistic launch horizon for the MVP?',
          options: [
            { label: '2 weeks', value: '2-weeks' },
            { label: '1 month', value: '1-month' },
            { label: '1 quarter', value: '1-quarter' },
            { label: '6 months or more', value: '6-months' },
          ],
        },
        {
          id: 'req-prd-non-goals',
          kind: 'question',
          prompt: 'What are you explicitly NOT building in v1? (the features people will ask for that you will say no to)',
          freeText: true,
        },
        {
          id: 'req-prd-hardest-build',
          kind: 'question',
          prompt: 'What is the hardest thing to build — and should we buy it, borrow it, or build it?',
          freeText: true,
        },
      ],
    },
    {
      id: 'product.generate-prototype',
      verb: 'Generate prototype',
      renderType: 'html',
      tier: 'primary',
      produces: 'Prototype',
      destination: 'Product › Prototype',
      mode: 'native',
      icon: 'sparkles',
      agentMethod: 'runOp',
      expectedOutputKind: 'payload',
      surfaceId: 'product.prototype',
      description: 'Produces a clickable prototype hosted by IV with a share link.',
      requiresOps: ['product.generate-prd'],
      requiresLabels: ['PRD'],
    },
    {
      id: 'product.publish-prototype',
      verb: 'Publish prototype',
      renderType: 'operational',
      tier: 'secondary',
      produces: 'Live prototype URL',
      destination: 'Product › Prototype',
      mode: 'connected',
      connector: 'vercel',
      icon: 'rocket',
      agentMethod: 'runOp',
      expectedOutputKind: 'action',
      description: 'Deploys the prototype to Vercel and returns a live URL.',
      requiresOps: ['product.generate-prototype'],
      requiresLabels: ['Prototype'],
    },
  ],

  /* ═══════════════ ENGINEERING — 3 ═══════════════ */
  engineering: [
    {
      id: 'engineering.generate-architecture',
      verb: 'Generate architecture',
      renderType: 'markdown',
      tier: 'primary',
      produces: 'Architecture',
      destination: 'Engineering › Architecture',
      mode: 'native',
      icon: 'layers',
      primary: true,
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'engineering.docs',
      description: 'Design the monolith-first architecture for the MVP.',
      requiresOps: ['product.generate-prd'],
      requiresLabels: ['PRD'],
requires: [
        {
          id: 'req-arch-team-size',
          kind: 'question',
          prompt: 'What team size will build and maintain this?',
          options: [
            { label: 'Solo founder', value: 'solo' },
            { label: '2-3 engineers', value: 'small' },
            { label: '4-8 engineers', value: 'mid' },
            { label: '8+ engineers', value: 'large' },
          ],
        },
        {
          id: 'req-arch-constraint',
          kind: 'question',
          prompt: 'What constraint matters most here — budget, speed, team skills, or scale?',
          freeText: true,
        },
        {
          id: 'req-arch-deployment',
          kind: 'question',
          prompt: 'Where should this deploy?',
          options: [
            { label: 'Vercel', value: 'vercel' },
            { label: 'AWS', value: 'aws' },
            { label: 'GCP', value: 'gcp' },
            { label: 'A bare VPS', value: 'vps' },
            { label: 'Recommend one', value: 'auto' },
          ],
        },
        {
          id: 'req-arch-existing',
          kind: 'question',
          prompt: 'Any existing tech, vendors, or internal systems this must integrate with?',
          freeText: true,
        },
      ],
    },
    {
      id: 'engineering.draft-api-spec',
      verb: 'Draft API spec',
      renderType: 'code',
      tier: 'primary',
      produces: 'API spec',
      destination: 'Engineering › API',
      mode: 'native',
      icon: 'code',
      agentMethod: 'runOp',
      expectedOutputKind: 'payload',
      description: 'Produce the OpenAPI spec for the MVP surface.',
      requiresOps: ['engineering.generate-architecture'],
      requiresLabels: ['Architecture'],
    },
    {
      id: 'engineering.generate-ui-spec',
      verb: 'Generate UI spec',
      renderType: 'html',
      tier: 'primary',
      produces: 'UI spec',
      destination: 'Engineering › UI',
      mode: 'native',
      icon: 'layout',
      agentMethod: 'runOp',
      expectedOutputKind: 'payload',
      surfaceId: 'engineering.docs',
      description: 'Mockup + component inventory driven by brand brief and architecture.',
      requiresOps: ['engineering.generate-architecture', 'strategy.generate-brand-brief'],
      requiresLabels: ['Architecture', 'Brand brief'],
requires: [
        {
          id: 'req-ui-signature-screen',
          kind: 'question',
          prompt: 'Name the one screen that must feel uniquely yours — where users get the "ah" moment.',
          freeText: true,
        },
        {
          id: 'req-ui-design-maturity',
          kind: 'question',
          prompt: 'How mature is the design system today?',
          options: [
            { label: 'Nothing yet', value: 'none' },
            { label: 'Basic tokens + components', value: 'basic' },
            { label: 'Full design system', value: 'full' },
          ],
        },
        {
          id: 'req-ui-reference',
          kind: 'question',
          prompt: 'What is your strongest UI reference — a product, a site, a screenshot you keep coming back to?',
          freeText: true,
        },
        {
          id: 'req-ui-library',
          kind: 'question',
          prompt: 'Where should the components come from?',
          options: [
            { label: 'Build from scratch', value: 'scratch' },
            { label: 'shadcn/ui', value: 'shadcn' },
            { label: 'Material', value: 'material' },
            { label: 'Custom, based on existing', value: 'custom' },
          ],
        },
      ],
    },
    {
      id: 'engineering.scaffold-repo',
      verb: 'Scaffold repo',
      renderType: 'operational',
      tier: 'primary',
      produces: 'GitHub repo',
      destination: 'Engineering › Repo',
      mode: 'connected',
      connector: 'github',
      icon: 'github',
      agentMethod: 'runOp',
      expectedOutputKind: 'action',
      description: 'Creates a real GitHub repo with README, architecture doc, and initial issues.',
      requiresOps: ['engineering.generate-architecture'],
      requiresLabels: ['Architecture'],
    },
  ],

  /* ═══════════════ GTM — 4 ═══════════════ */
  gtm: [
    {
      id: 'gtm.define-segments',
      verb: 'Define segments',
      renderType: 'report',
      tier: 'primary',
      produces: 'Segments',
      destination: 'GTM › Segments',
      mode: 'native',
      icon: 'users',
      primary: true,
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'gtm.plan',
      description: 'Name and rank the segments to reach first.',
      requiresOps: ['strategy.define-icp'],
      requiresLabels: ['ICP'],
      requires: [
        {
          id: 'req-seg-lens',
          kind: 'question',
          prompt: "What lens should we segment by?",
          options: [
            { label: 'Firm size', value: 'size' },
            { label: 'Role / function', value: 'role' },
            { label: 'Industry vertical', value: 'vertical' },
            { label: 'Need / pain shape', value: 'need', primary: true },
          ],
        },
        {
          id: 'req-seg-existing',
          kind: 'question',
          prompt: "Any segment you already know is the priority — or should we find it?",
          freeText: true,
        },
        {
          id: 'req-seg-exclusions',
          kind: 'question',
          prompt: "Any segment to explicitly rule out? (competitor turf, too-small, etc.)",
          freeText: true,
        },
        {
          id: 'req-seg-reach',
          kind: 'question',
          prompt: "How do you reach new segments today?",
          options: [
            { label: 'Founder-led outbound', value: 'founder-outbound' },
            { label: 'Content / SEO', value: 'content' },
            { label: 'Paid', value: 'paid' },
            { label: 'Partnerships', value: 'partners' },
            { label: 'Not sure yet', value: 'auto', primary: true },
          ],
        },
      ],
    },
    {
      id: 'gtm.draft-channel-strategy',
      verb: 'Draft channel strategy',
      renderType: 'report',
      tier: 'primary',
      produces: 'Channel strategy',
      destination: 'GTM › Channels',
      mode: 'native',
      icon: 'share',
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'gtm.plan',
      description: 'Rank channels by expected CAC and time-to-signal.',
      requiresOps: ['gtm.define-segments'],
      requiresLabels: ['Segments'],
      requires: [
        {
          id: 'req-ch-primary',
          kind: 'question',
          prompt: "What channel are you most confident in today?",
          options: [
            { label: 'Founder-led outbound', value: 'founder-outbound' },
            { label: 'Content / SEO', value: 'content' },
            { label: 'Cold email', value: 'cold-email' },
            { label: 'Paid', value: 'paid' },
            { label: 'Partnerships', value: 'partners' },
            { label: 'Recommend one', value: 'auto', primary: true },
          ],
        },
        {
          id: 'req-ch-cac',
          kind: 'question',
          prompt: "What CAC would still feel like a good deal?",
          freeText: true,
        },
        {
          id: 'req-ch-budget',
          kind: 'question',
          prompt: "Monthly budget available for channels?",
          options: [
            { label: 'Under $500', value: 'under-500' },
            { label: '$500-$2k', value: '500-2k' },
            { label: '$2k-$10k', value: '2k-10k' },
            { label: '$10k+', value: '10k-plus' },
          ],
        },
        {
          id: 'req-ch-advantage',
          kind: 'question',
          prompt: "Any unfair advantage we should exploit — audience, network, SEO moat, referral?",
          freeText: true,
        },
      ],
    },
    {
      id: 'gtm.draft-messaging',
      verb: 'Draft messaging',
      renderType: 'report',
      tier: 'primary',
      produces: 'Messaging doc',
      destination: 'GTM › Messaging',
      mode: 'native',
      icon: 'message-circle',
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'gtm.plan',
      description: 'Message variants tuned per segment.',
      requiresOps: ['gtm.define-segments'],
      requiresLabels: ['Segments'],
      requires: [
        {
          id: 'req-msg-promise',
          kind: 'question',
          prompt: "In one sentence, what do you promise the buyer?",
          freeText: true,
        },
        {
          id: 'req-msg-enemy',
          kind: 'question',
          prompt: "What are you replacing — the incumbent tool, the manual process, the status quo?",
          freeText: true,
        },
        {
          id: 'req-msg-tone',
          kind: 'question',
          prompt: "What tone fits the brand?",
          options: [
            { label: 'Plain & confident', value: 'plain', primary: true },
            { label: 'Technical & precise', value: 'technical' },
            { label: 'Warm & human', value: 'warm' },
          ],
        },
        {
          id: 'req-msg-proof',
          kind: 'question',
          prompt: "What is the strongest proof point you can put behind the message?",
          freeText: true,
        },
      ],
    },
    {
      id: 'gtm.generate-landing',
      verb: 'Generate landing',
      renderType: 'html',
      tier: 'primary',
      produces: 'Landing page',
      destination: 'GTM › Landing',
      mode: 'native',
      icon: 'rocket',
      agentMethod: 'runOp',
      expectedOutputKind: 'payload',
      surfaceId: 'gtm.landing',
      description: 'Produces a live landing page for the primary channel.',
      requiresOps: ['gtm.draft-messaging'],
      requiresLabels: ['Messaging'],
    },
  ],

  /* ═══════════════ CAMPAIGNS — 2 ═══════════════ */
  campaigns: [
    {
      id: 'campaigns.generate-drip-sequence',
      verb: 'Generate drip sequence',
      renderType: 'report',
      tier: 'primary',
      produces: 'Drip sequence',
      destination: 'Campaigns › Drip',
      mode: 'native',
      icon: 'mail',
      primary: true,
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'campaigns.landing',
      description: 'Create the 5-email onboarding sequence.',
      requiresOps: ['gtm.define-segments'],
      requiresLabels: ['Segments'],
      requires: [
        {
          id: 'req-drip-goal',
          kind: 'question',
          prompt: "What is the sequence for?",
          options: [
            { label: 'Onboarding after signup', value: 'onboarding', primary: true },
            { label: 'Activation (first value)', value: 'activation' },
            { label: 'Upgrade / upsell', value: 'upgrade' },
            { label: 'Retention / re-engagement', value: 'retention' },
          ],
        },
        {
          id: 'req-drip-length',
          kind: 'question',
          prompt: "How many emails do you want?",
          options: [
            { label: '3 emails', value: '3' },
            { label: '5 emails', value: '5', primary: true },
            { label: '7 emails', value: '7' },
          ],
        },
        {
          id: 'req-drip-trigger',
          kind: 'question',
          prompt: "What triggers the sequence? (signup, first action, inactivity, upgrade)",
          freeText: true,
        },
        {
          id: 'req-drip-tone-ref',
          kind: 'question',
          prompt: "Any email you love — competitor, brand, founder — that sets the tone?",
          freeText: true,
        },
      ],
    },
    {
      id: 'campaigns.draft-email',
      verb: 'Draft email',
      renderType: 'html',
      tier: 'primary',
      produces: 'Email draft',
      destination: 'Campaigns › Drip',
      mode: 'native',
      icon: 'file-text',
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'campaigns.landing',
      description: 'Write the send-ready HTML for a specific drip email.',
      requiresOps: ['campaigns.generate-drip-sequence'],
      requiresLabels: ['Drip sequence'],
    },
    {
      id: 'campaigns.launch-drip',
      verb: 'Launch drip',
      renderType: 'operational',
      tier: 'secondary',
      produces: 'Sent drip',
      destination: 'Campaigns › Drip',
      mode: 'connected',
      connector: 'gmail',
      icon: 'send',
      agentMethod: 'runOp',
      expectedOutputKind: 'email_batch',
      description: 'Sends the drip sequence to a list through Gmail.',
requires: [
        {
          id: 'req-drip-goal',
          kind: 'question',
          prompt: 'What is the sequence for?',
          options: [
            { label: 'Onboarding after signup', value: 'onboarding', primary: true },
            { label: 'Activation (first value)', value: 'activation' },
            { label: 'Upgrade / upsell', value: 'upgrade' },
            { label: 'Retention / re-engagement', value: 'retention' },
          ],
        },
        {
          id: 'req-drip-length',
          kind: 'question',
          prompt: 'How many emails do you want?',
          options: [
            { label: '3 emails', value: '3' },
            { label: '5 emails', value: '5', primary: true },
            { label: '7 emails', value: '7' },
          ],
        },
        {
          id: 'req-drip-trigger',
          kind: 'question',
          prompt: 'What triggers the sequence? (signup, first action, inactivity, upgrade)',
          freeText: true,
        },
        {
          id: 'req-drip-tone-ref',
          kind: 'question',
          prompt: 'Any email you love — competitor, brand, founder — that sets the tone?',
          freeText: true,
        },
      ],
      requiresOps: ['campaigns.generate-drip-sequence'],
      requiresLabels: ['Drip sequence'],
    },
  ],

  /* ═══════════════ SALES — 4 ═══════════════ */
  sales: [
    {
      id: 'sales.generate-discovery-script',
      verb: 'Generate discovery script',
      renderType: 'markdown',
      tier: 'primary',
      produces: 'Discovery script',
      destination: 'Sales › Discovery',
      mode: 'native',
      icon: 'message-circle',
      primary: true,
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'sales.proposal',
      description: 'Eight-question discovery script tuned to the ICP.',
      requiresOps: ['strategy.define-icp', 'strategy.define-positioning'],
      requiresLabels: ['ICP', 'Positioning'],
      requires: [
        {
          id: 'req-disc-goal',
          kind: 'question',
          prompt: "What is the primary goal of the discovery call?",
          options: [
            { label: 'Qualify fit', value: 'qualify', primary: true },
            { label: 'Understand pain deeply', value: 'understand-pain' },
            { label: 'Scope a pilot', value: 'scope-pilot' },
            { label: 'Map decision process', value: 'decision-map' },
          ],
        },
        {
          id: 'req-disc-next-step',
          kind: 'question',
          prompt: "What should happen right after the call?",
          options: [
            { label: 'Demo', value: 'demo' },
            { label: 'Pilot', value: 'pilot' },
            { label: 'Intro to a decision-maker', value: 'intro' },
            { label: 'Send proposal', value: 'proposal', primary: true },
          ],
        },
        {
          id: 'req-disc-unknown',
          kind: 'question',
          prompt: "What is the one thing you most need to learn on this call?",
          freeText: true,
        },
        {
          id: 'req-disc-objection',
          kind: 'question',
          prompt: "What objection do you hear most often, and how do you handle it?",
          freeText: true,
        },
      ],
    },
    {
      id: 'sales.draft-outreach-sequence',
      verb: 'Draft outreach sequence',
      renderType: 'report',
      tier: 'primary',
      produces: 'Outreach sequence',
      destination: 'Sales › Outreach',
      mode: 'native',
      icon: 'send',
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'sales.proposal',
      description: 'Three-touch cold sequence for the primary segment.',
      requiresOps: ['strategy.define-icp'],
      requiresLabels: ['ICP'],
      requires: [
        {
          id: 'req-out-touches',
          kind: 'question',
          prompt: "How many touches in the sequence?",
          options: [
            { label: '3 touches', value: '3', primary: true },
            { label: '4 touches', value: '4' },
            { label: '5+ touches', value: '5-plus' },
          ],
        },
        {
          id: 'req-out-channel',
          kind: 'question',
          prompt: "What channel mix?",
          options: [
            { label: 'Email only', value: 'email' },
            { label: 'LinkedIn only', value: 'linkedin' },
            { label: 'Email + LinkedIn', value: 'both', primary: true },
          ],
        },
        {
          id: 'req-out-icp-signal',
          kind: 'question',
          prompt: "What is the specific trigger or signal that makes someone a fit right now?",
          freeText: true,
        },
        {
          id: 'req-out-proof',
          kind: 'question',
          prompt: "What proof point or reference customer can you lead with?",
          freeText: true,
        },
      ],
    },
    {
      id: 'sales.share-proposal',
      verb: 'Share proposal',
      renderType: 'markdown',
      tier: 'primary',
      produces: 'Proposal',
      destination: 'Sales › Proposal',
      mode: 'native',
      icon: 'share',
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'sales.proposal',
      description: 'Generates a shareable proposal page with pricing and terms.',
      requiresOps: ['strategy.draft-pricing-model'],
      requiresLabels: ['Pricing'],
      requires: [
        {
          id: 'req-prop-client',
          kind: 'question',
          prompt: "Who is the client, and what is the specific problem they are trying to solve?",
          freeText: true,
        },
        {
          id: 'req-prop-scope',
          kind: 'question',
          prompt: "What is included in the scope of work?",
          freeText: true,
        },
        {
          id: 'req-prop-investment',
          kind: 'question',
          prompt: "What is the total investment?",
          options: [
            { label: 'Under $5k', value: 'under-5k' },
            { label: '$5k-$20k', value: '5k-20k' },
            { label: '$20k-$50k', value: '20k-50k', primary: true },
            { label: '$50k+', value: '50k-plus' },
          ],
        },
        {
          id: 'req-prop-payment',
          kind: 'question',
          prompt: "Payment schedule preference?",
          options: [
            { label: 'Upfront', value: 'upfront' },
            { label: '50/50', value: '50-50', primary: true },
            { label: 'Milestone-based', value: 'milestones' },
          ],
        },
      ],
    },
    {
      id: 'sales.summarize-call',
      verb: 'Summarize call',
      renderType: 'report',
      tier: 'secondary',
      produces: 'Call summary',
      destination: 'Sales › Pipeline',
      mode: 'native',
      icon: 'file-text',
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'sales.proposal',
      description: 'Turn a discovery call into a structured summary with next step.',
      requires: [
        {
          id: 'req-sum-paste',
          kind: 'question',
          prompt: "Paste the call notes or transcript.",
          freeText: true,
        },
        {
          id: 'req-sum-stage',
          kind: 'question',
          prompt: "What stage is this deal in?",
          options: [
            { label: 'Discovery', value: 'discovery', primary: true },
            { label: 'Demo / scoping', value: 'demo' },
            { label: 'Negotiation', value: 'negotiation' },
            { label: 'Post-pilot', value: 'pilot' },
          ],
        },
        {
          id: 'req-sum-temperature',
          kind: 'question',
          prompt: "How warm is this lead?",
          options: [
            { label: 'Hot — moving fast', value: 'hot', primary: true },
            { label: 'Warm — progressing', value: 'warm' },
            { label: 'Cold — need to re-engage', value: 'cold' },
          ],
        },
        {
          id: 'req-sum-decision-maker',
          kind: 'question',
          prompt: "Who is the decision-maker, and are they in the loop?",
          freeText: true,
        },
      ],
    },
    {
      id: 'sales.send-outreach-sequence',
      verb: 'Send outreach sequence',
      renderType: 'operational',
      tier: 'secondary',
      produces: 'Sent emails',
      destination: 'Sales › Outreach',
      mode: 'connected',
      connector: 'gmail',
      icon: 'send',
      agentMethod: 'runOp',
      expectedOutputKind: 'email_batch',
      description: 'Sends the outreach sequence to a recipient list through Gmail.',
      requiresOps: ['sales.draft-outreach-sequence'],
      requiresLabels: ['Sequence'],
    },
    {
      id: 'sales.book-calls',
      verb: 'Book calls',
      renderType: 'operational',
      tier: 'secondary',
      produces: 'Calendar event',
      destination: 'Sales › Pipeline',
      mode: 'connected',
      connector: 'calendar',
      icon: 'calendar',
      agentMethod: 'runOp',
      expectedOutputKind: 'action',
      description: 'Creates a discovery call event on your calendar.',
      requiresOps: ['sales.generate-discovery-script'],
      requiresLabels: ['Discovery script'],
requires: [
        {
          id: 'req-sum-paste',
          kind: 'question',
          prompt: 'Paste the call notes or transcript.',
          freeText: true,
        },
        {
          id: 'req-sum-stage',
          kind: 'question',
          prompt: 'What stage is this deal in?',
          options: [
            { label: 'Discovery', value: 'discovery', primary: true },
            { label: 'Demo / scoping', value: 'demo' },
            { label: 'Negotiation', value: 'negotiation' },
            { label: 'Post-pilot', value: 'pilot' },
          ],
        },
        {
          id: 'req-sum-temperature',
          kind: 'question',
          prompt: 'How warm is this lead?',
          options: [
            { label: 'Hot — moving fast', value: 'hot', primary: true },
            { label: 'Warm — progressing', value: 'warm' },
            { label: 'Cold — need to re-engage', value: 'cold' },
          ],
        },
        {
          id: 'req-sum-decision-maker',
          kind: 'question',
          prompt: 'Who is the decision-maker, and are they in the loop?',
          freeText: true,
        },
      ],
    },
  ],

  /* ═══════════════ GROWTH — 2 ═══════════════ */
  growth: [
    {
      id: 'growth.design-experiment',
      verb: 'Design experiment',
      renderType: 'report',
      tier: 'primary',
      produces: 'Experiment',
      destination: 'Growth › Experiments',
      mode: 'native',
      icon: 'play',
      primary: true,
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'gtm.plan',
      description: 'Define an A/B test with hypothesis, variants, and success metric.',
      requiresOps: ['gtm.define-segments'],
      requiresLabels: ['Segments'],
      requires: [
        {
          id: 'req-exp-hypothesis',
          kind: 'question',
          prompt: "What is your hypothesis? (if we change X, metric Y will move because Z)",
          freeText: true,
        },
        {
          id: 'req-exp-metric',
          kind: 'question',
          prompt: "What is the primary success metric?",
          options: [
            { label: "Conversion rate", value: 'conversion', primary: true },
            { label: "Activation rate", value: 'activation' },
            { label: "Retention", value: 'retention' },
            { label: "Revenue per user", value: 'revenue' },
            { label: "Other — describe", value: 'other' },
          ],
        },
        {
          id: 'req-exp-baseline',
          kind: 'question',
          prompt: "What is the current baseline for that metric, and how big a lift would matter?",
          freeText: true,
        },
        {
          id: 'req-exp-guardrail',
          kind: 'question',
          prompt: "What metric must NOT get worse during the test?",
          freeText: true,
        },
      ],
    },
    {
      id: 'growth.draft-retention-plan',
      verb: 'Draft retention plan',
      renderType: 'report',
      tier: 'primary',
      produces: 'Retention plan',
      destination: 'Growth › Retention',
      mode: 'native',
      icon: 'trending-up',
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'gtm.plan',
      description: 'Plan to lift retention by specific intervention.',
      requiresOps: ['growth.design-experiment'],
      requiresLabels: ['Experiment'],
      requires: [
        {
          id: 'req-ret-current',
          kind: 'question',
          prompt: "What is your current retention at D30, M3, or M6?",
          freeText: true,
        },
        {
          id: 'req-ret-churn-cause',
          kind: 'question',
          prompt: "Why do users leave today? (your best guess)",
          freeText: true,
        },
        {
          id: 'req-ret-lever',
          kind: 'question',
          prompt: "Which lever are you most willing to pull?",
          options: [
            { label: "Onboarding", value: 'onboarding', primary: true },
            { label: "Product depth", value: 'product-depth' },
            { label: "Notifications / nudges", value: 'notifications' },
            { label: "Pricing / commitment", value: 'pricing' },
            { label: "Support / success", value: 'support' },
          ],
        },
        {
          id: 'req-ret-tried',
          kind: 'question',
          prompt: "What retention intervention have you already tried, and how did it go?",
          freeText: true,
        },
      ],
    },
  ],

    /* ═══════════════ FUNDING — 8 ═══════════════ */
  funding: [
    {
      id: 'funding.build-pitch-deck',
      verb: 'Build pitch deck',
      renderType: 'deck',
      tier: 'primary',
      produces: 'Pitch deck',
      destination: 'Funding › Deck',
      mode: 'native',
      icon: 'sparkles',
      primary: true,
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'strategy.brief',
      description: '10-12 slide investor narrative — problem, wedge, market, traction, ask.',
      requiresOps: ['strategy.define-positioning'],
      requiresLabels: ['Positioning'],
    },
    {
      id: 'funding.draft-one-pager',
      verb: 'Draft one-pager',
      renderType: 'markdown',
      tier: 'primary',
      produces: 'One-pager',
      destination: 'Funding › One-pager',
      mode: 'native',
      icon: 'file-text',
      primary: true,
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'strategy.brief',
      description: 'Compressed executive summary — problem, solution, market, team, ask.',
      requires: [
        {
          id: 'req-1p-round',
          kind: 'question',
          prompt: "How much are you raising and at what stage?",
          freeText: true,
        },
        {
          id: 'req-1p-traction',
          kind: 'question',
          prompt: "What is your single strongest traction number?",
          freeText: true,
        },
        {
          id: 'req-1p-why-now',
          kind: 'question',
          prompt: "What market shift makes this the right moment?",
          freeText: true,
        },
        {
          id: 'req-1p-use-of-funds',
          kind: 'question',
          prompt: "What will you use the capital for?",
          options: [
            { label: "Hire 2-3 engineers", value: 'engineering' },
            { label: "Go-to-market", value: 'gtm' },
            { label: "R&D / product", value: 'rnd' },
            { label: "Mixed — mostly team + GTM", value: 'mixed', primary: true },
          ],
        },
      ],
    },
    {
      id: 'funding.build-financial-model',
      verb: 'Build financial model',
      renderType: 'sheet',
      tier: 'primary',
      produces: 'Financial model',
      destination: 'Funding › Model',
      mode: 'native',
      icon: 'bar-chart',
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'strategy.brief',
      description: '3-year projection with revenue, costs, and runway assumptions.',
    },
    {
      id: 'funding.prepare-investor-faq',
      verb: 'Prepare investor FAQ',
      renderType: 'markdown',
      tier: 'secondary',
      produces: 'Investor FAQ',
      destination: 'Funding › FAQ',
      mode: 'native',
      icon: 'message-circle',
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'strategy.brief',
      description: 'The 15 hard questions an investor will ask, with drafted answers.',
      requires: [
        {
          id: 'req-faq-hardest',
          kind: 'question',
          prompt: "What is the hardest question an investor has asked you?",
          freeText: true,
        },
        {
          id: 'req-faq-stage',
          kind: 'question',
          prompt: "What stage are you raising at?",
          options: [
            { label: "Pre-seed", value: 'pre-seed', primary: true },
            { label: "Seed", value: 'seed' },
            { label: "Series A", value: 'series-a' },
          ],
        },
        {
          id: 'req-faq-uncertainty',
          kind: 'question',
          prompt: "What is the biggest thing you genuinely don't know yet?",
          freeText: true,
        },
        {
          id: 'req-faq-competitor',
          kind: 'question',
          prompt: "Who is your strongest competitor, and why do you win?",
          freeText: true,
        },
      ],
    },
    {
      id: 'funding.build-target-list',
      verb: 'Build target list',
      renderType: 'report',
      tier: 'secondary',
      produces: 'Investor targets',
      destination: 'Funding › Targets',
      mode: 'native',
      icon: 'users',
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'strategy.brief',
      description: 'Named investors matched to thesis, stage, and sector.',
      requires: [
        {
          id: 'req-tl-check',
          kind: 'question',
          prompt: "What check size are you targeting?",
          options: [
            { label: "Under $100k", value: 'under-100k' },
            { label: "$100k-$500k", value: '100k-500k' },
            { label: "$500k-$2M", value: '500k-2m', primary: true },
            { label: "$2M+", value: '2m-plus' },
          ],
        },
        {
          id: 'req-tl-sector',
          kind: 'question',
          prompt: "What sector or thesis focus should the investors align with?",
          freeText: true,
        },
        {
          id: 'req-tl-geo',
          kind: 'question',
          prompt: "What geography matters?",
          options: [
            { label: "US only", value: 'us', primary: true },
            { label: "North America", value: 'na' },
            { label: "Global", value: 'global' },
            { label: "Specific region — describe", value: 'other' },
          ],
        },
        {
          id: 'req-tl-warm',
          kind: 'question',
          prompt: "Any warm intros you already have into investors?",
          freeText: true,
        },
      ],
    },
    {
      id: 'funding.draft-investor-update',
      verb: 'Draft investor update',
      renderType: 'markdown',
      tier: 'secondary',
      produces: 'Investor update',
      destination: 'Funding › Updates',
      mode: 'native',
      icon: 'mail',
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'strategy.brief',
      description: 'Monthly investor letter — metrics, highlights, asks.',
      requires: [
        {
          id: 'req-upd-period',
          kind: 'question',
          prompt: "What period does this update cover? (e.g. October 2026)",
          freeText: true,
        },
        {
          id: 'req-upd-win',
          kind: 'question',
          prompt: "What was the single biggest win this period?",
          freeText: true,
        },
        {
          id: 'req-upd-miss',
          kind: 'question',
          prompt: "What went wrong or fell behind?",
          freeText: true,
        },
        {
          id: 'req-upd-ask',
          kind: 'question',
          prompt: "What do you need help with?",
          freeText: true,
        },
      ],
    },
    {
      id: 'funding.outreach-investors',
      verb: 'Outreach investors',
      renderType: 'operational',
      tier: 'secondary',
      produces: 'Investor emails',
      destination: 'Funding › Outreach',
      mode: 'connected',
      connector: 'gmail',
      icon: 'send',
      agentMethod: 'runOp',
      expectedOutputKind: 'email_batch',
      description: 'Cold outreach batch to target investors.',
      requiresOps: ['funding.build-target-list'],
      requiresLabels: ['Targets'],
    },
    {
      id: 'funding.prepare-data-room',
      verb: 'Prepare data room',
      renderType: 'report',
      tier: 'secondary',
      produces: 'Diligence checklist',
      destination: 'Funding › Data room',
      mode: 'native',
      icon: 'file-text',
      agentMethod: 'runOp',
      expectedOutputKind: 'snapshot',
      surfaceId: 'strategy.brief',
      description: 'Diligence checklist + index of files a VC will request.',
      requires: [
        {
          id: 'req-dr-stage',
          kind: 'question',
          prompt: "What stage of raise is this data room for?",
          options: [
            { label: "Pre-seed", value: 'pre-seed', primary: true },
            { label: "Seed", value: 'seed' },
            { label: "Series A", value: 'series-a' },
            { label: "Later", value: 'later' },
          ],
        },
        {
          id: 'req-dr-status',
          kind: 'question',
          prompt: "How much is already assembled?",
          options: [
            { label: "Nothing yet", value: 'none' },
            { label: "Some docs scattered", value: 'scattered', primary: true },
            { label: "Most docs collected", value: 'most' },
            { label: "All docs in one place", value: 'ready' },
          ],
        },
        {
          id: 'req-dr-jurisdiction',
          kind: 'question',
          prompt: "What jurisdiction is the entity registered in?",
          freeText: true,
        },
        {
          id: 'req-dr-concern',
          kind: 'question',
          prompt: "Any known gap or concern an investor will flag?",
          freeText: true,
        },
      ],
    },
  ],
};

/* ---------- Lookups ---------- */
export function getActionsForPage(pageKey: string): ActionDef[] {
  return REGISTRY[pageKey as VenturePageKey] ?? [];
}

export function getActionDef(actionDefId: string): ActionDef | undefined {
  for (const list of Object.values(REGISTRY)) {
    const found = list?.find((a) => a.id === actionDefId);
    if (found) return found;
  }
  for (const list of Object.values(EXTRA_OPS)) {
    const found = list?.find((a) => a.id === actionDefId);
    if (found) return found;
  }
  return undefined;
}

export function getActionDefs(actionIds: string[]): ActionDef[] {
  return actionIds
    .map((id) => getActionDef(id))
    .filter((d): d is ActionDef => Boolean(d));
}
