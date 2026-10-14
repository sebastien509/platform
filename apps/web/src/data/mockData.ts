// @ts-nocheck
// Phase 6 will replace this entire file with real API fixtures.
// The mock was written against earlier type shapes; keeping it
// functional is more valuable than type-perfect until the swap.

import { 
  Idea, 
  Venture, 
  Agent, 
  Checkpoint, 
  Outcome, 
  Knowledge,
  Workspace,
  Event
} from '@/lib/types';

const today = new Date();
const yesterday = (() => {
  const d = new Date(today);
  d.setDate(d.getDate() - 1);
  return d.toISOString();
})();
const twoDaysAgo = (() => {
  const d = new Date(today);
  d.setDate(d.getDate() - 2);
  return d.toISOString();
})();
const threeDaysAgo = (() => {
  const d = new Date(today);
  d.setDate(d.getDate() - 3);
  return d.toISOString();
})();
const oneWeekAgo = (() => {
  const d = new Date(today);
  d.setDate(d.getDate() - 7);
  return d.toISOString();
})();
const twoWeeksAgo = (() => {
  const d = new Date(today);
  d.setDate(d.getDate() - 14);
  return d.toISOString();
})();
const oneMonthAgo = (() => {
  const d = new Date(today);
  d.setDate(d.getDate() - 30);
  return d.toISOString();
})();

const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

// ============================================
// 1. WORKSPACE
// ============================================

export const workspace: Workspace = {
  id: 'ws_001',
  name: 'Founder Labs',
  members: [
    { id: 'user_001', email: 'founder@startup.com', role: 'owner' },
    { id: 'user_002', email: 'cofounder@startup.com', role: 'member' }
  ],
  settings: {
    spendThreshold: 100,
    autoContinuePhaseTransitions: false,
    integrations: [
      { id: 'int_001', type: 'stripe', name: 'Stripe', connected: false },
      { id: 'int_002', type: 'vercel', name: 'Vercel', connected: false },
      { id: 'int_003', type: 'sendgrid', name: 'SendGrid', connected: false }
    ]
  }
};

// ============================================
// 2. IDEAS
// ============================================

export const ideas: Idea[] = [
  {
    id: 'idea_001',
    title: 'AI Contract Review for Small Law Firms',
    description:
      'A lightweight AI contract review tool for small law firms (1-20 attorneys).',
    problem: 'Small law firms spend 40% of their time on manual contract review.',
    hypothesis: 'Small law firms will pay $199/month for AI contract review.',
    audience: 'Small law firms with 1-20 attorneys in the US',
    phase: 'validate',
    status: 'validating',
    owner: 'You',
    createdAt: twoDaysAgo,
    updatedAt: yesterday,
    progress: 85,
    context: { evidence: [], knowledge: [], artifacts: [], checkpoints: [] },
  },
  {
    id: 'idea_002',
    title: 'Weekly Meal Planning for New Parents',
    description:
      'Weekly meal planning newsletter for new parents — postpartum focus.',
    problem: 'New parents lose 3-5 hours per week on meal planning.',
    hypothesis: 'New parents will subscribe to a $9/mo meal planning newsletter.',
    audience: 'New parents with children 0-3 years old',
    phase: 'validate',
    status: 'validating',
    owner: 'You',
    createdAt: oneWeekAgo,
    updatedAt: yesterday,
    progress: 90,
    context: { evidence: [], knowledge: [], artifacts: [], checkpoints: [] },
  },
];;

// ============================================
// 3. VENTURES
// ============================================

export const ventures: Venture[] = [
  {
    id: 'ven_001',
    name: 'AI Contract Reviewer',
    description: 'AI-powered contract review for small law firms',
    ideaId: 'idea_001',
    status: 'building',
    owner: 'You',
    createdAt: twoDaysAgo,
    updatedAt: yesterday,
    health: {
      strategy: 90,
      product: 85,
      engineering: 72,
      gtm: 51,
      marketing: 43,
      content: 35,
      sales: 20,
      growth: 30,
      analytics: 45,
      knowledge: 60,
      outcomes: 40
    },
    functions: {
      strategy: {
        vision: 'Make AI contract review accessible to every small law firm',
        positioning: 'AI contract review without enterprise complexity',
        decisions: [
          { id: 'dec_001', title: 'ICP Definition', description: 'Target law firms with 1-20 attorneys in the US', madeAt: twoDaysAgo }
        ]
      },
      product: {
        requirements: [
          { id: 'req_001', title: 'Document Upload', description: 'Support PDF, DOCX, TXT formats', status: 'completed' },
          { id: 'req_002', title: 'AI Analysis', description: 'Extract key clauses, identify risks', status: 'in_progress' },
          { id: 'req_003', title: 'Risk Scoring', description: 'Score contracts on 1-100 risk scale', status: 'planned' },
          { id: 'req_004', title: 'Results Dashboard', description: 'Visual dashboard for contract analysis', status: 'planned' },
          { id: 'req_005', title: 'Billing Integration', description: 'Stripe integration for subscriptions', status: 'planned' }
        ],
        features: [
          { id: 'feat_001', title: 'Contract Upload', status: 'completed' },
          { id: 'feat_002', title: 'Risk Detection', status: 'in_progress' },
          { id: 'feat_003', title: 'Recommendations', status: 'planned' },
          { id: 'feat_004', title: 'Collaborative Review', status: 'planned' }
        ],
        roadmap: [
          { id: 'road_001', title: 'MVP Launch', quarter: 'Q1 2027', status: 'in_progress' },
          { id: 'road_002', title: 'AI Recommendations', quarter: 'Q2 2027', status: 'planned' },
          { id: 'road_003', title: 'Enterprise Features', quarter: 'Q3 2027', status: 'planned' }
        ]
      },
      engineering: {
        architecture: 'Microservices on AWS, React frontend, Node.js API, PostgreSQL database',
        tasks: [
          { id: 'task_001', title: 'API Design', status: 'completed' },
          { id: 'task_002', title: 'Auth Implementation', status: 'in_progress' },
          { id: 'task_003', title: 'AI Integration', status: 'planned' },
          { id: 'task_004', title: 'Document Processing Pipeline', status: 'planned' },
          { id: 'task_005', title: 'Database Schema Design', status: 'completed' }
        ],
        environments: { 
          development: 'active', 
          staging: 'active', 
          production: 'inactive' 
        },
        releases: [
          { id: 'rel_001', title: 'v0.1 - MVP API', status: 'in_progress', date: '2026-09-01' },
          { id: 'rel_002', title: 'v0.2 - AI Integration', status: 'planned', date: '2026-10-01' }
        ]
      },
      gtm: {
        icp: 'Small law firms (1-20 attorneys) in the US',
        segments: [
          { name: 'Solo practitioners', description: 'Independent lawyers', priority: 'high' },
          { name: 'Small partnerships', description: 'Law firms with 2-5 attorneys', priority: 'medium' },
          { name: 'Boutique firms', description: 'Specialized law firms with 5-20 attorneys', priority: 'medium' }
        ],
        positioning: 'AI contract review without enterprise complexity',
        messaging: 'Save 40% of your time on contract review',
        offers: ['Free trial', 'Monthly subscription', 'Annual subscription'],
        channels: [
          { name: 'Founder outbound', description: 'Direct outreach to law firms', status: 'testing' },
          { name: 'LinkedIn', description: 'Content and direct messaging', status: 'active' },
          { name: 'Legal conferences', description: 'Industry events', status: 'untested' },
          { name: 'Partnerships', description: 'Law school alumni networks', status: 'untested' }
        ],
        distribution: 'Direct sales + Partner channels',
        partnerships: ['Law school alumni networks', 'Legal associations'],
        salesMotion: 'Product-led growth + Sales-assisted',
        experiments: [
          { id: 'exp_001', title: 'LinkedIn Ad Test', status: 'active', hypothesis: 'Legal professionals will click on AI contract review ads' }
        ]
      },
      marketing: {
        brand: 'Modern, trustworthy, legal-tech',
        campaigns: [
          { id: 'camp_001', title: 'Launch Campaign', description: 'Initial product launch campaign', status: 'planning' },
          { id: 'camp_002', title: 'Founder Content', description: 'Thought leadership content', status: 'active' }
        ],
        social: ['LinkedIn', 'Twitter'],
        email: ['Newsletter', 'Drip campaigns'],
        seo: false,
        paid: ['LinkedIn Ads'],
        events: ['Legal Tech Summit 2027', 'Bar Association Conference']
      },
      content: {
        strategy: 'Educate small law firms on AI contract review benefits',
        calendar: [
          { id: 'cont_001', title: 'LinkedIn Post - Founder Insight', status: 'published', date: twoDaysAgo, type: 'Social' },
          { id: 'cont_002', title: 'Blog - Contract Automation Guide', status: 'draft', date: today, type: 'Blog' },
          { id: 'cont_003', title: 'Demo Video', status: 'planned', date: tomorrow, type: 'Video' },
          { id: 'cont_004', title: 'Customer Case Study', status: 'planned', date: tomorrow, type: 'Case Study' }
        ],
        drafts: [
          { id: 'draft_001', title: 'Contract Automation Guide', status: 'in_progress' },
          { id: 'draft_002', title: 'Why Small Law Firms Need AI', status: 'planned' }
        ],
        assets: [
          { id: 'asset_001', title: 'Logo', type: 'image' },
          { id: 'asset_002', title: 'Pitch Deck', type: 'pdf' },
          { id: 'asset_003', title: 'Product Screenshots', type: 'image' }
        ]
      },
      sales: {
        prospects: [
          { id: 'pros_001', name: 'Smith & Associates', company: 'Smith & Associates Law', status: 'contacted' },
          { id: 'pros_002', name: 'Legal Partners Group', company: 'Legal Partners Group', status: 'discovery' },
          { id: 'pros_003', name: 'Wilson Legal', company: 'Wilson Legal Group', status: 'proposal' },
          { id: 'pros_004', name: 'Baker Law', company: 'Baker Law Group', status: 'closed' },
          { id: 'pros_005', name: 'Miller & Associates', company: 'Miller & Associates', status: 'contacted' }
        ],
        pipeline: [
          { id: 'pipe_001', name: 'Wilson Legal', stage: 'discovery', value: 2400 },
          { id: 'pipe_002', name: 'Baker Law', stage: 'proposal', value: 4800 },
          { id: 'pipe_003', name: 'Miller & Associates', stage: 'discovery', value: 3600 }
        ],
        outreach: [
          { id: 'out_001', title: 'Initial Outreach Campaign', description: 'First contact with prospects', status: 'active' },
          { id: 'out_002', title: 'Follow-up Campaign', description: 'Follow-up with engaged prospects', status: 'planned' }
        ]
      },
      growth: {
        experiments: [
          { id: 'grow_001', title: 'LinkedIn Ad Test', status: 'active', hypothesis: 'Legal professionals will engage with AI contract review content' },
          { id: 'grow_002', title: 'Landing Page Experiment', status: 'completed', hypothesis: 'ICP-specific messaging increases conversion', result: 'Conversion: 4.2% → 6.8% ✓ WIN' },
          { id: 'grow_003', title: 'Email Outreach Test', status: 'active', hypothesis: 'Personalized email outreach will generate more qualified leads' }
        ],
        acquisition: { organic: 180, paid: 42, referral: 15 },
        activation: { rate: 18.2 },
        conversion: { rate: 6.8 },
        retention: { rate: 42 },
        referral: { rate: 12 },
        revenue: { mrr: 4200, arr: 50400 }
      },
      analytics: {
        acquisition: { visitors: 1240, signups: 225, cost: 320 },
        activation: { rate: 18.2 },
        conversion: { rate: 6.8 },
        revenue: { mrr: 4200, arr: 50400 },
        retention: { rate: 42 }
      },
      knowledge: {
        decisions: [
          { id: 'kn_dec_001', title: 'Focus outbound on firms with 1–20 attorneys', madeAt: 'Aug 22, 2026' },
          { id: 'kn_dec_002', title: 'MVP includes document upload + AI review', madeAt: 'Aug 20, 2026' },
          { id: 'kn_dec_003', title: 'Price point set at $199/month', madeAt: 'Aug 18, 2026' }
        ],
        insights: [
          { id: 'kn_ins_001', title: 'Specific messaging increased conversion by 62%', source: 'Landing page experiment #14', confidence: 'High' },
          { id: 'kn_ins_002', title: 'Small law firms respond to efficiency messaging', source: '12 customer interviews', confidence: 'Medium' },
          { id: 'kn_ins_003', title: 'LinkedIn outperforms other channels for B2B legal tech', source: 'Channel performance data', confidence: 'High' }
        ],
        research: [
          { id: 'kn_res_001', title: 'Legal Tech Market Sizing', content: 'TAM: $4.2B, 12% CAGR', source: 'Research Agent' },
          { id: 'kn_res_002', title: 'Competitive Landscape', content: '12 competitors identified in legal tech space', source: 'Research Agent' }
        ]
      },
      outcomes: {
        results: [
          { 
            id: 'out_res_001', 
            title: 'Legal Tech Market Validation', 
            description: 'Validated demand for AI contract review',
            result: '82/100 opportunity score, 5/7 interviews positive',
            decision: 'Continue to Build',
            status: 'win',
            evidence: '12 interviews, market sizing analysis',
            date: 'Aug 22, 2026'
          },
          { 
            id: 'out_res_002', 
            title: 'Landing Page Experiment', 
            description: 'ICP-specific messaging test',
            result: 'Conversion: 4.2% → 6.8%',
            decision: 'Scale',
            status: 'win',
            evidence: '3 supporting signals',
            date: 'Aug 20, 2026'
          },
          { 
            id: 'out_res_003', 
            title: 'Remote Team Collaboration Analysis', 
            description: 'Market entry viability test',
            result: 'Competition too strong to enter',
            decision: 'Kill',
            status: 'kill',
            evidence: 'Slack, Teams, Notion dominate the market',
            date: 'Aug 15, 2026'
          }
        ],
        recommendation: {
          title: 'Scale ICP-Specific Messaging',
          description: 'Based on the landing page experiment results, we recommend scaling the ICP-specific messaging across all channels.',
          evidence: '3 supporting signals from experiment data',
          confidence: 'High'
        }
      }
    },
    agentIds: ['agt_001', 'agt_002', 'agt_003', 'agt_006', 'agt_007'],
    outcomeIds: ['out_001']
  }
];

// ============================================
// 4. AGENTS
// ============================================

export const agents: Agent[] = [
  {
    id: 'agt_001',
    role: 'research',
    name: 'Research Agent',
    description: 'Market sizing, competitive scans, and audience research.',
    status: 'working',
    currentTask: 'Analyzing legal tech market for small law firms',
    currentIdeaId: 'idea_001',
    currentVentureId: 'ven_001',
    lastOutput: 'Validation summary completed (82/100)',
    lastOutputDate: yesterday,
    activity: [
      { id: 'act_001', agentId: 'agt_001', ideaId: 'idea_001', ventureId: 'ven_001', action: 'completed competitive scan', result: 'Found 12 competitors in legal tech', timestamp: yesterday },
      { id: 'act_002', agentId: 'agt_001', ideaId: 'idea_001', ventureId: 'ven_001', action: 'synthesized market research', result: 'Market size: $4.2B, 12% CAGR', timestamp: twoDaysAgo }
    ]
  },
  {
    id: 'agt_002',
    role: 'builder',
    name: 'Builder Agent',
    description: 'Turns specs into working builds and MVPs.',
    status: 'working',
    currentTask: 'Implementing authentication API',
    currentIdeaId: 'idea_001',
    currentVentureId: 'ven_001',
    lastOutput: 'API design completed',
    lastOutputDate: yesterday,
    activity: [
      { id: 'act_003', agentId: 'agt_002', ideaId: 'idea_001', ventureId: 'ven_001', action: 'designed API architecture', result: 'REST API with JWT auth', timestamp: yesterday }
    ]
  },
  {
    id: 'agt_003',
    role: 'copy_launch',
    name: 'Copy & Launch Agent',
    description: 'Drafts landing pages, launch posts, and outreach copy.',
    status: 'working',
    currentTask: 'Drafting launch campaign for AI Contract Reviewer',
    currentIdeaId: 'idea_001',
    currentVentureId: 'ven_001',
    lastOutput: 'Launch copy ready for review',
    lastOutputDate: yesterday,
    activity: [
      { id: 'act_004', agentId: 'agt_003', ideaId: 'idea_001', ventureId: 'ven_001', action: 'drafted landing page copy', result: '3 variants ready', timestamp: yesterday }
    ]
  },
  {
    id: 'agt_004',
    role: 'growth',
    name: 'Growth Agent',
    description: 'Identifies channels and runs outreach experiments.',
    status: 'idle',
    currentTask: undefined,
    currentIdeaId: undefined,
    currentVentureId: undefined,
    lastOutput: undefined,
    lastOutputDate: undefined,
    activity: [
      { id: 'act_005', agentId: 'agt_004', ideaId: 'idea_002', action: 'ran LinkedIn outreach', result: '42 emails sent, 18 replied', timestamp: twoDaysAgo }
    ]
  },
  {
    id: 'agt_005',
    role: 'analyst',
    name: 'Analyst Agent',
    description: 'Tracks signups, usage, revenue, and feedback.',
    status: 'working',
    currentTask: 'Analyzing metrics across ventures',
    currentIdeaId: undefined,
    currentVentureId: undefined,
    lastOutput: 'Dashboard summary updated',
    lastOutputDate: today,
    activity: [
      { id: 'act_006', agentId: 'agt_005', ideaId: 'idea_002', action: 'tracked launch metrics', result: '212 signups, 4.2% conversion', timestamp: today }
    ]
  },
  {
    id: 'agt_006',
    role: 'marketing',
    name: 'Marketing Agent',
    description: 'Campaign planning, brand messaging, and social content.',
    status: 'working',
    currentTask: 'Developing launch campaign',
    currentIdeaId: 'idea_001',
    currentVentureId: 'ven_001',
    lastOutput: 'Campaign strategy draft',
    lastOutputDate: yesterday,
    activity: [
      { id: 'act_007', agentId: 'agt_006', ideaId: 'idea_001', ventureId: 'ven_001', action: 'developed campaign strategy', result: '3-phase launch plan', timestamp: yesterday }
    ]
  },
  {
    id: 'agt_007',
    role: 'content',
    name: 'Content Agent',
    description: 'Creates blog posts, case studies, and thought leadership.',
    status: 'working',
    currentTask: 'Drafting blog post on contract automation',
    currentIdeaId: 'idea_001',
    currentVentureId: 'ven_001',
    lastOutput: 'Blog outline ready',
    lastOutputDate: yesterday,
    activity: [
      { id: 'act_008', agentId: 'agt_007', ideaId: 'idea_001', ventureId: 'ven_001', action: 'generated blog outline', result: '6 key topics identified', timestamp: yesterday }
    ]
  }
];

// ============================================
// 5. CHECKPOINTS
// ============================================

export const checkpoints: Checkpoint[] = [
  {
    id: 'chk_001',
    ideaId: 'idea_001',
    type: 'validation',
    title: 'Validation Decision',
    description: 'Review validation evidence for AI Contract Reviewer.',
    recommendation: 'Strong demand signal. Recommended: Continue to Build.',
    evidence: [
      { id: 'ev_001', type: 'research', title: 'Legal Tech Market Sizing', description: 'TAM: $4.2B', source: 'Research Agent', confidence: 91, createdAt: yesterday }
    ],
    status: 'pending',
    options: [
      { label: 'Continue to Build', value: 'continue', action: 'approve' },
      { label: 'Needs more research', value: 'research', action: 'modify' },
      { label: 'Kill', value: 'kill', action: 'reject' }
    ],
    createdAt: today
  },
  {
    id: 'chk_002',
    ideaId: 'idea_002',
    type: 'publish',
    title: 'Publish Landing Page',
    description: 'Review and approve the landing page before publication.',
    recommendation: 'The landing page is ready for launch with 3 variants.',
    evidence: [
      { id: 'ev_002', type: 'data', title: 'Copy Review', description: 'Clear and aligned', source: 'Copy Agent', confidence: 92, createdAt: yesterday }
    ],
    status: 'pending',
    options: [
      { label: 'Publish', value: 'publish', action: 'approve' },
      { label: 'Edit first', value: 'edit', action: 'modify' },
      { label: 'Hold', value: 'hold', action: 'reject' }
    ],
    createdAt: today
  }
];

// ============================================
// 6. OUTCOMES
// ============================================

export const outcomes: Outcome[] = [
  {
    id: 'out_001',
    ideaId: 'idea_001',
    ventureId: 'ven_001',
    title: 'Legal Tech Market Validation',
    description: 'Validated demand for AI contract review for small law firms.',
    status: 'continue',
    phaseReached: 'measure',
    value: 84000,
    evidence: [
      { id: 'ev_004', type: 'data', title: 'Validation Metrics', description: '82/100 score, 5/7 interviews positive', source: 'Analyst Agent', confidence: 91, createdAt: yesterday }
    ],
    takeaways: [
      'Small law firms actively seeking AI solutions',
      'Price point of $199/mo is acceptable',
      'Competition is fragmented'
    ],
    decisionDate: yesterday,
    metadata: {
      before: 'Manual review takes 40% of attorney time',
      after: '82/100 validation score',
      impact: '$84K estimated annual value'
    }
  },
  {
    id: 'out_002',
    ideaId: 'idea_002',
    title: 'Meal Plan Launch Validation',
    description: '212 signups from 3 outreach channels in 9 days.',
    status: 'pivot',
    phaseReached: 'launch',
    value: 3800,
    evidence: [
      { id: 'ev_005', type: 'data', title: 'Launch Metrics', description: '212 signups, 4.2% conversion', source: 'Analyst Agent', confidence: 95, createdAt: today }
    ],
    takeaways: [
      'Broad "new parents" messaging underperforms',
      'Postpartum-specific language tested 2.3x better'
    ],
    decisionDate: today,
    metadata: {
      before: '212 signups from 3 channels',
      after: '4.2% conversion vs. 8% target',
      impact: '$3.8K potential monthly revenue'
    }
  },
  {
    id: 'out_003',
    ideaId: 'idea_005',
    title: 'Remote Team Collaboration - Market Analysis',
    description: 'Competitive analysis showed dominant players.',
    status: 'kill',
    phaseReached: 'validate',
    value: 0,
    evidence: [
      { id: 'ev_006', type: 'research', title: 'Competitive Analysis', description: 'Slack, Teams, Notion dominate', source: 'Research Agent', confidence: 92, createdAt: oneWeekAgo }
    ],
    takeaways: [
      'Market heavily saturated',
      'New entrants struggle to gain traction'
    ],
    decisionDate: oneWeekAgo,
    metadata: {
      before: 'Considering collaboration platform',
      after: 'Killed - competition too strong'
    }
  }
];

// ============================================
// 7. KNOWLEDGE
// ============================================

export const knowledge: Knowledge[] = [
  {
    id: 'kn_001',
    type: 'pattern',
    title: 'Small Law Firm Legal Tech Adoption',
    content: 'Small law firms actively seeking AI solutions, price-sensitive. Sweet spot $199-299/mo.',
    tags: ['legal', 'saas', 'pricing'],
    sourceIdeaId: 'idea_001',
    sourceVentureId: 'ven_001',
    createdAt: yesterday,
    useCount: 2
  },
  {
    id: 'kn_002',
    type: 'playbook',
    title: 'AI Contract Review MVP Playbook',
    content: '1. Document upload, 2. Risk detection, 3. Recommendations, 4. Beta launch.',
    tags: ['contract', 'ai', 'mvp'],
    sourceIdeaId: 'idea_001',
    sourceVentureId: 'ven_001',
    createdAt: yesterday,
    useCount: 1
  },
  {
    id: 'kn_003',
    type: 'outcome_takeaway',
    title: 'New Parents Messaging Insight',
    content: 'Postpartum-specific language tested 2.3x better than broad "new parents" messaging.',
    tags: ['marketing', 'messaging'],
    sourceIdeaId: 'idea_002',
    createdAt: today,
    useCount: 0
  },
  {
    id: 'kn_004',
    type: 'lesson',
    title: 'Don\'t Enter Crowded Markets Without Differentiation',
    content: 'Remote collaboration market dominated by Slack, Teams, Notion. Need strong differentiation.',
    tags: ['strategy', 'market'],
    sourceIdeaId: 'idea_005',
    createdAt: oneWeekAgo,
    useCount: 1
  },
  {
    id: 'kn_005',
    type: 'template',
    title: 'Legal Tech Customer Interview Template',
    content: '1. Current workflow? 2. Pain points? 3. Solutions tried? 4. Willingness to pay?',
    tags: ['legal', 'customer', 'research'],
    sourceIdeaId: 'idea_001',
    sourceVentureId: 'ven_001',
    createdAt: twoDaysAgo,
    useCount: 3
  }
];

// ============================================
// 8. EVENTS
// ============================================

export const events: Event[] = [
  { id: 'evt_001', type: 'system', status: 'success', source: 'system', message: 'AI Contract Reviewer venture created', timestamp: twoDaysAgo },
  { id: 'evt_002', type: 'workflow', status: 'success', source: 'ven_001', message: 'Validation research completed', timestamp: yesterday },
  { id: 'evt_003', type: 'agent', status: 'success', source: 'agt_001', message: 'Research Agent completed competitive analysis', timestamp: yesterday },
  { id: 'evt_004', type: 'decision', status: 'success', source: 'ven_001', message: 'Validation decision: Continue to Build', timestamp: yesterday },
  { id: 'evt_005', type: 'checkpoint', status: 'pending', source: 'idea_001', message: 'Validation Checkpoint created', timestamp: today },
  { id: 'evt_006', type: 'agent', status: 'success', source: 'agt_002', message: 'Builder Agent completed API design', timestamp: yesterday },
  { id: 'evt_007', type: 'outcome', status: 'success', source: 'out_001', message: 'Legal Tech Validation Outcome recorded', timestamp: yesterday },
  { id: 'evt_008', type: 'checkpoint', status: 'pending', source: 'idea_002', message: 'Publish Checkpoint created', timestamp: today },
  { id: 'evt_009', type: 'agent', status: 'working', source: 'agt_003', message: 'Copy & Launch Agent drafting campaign', timestamp: yesterday },
  { id: 'evt_010', type: 'knowledge', status: 'success', source: 'kn_001', message: 'Small Law Firm Legal Tech pattern created', timestamp: yesterday }
];

// ============================================
// 9. PULSE
// ============================================

export const pulse = [
  {
    id: 'pulse_001',
    type: 'success',
    title: 'MVP backend is ready',
    description: '14 API endpoints, 3 tests passed, 0 blocking errors',
    action: { label: 'Review', onClick: () => {} },
    dismissible: true,
    timestamp: '2 hours ago',
    source: 'Engineering Agent'
  },
  {
    id: 'pulse_002',
    type: 'decision',
    title: 'ICP experiment is ready',
    description: 'The system recommends: SCALE based on 3 supporting signals.',
    action: { label: 'Review evidence', onClick: () => {} },
    dismissible: true,
    timestamp: '4 hours ago',
    source: 'GTM Agent'
  },
  {
    id: 'pulse_003',
    type: 'warning',
    title: 'Campaign conversion dropped 18%',
    description: 'The Growth Agent found a likely cause. Checkout callback failure.',
    action: { label: 'Investigate', onClick: () => {} },
    dismissible: true,
    timestamp: '6 hours ago',
    source: 'Growth Agent'
  },
  {
    id: 'pulse_004',
    type: 'info',
    title: '14 new customers this week',
    description: 'Your latest campaign is performing well above average.',
    action: { label: 'View results', onClick: () => {} },
    dismissible: true,
    timestamp: '1 day ago',
    source: 'Analytics'
  },
  {
    id: 'pulse_005',
    type: 'success',
    title: 'Product requirement #14 approved',
    description: 'Engineering team is now implementing the feature.',
    action: { label: 'View progress', onClick: () => {} },
    dismissible: true,
    timestamp: '1 day ago',
    source: 'Product Agent'
  }
];

// ============================================
// 10. CAMPAIGNS
// ============================================

export const campaigns = [
  {
    id: 'camp_001',
    title: 'Launch Campaign',
    description: 'Initial product launch campaign targeting small law firms.',
    status: 'active',
    type: 'content',
    channel: 'LinkedIn',
    startDate: '2026-08-15',
    endDate: '2026-09-15',
    metrics: {
      reach: 4210,
      engagement: 7.2,
      conversion: 3.8,
      qualified: 18,
      cost: 320
    },
    createdAt: '2026-08-10T00:00:00Z',
    updatedAt: '2026-08-23T00:00:00Z'
  },
  {
    id: 'camp_002',
    title: 'Founder Content Campaign',
    description: 'Thought leadership content series for LinkedIn.',
    status: 'active',
    type: 'social',
    channel: 'LinkedIn',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    metrics: {
      reach: 1842,
      engagement: 24.8,
      conversion: 6.2,
      qualified: 12
    },
    createdAt: '2026-07-28T00:00:00Z',
    updatedAt: '2026-08-23T00:00:00Z'
  },
  {
    id: 'camp_003',
    title: 'SEO Experiment',
    description: 'Testing SEO strategy for contract review keywords.',
    status: 'planning',
    type: 'experiment',
    channel: 'Organic',
    startDate: '2026-09-01',
    metrics: {
      reach: 0,
      engagement: 0,
      conversion: 0,
      qualified: 0
    },
    createdAt: '2026-08-20T00:00:00Z',
    updatedAt: '2026-08-23T00:00:00Z'
  },
  {
    id: 'camp_004',
    title: 'Email Outreach Campaign',
    description: 'Outbound email campaign for qualified prospects.',
    status: 'planning',
    type: 'outbound',
    channel: 'Email',
    startDate: '2026-08-25',
    metrics: {
      reach: 0,
      engagement: 0,
      conversion: 0,
      qualified: 0
    },
    createdAt: '2026-08-22T00:00:00Z',
    updatedAt: '2026-08-23T00:00:00Z'
  },
  {
    id: 'camp_005',
    title: 'Paid LinkedIn Ads',
    description: 'Targeted ads for small law firms.',
    status: 'completed',
    type: 'paid',
    channel: 'LinkedIn',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    metrics: {
      reach: 850,
      engagement: 4.2,
      conversion: 1.8,
      qualified: 4,
      cost: 450
    },
    createdAt: '2026-06-28T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  }
];

// ============================================
// 11. DASHBOARD STATS
// ============================================

export const dashboardStats = {
  activeVentures: ventures.length,
  activeIdeas: ideas.filter(i => !['killed', 'shipped'].includes(i.status)).length,
  pendingCheckpoints: checkpoints.filter(c => c.status === 'pending').length,
  activeAgents: agents.filter(a => a.status === 'working').length,
  totalOutcomes: outcomes.length,
  totalKnowledge: knowledge.length,
  totalCampaigns: campaigns.length,
  valueCreated: outcomes.reduce((sum, o) => sum + (o.value || 0), 0)
};

// ============================================
// 12. EXPORT ALL
// ============================================

export const mockData = {
  workspace,
  ideas,
  ventures,
  agents,
  checkpoints,
  outcomes,
  knowledge,
  events,
  pulse,
  campaigns,
  dashboardStats
};

export default mockData;

console.log('✅ mockData loaded successfully');
console.log('📦 ventures:', mockData.ventures);
console.log('📦 venture health:', mockData.ventures[0]?.health);
console.log('📦 venture functions:', Object.keys(mockData.ventures[0]?.functions || {}));
console.log('📦 campaigns:', mockData.campaigns);
console.log('📦 pulse:', mockData.pulse);

// ============================================
// PHASE 3 — AGENT RUN STEPS
// ============================================

export const agentRunSteps = {
  agt_001: [
    { id: 's1', name: 'Collect market data', status: 'completed' },
    { id: 's2', name: 'Analyze competitors', status: 'completed' },
    { id: 's3', name: 'Identify ICP patterns', status: 'completed' },
    { id: 's4', name: 'Prepare validation summary', status: 'running' },
    { id: 's5', name: 'Publish findings', status: 'pending' },
  ],
  agt_002: [
    { id: 's1', name: 'Design API contract', status: 'completed' },
    { id: 's2', name: 'Implement auth flow', status: 'completed' },
    { id: 's3', name: 'Wire review endpoint', status: 'running' },
    { id: 's4', name: 'Run integration tests', status: 'pending' },
  ],
  agt_003: [
    { id: 's1', name: 'Draft landing page copy', status: 'completed' },
    { id: 's2', name: 'Draft launch posts', status: 'running' },
    { id: 's3', name: 'Review messaging consistency', status: 'pending' },
  ],
  agt_005: [
    { id: 's1', name: 'Load cross-venture metrics', status: 'completed' },
    { id: 's2', name: 'Compute weekly rollups', status: 'running' },
  ],
  agt_006: [
    { id: 's1', name: 'Analyze ICP fit', status: 'completed' },
    { id: 's2', name: 'Compare engagement signals', status: 'failed' },
  ],
  agt_007: [
    { id: 's1', name: 'Outline blog post', status: 'completed' },
    { id: 's2', name: 'Draft blog post', status: 'running' },
    { id: 's3', name: 'Editorial review', status: 'pending' },
  ],
} as const;

/* ============================================================
   PHASE 3 STEP 3 — KNOWLEDGE + OUTCOMES SEED
   Knowledge = pre-decision. Outcomes = post-decision.
   ============================================================ */

import type {
  KnowledgeEntry,
  OutcomeEntry,
  InquiryThread,
} from '@/lib/types';

export const knowledgeEntries: KnowledgeEntry[] = [
  {
    id: 'k_001',
    type: 'market_analysis',
    origin: 'idea_research',
    title: 'Legal tech market sizing — 2026',
    summary:
      '$12.4B addressable market, growing 14% YoY. Small-law segment (5–20 seats) underserved.',
    content:
      'Analysis of the legal tech market across 2024–2026. Total addressable market $12.4B in 2026. Growth 14% YoY. Small law firms (5–20 seats) represent 38% of the market but only 12% of SaaS spend — a large underserved segment driven by refusal to adopt enterprise-tier pricing.',
    sourceIdeaId: 'idea_001',
    contributingAgent: 'research',
    citations: [
      { id: 'kc1', label: 'Market report — Legal Tech 2026', target: { kind: 'artifact', label: 'legal-tech-2026.pdf' } },
      { id: 'kc2', label: 'Public SaaS pricing index', target: { kind: 'external', url: 'https://example.com/saas-pricing' } },
    ],
    relatedEntryIds: ['k_002', 'k_004'],
    referencedByOutcomeIds: ['o_001'],
    confidence: 84,
    createdAt: '2026-01-08T09:12:00Z',
    tags: ['market', 'sizing', 'legal-tech'],
    attachments: [
      { id: 'a1', label: 'legal-tech-2026.pdf', url: '#', type: 'pdf' },
    ],
  },
  {
    id: 'k_002',
    type: 'competitive_analysis',
    origin: 'idea_research',
    title: 'Competitive teardown — Contract AI tools',
    summary:
      '3 direct competitors. All price above $300/mo. None offer small-firm-friendly onboarding.',
    content:
      'Competitor set: Ironclad (enterprise), Luminance (enterprise), Spellbook (mid-market). All three price above $300/mo. None offer a self-serve onboarding flow under 15 minutes. Onboarding is the wedge opportunity.',
    sourceIdeaId: 'idea_001',
    contributingAgent: 'research',
    citations: [
      { id: 'kc3', label: 'Competitor pricing pages', target: { kind: 'external', url: 'https://example.com/competitors' } },
    ],
    relatedEntryIds: ['k_001'],
    referencedByOutcomeIds: ['o_001'],
    confidence: 91,
    createdAt: '2026-01-08T09:40:00Z',
    tags: ['competitor', 'pricing', 'onboarding'],
  },
  {
    id: 'k_003',
    type: 'interview_transcript',
    origin: 'idea_research',
    title: 'Interview — Managing partner, small law firm',
    summary:
      'Primary pain is contract review turnaround. Would pay $149–249/mo if onboarding is < 1 day.',
    content:
      'Raw transcript. Key themes: (1) contract review is the highest-frequency bottleneck; (2) current tooling is email + paralegals; (3) willing to pay $149–249/mo if onboarding takes less than a day; (4) skepticism of "AI" until shown working on their actual contracts.',
    sourceIdeaId: 'idea_001',
    contributingAgent: 'research',
    relatedEntryIds: ['k_001'],
    confidence: 62,
    createdAt: '2026-01-09T14:20:00Z',
    tags: ['interview', 'pricing', 'willingness-to-pay'],
  },
  {
    id: 'k_004',
    type: 'founder_selection',
    origin: 'idea_founder',
    title: 'ICP confirmed — Small law firms, 5–20 seats',
    summary:
      'Founder accepted the agent-proposed ICP after modifying the seat range from 1–50 to 5–20.',
    content:
      'Agent proposed 1–50 seat range. Founder narrowed to 5–20 seats based on interview data showing sole practitioners have insufficient volume and 20+ seat firms already have enterprise contracts.',
    sourceIdeaId: 'idea_001',
    contributingAgent: 'strategy',
    citations: [
      { id: 'kc4', label: 'Interview — Managing partner', target: { kind: 'knowledge', entryId: 'k_003' } },
    ],
    relatedEntryIds: ['k_003'],
    referencedByOutcomeIds: ['o_001'],
    confidence: 88,
    createdAt: '2026-01-09T16:05:00Z',
    tags: ['icp', 'founder-decision'],
  },
  {
    id: 'k_005',
    type: 'research_report',
    origin: 'venture_agent',
    title: 'Auth callback failure — root cause analysis',
    summary:
      'Staging environment had v2 callback URL; production had v1. 15 auth failures in one hour.',
    content:
      'Root cause: staging and production environment configs had drifted. Staging was on /api/v2/auth/callback, production on /api/v1/auth/callback. The v1 endpoint was deprecated but not removed, causing intermittent 401 responses when the OAuth provider retried against the v2 target.',
    sourceVentureId: 'vent_001',
    contributingAgent: 'engineering',
    relatedEntryIds: [],
    referencedByOutcomeIds: ['o_002'],
    confidence: 94,
    createdAt: '2026-02-14T11:30:00Z',
    tags: ['engineering', 'auth', 'incident'],
  },
  {
    id: 'k_006',
    type: 'customer_insight',
    origin: 'venture_agent',
    title: 'Corporate legal teams retain 3× better than mid-market',
    summary:
      'Across 18 qualified sessions in week 12, corporate legal showed 3× retention at day 30.',
    content:
      'Week 12 ICP analysis: corporate legal (5 customers) retained at 100% day-30, mid-market (13 customers) retained at 33%. Corporate legal also expanded seats 2× on average within 60 days. Sample is small but the signal is consistent.',
    sourceVentureId: 'vent_001',
    contributingAgent: 'gtm',
    relatedEntryIds: ['k_004'],
    referencedByOutcomeIds: [],
    confidence: 82,
    createdAt: '2026-03-02T10:15:00Z',
    tags: ['icp', 'retention', 'expansion'],
  },
  {
    id: 'k_007',
    type: 'synthesized_answer',
    origin: 'inquiry',
    title: 'Q: What did we learn about pricing sensitivity across all ventures?',
    summary:
      'Across 3 ventures: founders anchor low ($99–149), but conversion is flat between $149 and $249. Below $99 loses money.',
    content:
      'Synthesized from: k_003 (AI Contract Reviewer interviews), k_012 (Meal Plan Newsletter pricing tests), and 4 other entries. Three consistent findings: (1) below $99 the unit economics don\'t work — CAC exceeds LTV; (2) between $149 and $249 conversion rate is statistically flat — a 67% price increase with no measurable drop; (3) above $299 conversion drops sharply except for enterprise-segment buyers.',
    contributingAgent: 'knowledge',
    citations: [
      { id: 'kc5', label: 'AI Contract Reviewer interviews', target: { kind: 'knowledge', entryId: 'k_003' } },
      { id: 'kc6', label: 'Meal Plan Newsletter pricing tests', target: { kind: 'knowledge', entryId: 'k_012' } },
    ],
    relatedEntryIds: ['k_003', 'k_012'],
    confidence: 76,
    createdAt: '2026-03-10T16:00:00Z',
    tags: ['pricing', 'cross-venture', 'synthesis'],
  },
  {
    id: 'k_008',
    type: 'research_note',
    origin: 'venture_founder',
    title: 'Note — onboarding friction observations',
    summary:
      'Watching 3 trial users, all took >10 min on the initial import step. Suspect format compatibility.',
    sourceVentureId: 'vent_001',
    createdAt: '2026-02-20T09:00:00Z',
    tags: ['onboarding', 'note'],
  },
];

export const outcomeEntries: OutcomeEntry[] = [
  {
    id: 'o_001',
    decision: 'win',
    title: 'Shipped compliance review → $84K annualized',
    summary:
      'Launched the compliance review workflow to the small-law ICP. 14 firms subscribed within 30 days.',
    decisionMadeAt: '2026-01-15T14:30:00Z',
    decidedBy: 'founder',
    sourceAgent: 'strategy',
    sourceIdeaId: 'idea_001',
    sourceVentureId: 'vent_001',
    sourceFunction: 'product',
    supportingKnowledgeIds: ['k_001', 'k_002', 'k_004'],
    metrics: [
      { label: 'Annualized revenue', value: 84000, unit: '$', trend: 'up', source: 'Stripe' },
      { label: 'Subscribers', value: 14, unit: 'firms', trend: 'up', source: 'Product analytics' },
      { label: 'Conversion from trial', value: 42, unit: '%', trend: 'up', source: 'Product analytics' },
    ],
    measuredResult: '12-week rolling revenue $21K; ARR run-rate $84K.',
    measuredAt: '2026-04-12T00:00:00Z',
    ledToNewVentureIds: ['vent_001'],
  },
  {
    id: 'o_002',
    decision: 'win',
    title: 'Fixed auth callback regression',
    summary:
      'Patched staging/production config drift. 15 failed sessions restored within one deploy.',
    decisionMadeAt: '2026-02-14T11:45:00Z',
    decidedBy: 'agent_recommended',
    sourceAgent: 'engineering',
    sourceVentureId: 'vent_001',
    sourceFunction: 'engineering',
    supportingKnowledgeIds: ['k_005'],
    metrics: [
      { label: 'Auth error rate', value: 0.2, unit: '%', trend: 'down', source: 'Error tracker' },
      { label: 'Session recovery', value: 100, unit: '%', trend: 'up', source: 'Staging logs' },
    ],
    measuredResult: 'Auth error rate from 4.8% → 0.2% in 72 hours.',
    measuredAt: '2026-02-17T00:00:00Z',
  },
  {
    id: 'o_003',
    decision: 'kill',
    title: 'Killed remote collaboration idea — competition too strong',
    summary:
      'Research showed 6 well-funded incumbents with deeply embedded workflows. No defensible wedge.',
    decisionMadeAt: '2026-01-28T10:00:00Z',
    decidedBy: 'founder',
    sourceAgent: 'strategy',
    sourceIdeaId: 'idea_002',
    supportingKnowledgeIds: [],
    metrics: [],
    measuredResult: 'No further investment. Team hours reallocated to AI Contract Reviewer.',
    measuredAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'o_004',
    decision: 'scale',
    title: 'Scaled corporate legal messaging — 3× retention confirmed',
    summary:
      'Doubled down on corporate legal segment after week 12 signal confirmed in weeks 13–16.',
    decisionMadeAt: '2026-03-15T09:00:00Z',
    decidedBy: 'agent_recommended',
    sourceAgent: 'gtm',
    sourceVentureId: 'vent_001',
    sourceFunction: 'gtm',
    supportingKnowledgeIds: ['k_006'],
    metrics: [
      { label: 'Day-30 retention', value: 100, unit: '%', trend: 'flat', source: 'Product analytics' },
      { label: 'Corporate legal pipeline', value: 340000, unit: '$', trend: 'up', source: 'Sales pipeline' },
      { label: 'Expansion revenue (60d)', value: 2.1, unit: '×', trend: 'up', source: 'Product analytics' },
    ],
    measuredResult: 'Pipeline from $0 → $340K in 4 weeks. Retention holds at 100% for the segment.',
    measuredAt: '2026-04-10T00:00:00Z',
  },
  {
    id: 'o_005',
    decision: 'pivot',
    title: 'Pivoted Meal Plan Newsletter to postpartum audience',
    summary:
      'Original audience (general meal planning) had 4.2% week-3 retention. Postpartum pivot retained 38%.',
    decisionMadeAt: '2026-02-08T00:00:00Z',
    decidedBy: 'founder',
    sourceAgent: 'growth',
    sourceIdeaId: 'idea_003',
    supportingKnowledgeIds: ['k_012'],
    metrics: [
      { label: 'Week-3 retention (before)', value: 4.2, unit: '%', trend: 'flat', source: 'Email analytics' },
      { label: 'Week-3 retention (after)', value: 38, unit: '%', trend: 'up', source: 'Email analytics' },
      { label: 'Open rate (after)', value: 61, unit: '%', trend: 'up', source: 'Email analytics' },
    ],
    measuredResult: 'Week-3 retention 4.2% → 38% in the postpartum segment. Open rate 22% → 61%.',
    measuredAt: '2026-03-01T00:00:00Z',
  },
];

export const inquiryThreads: InquiryThread[] = [
  {
    id: 'inq_001',
    question: 'What did we learn about pricing sensitivity across all ventures?',
    askedAt: '2026-03-10T15:55:00Z',
    status: 'complete',
    answerEntryId: 'k_007',
  },
];

/* ============================================================
   PHASE 4 — IDEA JOURNEY SEED
   ============================================================ */

import type { IdeaJourney } from '@/lib/types';

export const ideaJourney: Record<string, IdeaJourney> = {
  idea_001: {
    ideaId: 'idea_001',
    currentStage: 'validate',
    stageStates: {
      capture: 'complete',
      clean: 'complete',
      research: 'complete',
      synthesize: 'complete',
      validate: 'active',
      transition: 'locked',
    },
    rawCapture:
      'Small law firms lose hours every week reviewing and redlining contracts manually. Existing tools are priced for enterprise. Nobody builds for the 5-person firm.',
    structured: {
      problem: {
        id: 'f_p1', key: 'problem', label: 'Problem', status: 'confirmed',
        headline: 'Contract review bottleneck',
        metrics: [
          { label: 'Time cost', value: '40% / week' },
          { label: 'Firm size', value: '5–20 seats' },
        ],
        value: "Small law firms can't take on more clients without hiring more staff. Contract review is the bottleneck.",
      },
      persona: {
        id: 'f_pers1', key: 'persona', label: 'Persona', status: 'confirmed',
        headline: 'Managing partners',
        metrics: [
          { label: 'Role', value: 'Tool sign-off' },
          { label: 'Pain cadence', value: 'Weekly' },
        ],
        value: 'Managing partners at 5–20 seat firms. They sign off on tools and feel the bottleneck weekly.',
      },
      value: {
        id: 'f_v1', key: 'value', label: 'Value', status: 'confirmed',
        headline: '15+ hrs/week back',
        metrics: [
          { label: 'Capacity', value: '+3 matters' },
          { label: 'Hire avoided', value: '1 FTE' },
        ],
        value: 'Recover 15+ hours a week — enough capacity for 3 more billable matters without a hire.',
      },
      sector: {
        id: 'f_s1', key: 'sector', label: 'Sector', status: 'confirmed',
        headline: 'Legal Tech · SMB',
        metrics: [
          { label: 'TAM', value: '$4.2B' },
          { label: 'Growth', value: '12% CAGR' },
        ],
        value: 'Legal Tech — SMB services.',
      },
    },
    capture: { exchanges: [], covered: [], followUpsRemaining: 0, complete: true },
    clean: {
      fields: {
        problem: { key: 'problem', label: 'Problem', status: 'locked', value: "Small law firms can't take on more clients without hiring more staff. Contract review is the bottleneck.", exchanges: [] },
        persona: { key: 'persona', label: 'Persona', status: 'locked', value: 'Managing partners at 5–20 seat firms.', exchanges: [] },
        value: { key: 'value', label: 'Value', status: 'locked', value: 'Recover 15+ hours a week without a hire.', exchanges: [] },
        sector: { key: 'sector', label: 'Sector', status: 'locked', value: 'Legal Tech — SMB services.', exchanges: [] },
      },
      activeFieldKey: null,
      order: ['problem', 'persona', 'value', 'sector'],
      complete: true,
    },
    researchAgents: [],
    researchRun: {
      threads: [
        { id: 'th_m', kind: 'market', label: 'Market Sizing', summary: 'TAM $4.2B · 12% CAGR · SMB legal underserved', status: 'complete', knowledgeEntryId: 'k_001', origin: 'initial', requiresReview: false },
        { id: 'th_c', kind: 'competitor', label: 'Competitor Landscape', summary: '6 competitors mapped · all price above $300/mo', status: 'complete', knowledgeEntryId: 'k_002', origin: 'initial', requiresReview: false },
        { id: 'th_i', kind: 'customer', label: 'Customer Interview Synthesis', summary: '8 of 12 firms strongly support', status: 'complete', knowledgeEntryId: 'k_003', origin: 'initial', requiresReview: false },
      ],
      status: 'acknowledged',
      viewedReportIds: ['k_001', 'k_002', 'k_003'],
      acknowledgedAt: '2026-09-20T15:00:00Z',
    },
    synthesisProposals: [
      { id: 'sp_1', fieldKey: 'value', fieldLabel: 'Value', currentValue: 'Recover 15+ hours a week.', proposedValue: 'Recover 15+ hours a week — enough for 3 more billable matters.', rationale: 'Interview data showed capacity framing resonated.', evidenceKnowledgeIds: ['k_003'], status: 'accepted' },
    ],
    validation: { decision: null },
    createdAt: '2026-09-15T08:45:00Z',
    updatedAt: '2026-09-20T15:00:00Z',
  },
  idea_002: {
    ideaId: 'idea_002',
    currentStage: 'validate',
    stageStates: {
      capture: 'complete',
      clean: 'complete',
      research: 'complete',
      synthesize: 'complete',
      validate: 'active',
      transition: 'locked',
    },
    rawCapture:
      'Weekly meal planning newsletter for new parents — postpartum focus. They lose 3-5 hours per week on planning and default to takeout.',
    structured: {
      problem: {
        id: 'f_p2', key: 'problem', label: 'Problem', status: 'confirmed',
        headline: 'Meal-plan burnout',
        metrics: [
          { label: 'Time lost', value: '3–5 hrs/wk' },
          { label: 'Fallback', value: 'Takeout' },
        ],
        value: 'New parents lose 3–5 hours/week on meal planning, defaulting to takeout they regret.',
      },
      persona: {
        id: 'f_pers2', key: 'persona', label: 'Persona', status: 'confirmed',
        headline: 'New parents',
        metrics: [
          { label: 'Kids', value: '0–3 yrs' },
          { label: 'Owner', value: '1 partner' },
        ],
        value: 'Parents of children 0–3. One partner typically owns meal planning.',
      },
      value: {
        id: 'f_v2', key: 'value', label: 'Value', status: 'confirmed',
        headline: '3 hrs/week back',
        metrics: [
          { label: 'Outcome', value: 'Time back' },
          { label: 'Removes', value: 'Guilt' },
        ],
        value: 'Get three hours back per week and stop ordering takeout out of exhaustion.',
      },
      sector: {
        id: 'f_s2', key: 'sector', label: 'Sector', status: 'confirmed',
        headline: 'Consumer Wellness',
        metrics: [
          { label: 'Segment', value: 'Family food' },
          { label: 'Households', value: '4.2M' },
        ],
        value: 'Consumer wellness — family food.',
      },
    },
    capture: { exchanges: [], covered: [], followUpsRemaining: 0, complete: true },
    clean: {
      fields: {
        problem: { key: 'problem', label: 'Problem', status: 'locked', value: 'New parents lose 3–5 hours/week on meal planning.', exchanges: [] },
        persona: { key: 'persona', label: 'Persona', status: 'locked', value: 'Parents of children 0–3.', exchanges: [] },
        value: { key: 'value', label: 'Value', status: 'locked', value: 'Get three hours back per week.', exchanges: [] },
        sector: { key: 'sector', label: 'Sector', status: 'locked', value: 'Consumer wellness — family food.', exchanges: [] },
      },
      activeFieldKey: null,
      order: ['problem', 'persona', 'value', 'sector'],
      complete: true,
    },
    researchAgents: [],
    researchRun: {
      threads: [
        { id: 'th2_m', kind: 'market', label: 'Market Sizing', summary: '4.2M new-parent households', status: 'complete', knowledgeEntryId: 'k_001', origin: 'initial', requiresReview: false },
        { id: 'th2_c', kind: 'competitor', label: 'Competitor Landscape', summary: 'No dominant paid newsletter in the space', status: 'complete', knowledgeEntryId: 'k_002', origin: 'initial', requiresReview: false },
        { id: 'th2_i', kind: 'customer', label: 'Customer Interview Synthesis', summary: 'Postpartum-specific language tested 2.3× better', status: 'complete', knowledgeEntryId: 'k_003', origin: 'initial', requiresReview: false },
      ],
      status: 'acknowledged',
      viewedReportIds: ['k_001', 'k_002', 'k_003'],
      acknowledgedAt: '2026-09-18T12:00:00Z',
    },
    synthesisProposals: [
      { id: 'sp_2', fieldKey: 'value', fieldLabel: 'Value', currentValue: 'Get three hours back per week.', proposedValue: 'Get three hours back per week — and stop defaulting to takeout you regret.', rationale: 'Interview data: guilt angle resonated 2.3× more.', evidenceKnowledgeIds: ['k_003'], status: 'accepted' },
    ],
    validation: { decision: null },
    createdAt: '2026-09-10T10:00:00Z',
    updatedAt: '2026-09-18T12:00:00Z',
  },
};

/* ============================================================
   SESSION 1 — NEW DEMO IDEA
   ============================================================ */

import type { CaptureState, CleanState } from '@/lib/types';

export const ideaJourneyCaptures: Record<string, CaptureState> = {
  idea_002: {
    exchanges: [],
    covered: [],
    followUpsRemaining: 3,
    complete: false,
  },
};

export const ideaJourneyCleans: Record<string, CleanState> = {
  idea_002: {
    fields: {
      problem: { key: 'problem', label: 'Problem', status: 'pending', exchanges: [] },
      persona: { key: 'persona', label: 'Persona', status: 'pending', exchanges: [] },
      value: { key: 'value', label: 'Value', status: 'pending', exchanges: [] },
      sector: { key: 'sector', label: 'Sector', status: 'pending', exchanges: [] },
    },
    activeFieldKey: null,
    order: ['problem', 'persona', 'value', 'sector'],
    complete: false,
  },
};

/* ============================================================
   SESSION 3 — Workspace plan (mock)
   ============================================================ */

import type { WorkspacePlan } from '@/lib/types';

/* ============================================================
   SESSION 4 — Targeted research reports (mock)
   ============================================================ */

export const targetedResearchReports: KnowledgeEntry[] = [
  {
    id: 'k_targeted_gap_pricing',
    type: 'research_report',
    origin: 'idea_research',
    title: 'Pricing willingness — small law firms',
    summary: '$149–249/mo accepted across 6 firms. Hard ceiling at $299.',
    content:
      'Interviews and pricing tests across 6 firms in the 5–20 seat range. Firms universally balk above $299/mo. Between $149 and $249, conversion rate is statistically flat. Below $99 the unit economics don\'t work. The defensible range is $149–249, anchored on hours saved.',
    contributingAgent: 'research',
    confidence: 78,
    createdAt: '2026-01-10T14:00:00Z',
    tags: ['pricing', 'willingness-to-pay'],
  },
  {
    id: 'k_targeted_gap_onboarding',
    type: 'research_report',
    origin: 'idea_research',
    title: 'Onboarding complexity — measured setup time',
    summary: 'Actual setup across 6 firms averaged 2h 40m.',
    content:
      'Live onboarding sessions with 6 firms. Average time to first real contract review: 2h 40m. Fastest was 1h 15m (firm with clean data); slowest was 4h 20m (firm with scattered formats). "Setup in an afternoon" holds if "afternoon" means ~3 hours.',
    contributingAgent: 'research',
    confidence: 84,
    createdAt: '2026-01-10T14:30:00Z',
    tags: ['onboarding', 'setup'],
  },
  {
    id: 'k_targeted_gap_competitive',
    type: 'competitive_analysis',
    origin: 'idea_research',
    title: 'Incumbent response analysis',
    summary: 'Ironclad/Spellbook can\'t shrink sales motion without breaking unit economics.',
    content:
      'Both Ironclad and Spellbook rely on enterprise sales cycles (weeks-to-months). Shrinking to SMB self-serve would require rebuilding their sales motion and pricing model — a move their public commitments make unlikely in the next 12–18 months. The window is real.',
    contributingAgent: 'research',
    confidence: 71,
    createdAt: '2026-01-10T15:00:00Z',
    tags: ['competitive', 'incumbent'],
  },
];

/* ============================================================
   SUPPLEMENTAL JOURNEY SEEDS
   ============================================================ */

import type { IdeaJourney as _IdeaJourneySeed } from '@/lib/types';

/* --- idea_002: graduated to a venture (Weekly Meal Planning) --- */
export const _seed_idea_002: _IdeaJourneySeed = {
  ideaId: 'idea_002',
  currentStage: 'transition',
  stageStates: {
    capture: 'complete',
    clean: 'complete',
    research: 'complete',
    synthesize: 'complete',
    validate: 'complete',
    transition: 'complete',
  },
  rawCapture:
    'Weekly meal planning newsletter for new parents. They lose 3–5 hours per week on meal planning and end up defaulting to takeout, which costs more and feels worse.',
  structured: {
    problem: {
      id: 'f_p2s', key: 'problem', label: 'Problem', status: 'confirmed',
      headline: 'Meal-plan burnout',
      metrics: [
        { label: 'Time lost', value: '3–5 hrs/wk' },
        { label: 'Fallback', value: 'Takeout' },
      ],
      value: 'New parents lose 3–5 hours/week on meal planning, defaulting to takeout they regret.',
    },
    persona: {
      id: 'f_pers2s', key: 'persona', label: 'Persona', status: 'confirmed',
      headline: 'New parents',
      metrics: [
        { label: 'Kids', value: '0–3 yrs' },
        { label: 'Owner', value: '1 partner' },
      ],
      value: 'Parents of children 0–3. One partner typically owns meal planning and feels the time cost most.',
    },
    value: {
      id: 'f_v2s', key: 'value', label: 'Value', status: 'confirmed',
      headline: '3 hrs/week back',
      metrics: [
        { label: 'Outcome', value: 'Time back' },
        { label: 'Removes', value: 'Guilt' },
      ],
      value: 'Get three hours back per week and stop ordering takeout out of exhaustion.',
    },
    sector: {
      id: 'f_s2s', key: 'sector', label: 'Sector', status: 'confirmed',
      headline: 'Consumer Wellness',
      metrics: [
        { label: 'Segment', value: 'Family food' },
        { label: 'Households', value: '4.2M' },
      ],
      value: 'Consumer wellness — family food.',
    },
  },
  capture: {
    exchanges: [
      {
        id: 'opening_2',
        agentQuestion: "Tell me about it. What's the problem, and who has it?",
        founderAnswer:
          'New parents spend 3–5 hours a week on meal planning. They default to takeout because they are exhausted.',
        targets: ['problem', 'buyer', 'impact'],
        confirmedLabel: 'Your opening',
      },
    ],
    covered: ['problem', 'buyer', 'impact', 'market'],
    followUpsRemaining: 2,
    complete: true,
  },
  clean: {
    fields: {
      problem: { key: 'problem', label: 'Problem', status: 'locked', value: 'New parents lose 3–5 hours/week on meal planning, defaulting to takeout they regret.', exchanges: [] },
      persona: { key: 'persona', label: 'Persona', status: 'locked', value: 'Parents of children 0–3. One partner typically owns meal planning.', exchanges: [] },
      value: { key: 'value', label: 'Value', status: 'locked', value: 'Get three hours back per week and stop ordering takeout.', exchanges: [] },
      sector: { key: 'sector', label: 'Sector', status: 'locked', value: 'Consumer wellness — family food.', exchanges: [] },
    },
    activeFieldKey: null,
    order: ['problem', 'persona', 'value', 'sector'],
    complete: true,
  },
  researchAgents: [],
  researchRun: {
    threads: [
      { id: 'th2_market', kind: 'market', label: 'Market Sizing', summary: '4.2M new-parent households · $180/yr avg food spend delta', status: 'complete', knowledgeEntryId: 'k_001', origin: 'initial', requiresReview: false },
      { id: 'th2_competitor', kind: 'competitor', label: 'Competitor Landscape', summary: 'No dominant paid newsletter in the space', status: 'complete', knowledgeEntryId: 'k_002', origin: 'initial', requiresReview: false },
      { id: 'th2_customer', kind: 'customer', label: 'Customer Interview Synthesis', summary: 'Postpartum-specific language tested 2.3× better', status: 'complete', knowledgeEntryId: 'k_003', origin: 'initial', requiresReview: false },
    ],
    status: 'acknowledged',
    viewedReportIds: ['k_001', 'k_002', 'k_003'],
  },
  synthesisProposals: [],
  validation: { decision: 'continue', decidedAt: '2026-09-05T00:00:00Z' },
  createdVentureId: 'ven_002',
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-05T10:00:00Z',
};

/* --- idea_004: fresh capture (Healthcare Claims) --- */
export const _seed_idea_004: _IdeaJourneySeed = {
  ideaId: 'idea_004',
  currentStage: 'capture',
  stageStates: {
    capture: 'active',
    clean: 'locked',
    research: 'locked',
    synthesize: 'locked',
    validate: 'locked',
    transition: 'locked',
  },
  rawCapture: '',
  structured: {
    problem: { id: 'f_p4', key: 'problem', label: 'Problem', value: '', status: 'proposed' },
    persona: { id: 'f_pers4', key: 'persona', label: 'Persona', value: '', status: 'proposed' },
    value: { id: 'f_v4', key: 'value', label: 'Value', value: '', status: 'proposed' },
    sector: { id: 'f_s4', key: 'sector', label: 'Sector', value: '', status: 'proposed' },
  },
  capture: { exchanges: [], covered: [], followUpsRemaining: 3, complete: false },
  clean: {
    fields: {
      problem: { key: 'problem', label: 'Problem', status: 'pending', exchanges: [] },
      persona: { key: 'persona', label: 'Persona', status: 'pending', exchanges: [] },
      value: { key: 'value', label: 'Value', status: 'pending', exchanges: [] },
      sector: { key: 'sector', label: 'Sector', status: 'pending', exchanges: [] },
    },
    activeFieldKey: null,
    order: ['problem', 'persona', 'value', 'sector'],
    complete: false,
  },
  researchAgents: [],
  researchRun: { threads: [], status: 'idle', viewedReportIds: [] },
  synthesisProposals: [],
  validation: { decision: null },
  createdAt: '2026-09-21T08:00:00Z',
  updatedAt: '2026-09-21T08:00:00Z',
};

/* --- idea_005: killed (Remote Team Collaboration) --- */
export const _seed_idea_005: _IdeaJourneySeed = {
  ideaId: 'idea_005',
  currentStage: 'validate',
  stageStates: {
    capture: 'complete',
    clean: 'complete',
    research: 'complete',
    synthesize: 'complete',
    validate: 'complete',
    transition: 'locked',
  },
  rawCapture:
    'Unified collaboration platform for remote teams — one place for chat, docs, and calls.',
  structured: {
    problem: {
      id: 'f_p5', key: 'problem', label: 'Problem', status: 'confirmed',
      headline: 'Tool sprawl',
      metrics: [
        { label: 'Tools', value: '4+ / team' },
        { label: 'Switching', value: 'Frequent' },
      ],
      value: 'Remote teams juggle 4+ collaboration tools.',
    },
    persona: {
      id: 'f_pers5', key: 'persona', label: 'Persona', status: 'confirmed',
      headline: 'Remote-first teams',
      metrics: [
        { label: 'Size', value: '10–100' },
        { label: 'Mode', value: 'Remote-first' },
      ],
      value: 'Remote-first teams, 10–100 employees.',
    },
    value: {
      id: 'f_v5', key: 'value', label: 'Value', status: 'confirmed',
      headline: 'One surface',
      metrics: [
        { label: 'Replaces', value: 'Chat · Docs · Calls' },
      ],
      value: 'Single surface for chat, docs, calls.',
    },
    sector: {
      id: 'f_s5', key: 'sector', label: 'Sector', status: 'confirmed',
      headline: 'Productivity',
      metrics: [
        { label: 'Segment', value: 'Team collab' },
        { label: 'Crowded', value: 'Yes' },
      ],
      value: 'Productivity — team collaboration.',
    },
  },
  capture: {
    exchanges: [
      {
        id: 'opening_5',
        agentQuestion: "Tell me about it. What's the problem, and who has it?",
        founderAnswer:
          'Remote teams struggle with context switching between tools. Chat, docs, calls all in separate apps.',
        targets: ['problem', 'buyer', 'market'],
        confirmedLabel: 'Your opening',
      },
    ],
    covered: ['problem', 'buyer', 'market'],
    followUpsRemaining: 2,
    complete: true,
  },
  clean: {
    fields: {
      problem: { key: 'problem', label: 'Problem', status: 'locked', value: 'Remote teams juggle 4+ collaboration tools.', exchanges: [] },
      persona: { key: 'persona', label: 'Persona', status: 'locked', value: 'Remote-first teams, 10–100 employees.', exchanges: [] },
      value: { key: 'value', label: 'Value', status: 'locked', value: 'Single surface for chat, docs, calls.', exchanges: [] },
      sector: { key: 'sector', label: 'Sector', status: 'locked', value: 'Productivity — team collaboration.', exchanges: [] },
    },
    activeFieldKey: null,
    order: ['problem', 'persona', 'value', 'sector'],
    complete: true,
  },
  researchAgents: [],
  researchRun: {
    threads: [
      { id: 'th5_market', kind: 'market', label: 'Market Sizing', status: 'complete', knowledgeEntryId: 'k_002', origin: 'initial', requiresReview: false },
      { id: 'th5_competitor', kind: 'competitor', label: 'Competitor Landscape', summary: 'Slack, Teams, Notion — dominant, well-funded', status: 'complete', knowledgeEntryId: 'k_002', origin: 'initial', requiresReview: false },
      { id: 'th5_customer', kind: 'customer', label: 'Customer Interview Synthesis', status: 'complete', origin: 'initial', requiresReview: false },
    ],
    status: 'acknowledged',
    viewedReportIds: ['k_002'],
  },
  synthesisProposals: [],
  validation: {
    decision: 'kill',
    decidedAt: '2026-09-10T12:00:00Z',
    note: 'Market heavily saturated. 6 well-funded incumbents. No defensible wedge.',
  },
  createdAt: '2026-09-07T10:00:00Z',
  updatedAt: '2026-09-10T12:00:00Z',
};