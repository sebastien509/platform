// ============================================
// INTHRAOS CORE TYPES - OPlatform MVP
// ============================================

// ---------- PHASES ----------
export type Phase = 'validate' | 'build' | 'launch' | 'measure';
export type IdeaStatus = 'captured' | 'validating' | 'building' | 'launching' | 'measuring' | 'shipped' | 'paused' | 'killed';
export type VentureStatus = 'validating' | 'building' | 'launching' | 'operating' | 'paused' | 'archived';

// ---------- CHECKPOINTS ----------
export type CheckpointStatus = 'pending' | 'resolved' | 'stale';
export type CheckpointType = 'spend' | 'publish' | 'phase_transition' | 'routine' | 'validation';

// ---------- OUTCOMES ----------
export type OutcomeStatus = 'shipped' | 'continue' | 'pivot' | 'kill' | 'pending';

// ---------- AGENTS ----------
export type AgentRole = 
  | 'research' 
  | 'builder' 
  | 'copy_launch' 
  | 'growth' 
  | 'analyst' 
  | 'marketing' 
  | 'content' 
  | 'strategy' 
  | 'product' 
  | 'engineering' 
  | 'gtm' 
  | 'sales';

export type AgentStatus = 'idle' | 'working' | 'blocked' | 'needs_input';

// ---------- KNOWLEDGE ----------
export type KnowledgeType = 'pattern' | 'playbook' | 'template' | 'evidence' | 'decision' | 'failure' | 'module' | 'insight' | 'lesson' | 'outcome_takeaway';

// ============================================
// CORE OBJECTS
// ============================================

export interface Workspace {
  id: string;
  name: string;
  members: WorkspaceMember[];
  settings: WorkspaceSettings;
}

export interface WorkspaceMember {
  id: string;
  email: string;
  role: 'owner' | 'member';
}

export interface WorkspaceSettings {
  spendThreshold: number;
  autoContinuePhaseTransitions: boolean;
  integrations: Integration[];
}

export interface Integration {
  id: string;
  type: 'stripe' | 'vercel' | 'sendgrid' | 'analytics';
  name: string;
  connected: boolean;
  config?: Record<string, unknown>;
}

// ---------- IDEA ----------
export interface Idea {
  id: string;
  title: string;
  description: string;
  problem: string;
  hypothesis: string;
  audience: string;
  phase: Phase;
  status: IdeaStatus;
  owner: string;
  createdAt: string;
  updatedAt: string;
  progress: number;
  context: IdeaContext;
  ventureId?: string;
}

export interface IdeaContext {
  evidence: Evidence[];
  knowledge: Knowledge[];
  artifacts: Artifact[];
  checkpoints: Checkpoint[];
}

export interface Evidence {
  id: string;
  type: 'research' | 'data' | 'feedback' | 'analysis' | 'observation';
  title: string;
  description: string;
  source: string;
  confidence: number;
  createdAt: string;
}

export interface Artifact {
  id: string;
  type: 'research_summary' | 'landing_page' | 'code' | 'campaign' | 'report' | 'copy' | 'design';
  title: string;
  content: unknown;
  preview: string;
  createdAt: string;
  agentId: string;
}

// ---------- CHECKPOINT ----------
export interface Checkpoint {
  id: string;
  ideaId: string;
  ventureId?: string;
  type: CheckpointType;
  title: string;
  description: string;
  recommendation: string;
  evidence: Evidence[];
  status: CheckpointStatus;
  options: CheckpointOption[];
  resolvedAt?: string;
  resolvedChoice?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface CheckpointOption {
  label: string;
  value: string;
  description?: string;
  action: 'approve' | 'reject' | 'defer' | 'modify';
}

// ---------- OUTCOME ----------
export interface Outcome {
  id: string;
  ideaId: string;
  ventureId?: string;
  title: string;
  description: string;
  status: OutcomeStatus;
  phaseReached: Phase;
  value?: number;
  evidence: Evidence[];
  takeaways: string[];
  decisionDate: string;
  metadata: {
    before?: string;
    after?: string;
    impact?: string;
  };
}

// ---------- VENTURE ----------
export interface Venture {
  id: string;
  name: string;
  description: string;
  ideaId: string;
  status: VentureStatus;
  owner: string;
  createdAt: string;
  updatedAt: string;
  health: VentureHealth;
  functions: VentureFunctions;
  agentIds: string[];
  outcomeIds: string[];
}

export interface VentureHealth {
  strategy: number;
  product: number;
  engineering: number;
  gtm: number;
  marketing: number;
  content: number;
  sales: number;
  growth: number;
  analytics: number;
  knowledge: number;
  outcomes: number;
}

export interface VentureFunctions {
  strategy: StrategyFunction;
  product: ProductFunction;
  engineering: EngineeringFunction;
  gtm: GTMFunction;
  marketing: MarketingFunction;
  content: ContentFunction;
  sales: SalesFunction;
  growth: GrowthFunction;
  analytics: AnalyticsFunction;
}

export interface StrategyFunction {
  vision: string;
  positioning: string;
  decisions: StrategyDecision[];
}

export interface StrategyDecision {
  id: string;
  title: string;
  description: string;
  madeAt: string;
}

export interface ProductFunction {
  requirements: ProductRequirement[];
  features: ProductFeature[];
  roadmap: RoadmapItem[];
}

export interface ProductRequirement {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed' | 'blocked';
}

export interface ProductFeature {
  id: string;
  title: string;
  status: 'planned' | 'in_progress' | 'completed';
}

export interface RoadmapItem {
  id: string;
  title: string;
  quarter: string;
  status: 'planned' | 'in_progress' | 'completed';
}

export interface FieldMetric {
  label: string;
  value: string;
}

export interface StructuredIdeaCardField {
  id: string;
  key: string;
  label: string;
  value: string;
  /** Short takeaway shown as the field card's primary read. Falls back to label. */
  headline?: string;
  /** 1–3 structured points rendered as chips. */
  metrics?: FieldMetric[];
  status: 'confirmed' | 'proposed' | 'locked';
}

export interface EngineeringFunction {
  architecture: string;
  tasks: EngineeringTask[];
  environments: Record<string, 'active' | 'inactive' | 'planned'>;
  releases: Release[];
}

export interface EngineeringTask {
  id: string;
  title: string;
  status: 'planned' | 'in_progress' | 'completed' | 'blocked';
}

export interface Release {
  id: string;
  title: string;
  status: 'planned' | 'in_progress' | 'released';
  date: string;
}

export interface GTMFunction {
  icp: string;
  segments: string[];
  positioning: string;
  messaging: string;
  offers: string[];
  channels: string[];
  distribution: string;
  partnerships: string[];
  salesMotion: string;
  experiments: GTMExperiment[];
}

export interface GTMExperiment {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'failed';
  hypothesis: string;
  result?: string;
}

export interface MarketingFunction {
  brand: string;
  campaigns: MarketingCampaign[];
  social: string[];
  email: string[];
  seo: boolean;
  paid: string[];
  events: string[];
}

export interface MarketingCampaign {
  id: string;
  title: string;
  status: 'planning' | 'active' | 'completed';
}

export interface ContentFunction {
  strategy: string;
  calendar: ContentItem[];
  drafts: ContentItem[];
  assets: ContentAsset[];
}

export interface ContentItem {
  id: string;
  title: string;
  status: 'planned' | 'draft' | 'in_progress' | 'published';
  date?: string;
}

export interface ContentAsset {
  id: string;
  title: string;
  type: string;
}

export interface SalesFunction {
  prospects: Prospect[];
  pipeline: PipelineItem[];
  outreach: Outreach[];
}

export interface Prospect {
  id: string;
  name: string;
  status: 'contacted' | 'discovery' | 'proposal' | 'closed';
}

export interface PipelineItem {
  id: string;
  name: string;
  stage: string;
  value: number;
}

export interface Outreach {
  id: string;
  title: string;
  status: 'active' | 'completed';
}

export interface GrowthFunction {
  experiments: GrowthExperiment[];
  acquisition: GrowthMetrics;
  activation: { rate: number };
  conversion: { rate: number };
  retention: { rate: number };
  referral: { rate: number };
  revenue: RevenueMetrics;
}

export interface GrowthExperiment {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'failed';
  result?: string;
}

export interface GrowthMetrics {
  organic: number;
  paid: number;
  referral: number;
}

export interface RevenueMetrics {
  mrr: number;
  arr: number;
}

export interface AnalyticsFunction {
  acquisition: AnalyticsMetrics;
  activation: { rate: number };
  conversion: { rate: number };
  revenue: RevenueMetrics;
  retention: { rate: number };
}

export interface AnalyticsMetrics {
  visitors: number;
  signups: number;
  cost: number;
}

// ---------- AGENT ----------
export interface Agent {
  id: string;
  role: AgentRole;
  name: string;
  description: string;
  status: AgentStatus;
  currentTask?: string;
  currentIdeaId?: string;
  currentVentureId?: string;
  lastOutput?: string;
  lastOutputDate?: string;
  activity: AgentActivity[];
}

export interface AgentActivity {
  id: string;
  agentId: string;
  ideaId: string;
  ventureId?: string;
  action: string;
  result: string;
  timestamp: string;
}

// ---------- KNOWLEDGE ----------
export interface Knowledge {
  id: string;
  type: KnowledgeType;
  title: string;
  content: string;
  tags: string[];
  sourceIdeaId?: string;
  sourceVentureId?: string;
  createdAt: string;
  useCount: number;
}

// ---------- EVENT ----------
export interface Event {
  id: string;
  type: 'system' | 'workflow' | 'agent' | 'entity' | 'decision' | 'review' | 'outcome' | 'checkpoint';
  status: 'info' | 'success' | 'warning' | 'error' | 'pending' | 'working';
  source: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

// ---------- API RESPONSE ----------
export interface ApiResponse<T = any> {
  data: T;
  meta?: {
    requestId: string;
    timestamp: string;
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
    };
  };
  errors?: Array<{
    code: string;
    message: string;
    details?: Record<string, unknown>;
  }>;
}

/* ============================================================
   PHASE 3 STEP 3 — KNOWLEDGE + OUTCOMES
   Knowledge = pre-decision research / docs / selections.
   Outcomes  = post-decision results, factual, API-driven.
   ============================================================ */

import type { AgentKey } from '@/components/agents/identity/agentColors';

/* ---------- Knowledge ---------- */

export type KnowledgeEntryType =
  | 'research_report'        // Agent-produced report (any domain)
  | 'market_analysis'        // Market sizing, trends
  | 'competitive_analysis'   // Competitor teardown
  | 'interview_transcript'   // Customer interview raw
  | 'customer_insight'       // Synthesized customer learnings
  | 'founder_selection'      // Founder's confirmed choice in Idea stage
  | 'synthesized_answer'     // Output of an InquiryInput query
  | 'research_note'          // Freeform note
  | 'document';              // Uploaded file

export type KnowledgeOrigin =
  | 'idea_research'          // Agent ran in Idea Journey
  | 'idea_founder'           // Founder confirmed within Idea Journey
  | 'venture_agent'          // Agent ran inside a venture
  | 'venture_founder'        // Founder created inside a venture
  | 'inquiry';               // Cross-venture inquiry output

export interface KnowledgeCitation {
  id: string;
  label: string;
  /** Where the citation points — resolves to another entry, an external URL, or a raw artifact. */
  target: { kind: 'knowledge'; entryId: string }
        | { kind: 'external'; url: string }
        | { kind: 'artifact'; label: string };
}

export interface KnowledgeEntry {
  id: string;
  type: KnowledgeEntryType;
  origin: KnowledgeOrigin;
  title: string;
  summary: string;
  content?: string;

  /* Tracing */
  sourceIdeaId?: string;
  sourceVentureId?: string;
  contributingAgent?: AgentKey;
  citations?: KnowledgeCitation[];

  /* Connected web */
  relatedEntryIds?: string[];
  referencedByOutcomeIds?: string[];

  /* Meta */
  confidence?: number;
  createdAt: string;
  tags?: string[];
  attachments?: Array<{
    id: string;
    label: string;
    url: string;
    type: 'pdf' | 'doc' | 'image' | 'sheet' | 'link';
  }>;
}

/* ---------- Outcomes ---------- */

export type OutcomeDecisionKind = 'win' | 'kill' | 'pivot' | 'scale' | 'graduate';

export type OutcomeDecidedBy = 'founder' | 'agent_recommended';

export interface OutcomeMetric {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  /** Where the number came from (agent + system) — kept factual. */
  source?: string;
}

export interface OutcomeEntry {
  id: string;
  decision: OutcomeDecisionKind;
  title: string;
  summary: string;
  decisionMadeAt: string;
  decidedBy: OutcomeDecidedBy;
  sourceAgent?: AgentKey;

  /* Scope */
  sourceIdeaId?: string;
  sourceVentureId?: string;
  sourceFunction?: string;

  /* Evidence */
  supportingKnowledgeIds?: string[];

  /* Measured result — API-driven */
  metrics?: OutcomeMetric[];
  measuredResult?: string;
  measuredAt?: string;

  /* Downstream */
  ledToNewIdeaIds?: string[];
  ledToNewVentureIds?: string[];
}

/* ---------- Inquiry (Knowledge main page) ---------- */

export interface InquiryThread {
  id: string;
  question: string;
  askedAt: string;
  status: 'running' | 'complete' | 'failed';
  answerEntryId?: string;
  scopeVentureIds?: string[];
  scopeIdeaIds?: string[];
}

/* ============================================================
   PHASE 4 — IDEA JOURNEY
   ============================================================ */

export type IdeaStage =
  | 'capture'
  | 'clean'
  | 'research'
  | 'synthesize'
  | 'validate'
  | 'transition';

export type IdeaStageState = 'locked' | 'active' | 'complete';

/** Structured Idea Card — the four fields Clean produces. */
export interface StructuredIdeaField {
  id: string;
  key: 'problem' | 'persona' | 'value' | 'sector';
  label: string;
  value: string;
  /** Agent-proposed first, confirmed by founder. */
  status: 'proposed' | 'confirmed' | 'rejected';
  /** Optional agent note about why this was proposed. */
  rationale?: string;
  citations?: string[];   // Knowledge entry ids
  /** Enriched headline — falls back to value when absent. */
  headline?: string;
  /** Metric chips shown under the headline (label + value). */
  metrics?: Array<{ label: string; value: string }>;
  /** 2 short supporting bullets — the LLM's grounding for the value. */
  context?: string[];

}

export interface StructuredIdeaCard {
  problem: StructuredIdeaField | null;
  persona: StructuredIdeaField | null;
  value: StructuredIdeaField | null;
  sector: StructuredIdeaField | null;
}

/** Research stage — one entry per running agent. */
export interface IdeaResearchAgent {
  id: string;
  agentKey: import('@/components/agents/identity').AgentKey;
  name: string;
  role: string;
  status: 'running' | 'complete' | 'failed';
  /** Filled once the agent produces its report. */
  knowledgeEntryId?: string;
  /** Short one-line summary shown while running/complete. */
  summary?: string;
  startedAt: string;
  completedAt?: string;
}

/** Synthesize stage — one proposal per Idea Card field. */
export interface SynthesisProposal {
  id: string;
  fieldKey: 'problem' | 'persona' | 'value' | 'sector';
  fieldLabel: string;
  /** Existing value (may be empty if a field is new). */
  currentValue?: string;
  proposedValue: string;
  rationale: string;
  evidenceKnowledgeIds: string[];
  /** 0-100. Agent's confidence in this refinement. */
  confidence?: number;
  status: 'pending' | 'accepted' | 'rejected';
}

/** Validate stage — the founder's decision. */
export type ValidationDecision = 'continue' | 'research_more' | 'kill';

export interface ValidationState {
  decision: ValidationDecision | null;
  decidedAt?: string;
  /** Set when decision === 'continue'. */
  outcomeId?: string;
  /** Optional founder note. */
  note?: string;
}

/** Full journey envelope attached to an idea. */
export interface IdeaJourney {
  ideaId: string;
  currentStage: IdeaStage;
  stageStates: Record<IdeaStage, IdeaStageState>;

  rawCapture: string;
  structured: StructuredIdeaCard;

  /** Session 1 — new guided Capture state. */
  capture: CaptureState;
  /** Session 1 — new Agent Flow Clean state. */
  clean: CleanState;

  /** @deprecated — replaced by researchRun (one agent, three threads). */
  researchAgents: IdeaResearchAgent[];
  /** Session 2 — one Research Agent, three threads, gated by acknowledgment. */
  researchRun: ResearchRunState;

  /** The actual research files produced by the agent (4 sections each). */
  researchEntries?: ResearchEntry[];

  /** Founder notes captured during Review, keyed by entry id. */
  reviewNotes?: Record<string, string>;

  /** Agent-generated synthesis of the research. 2-4 sentences. */
  synthesisOverview?: string;
  synthesisProposals: SynthesisProposal[];

  /** Set by the finalize step after all proposals are resolved.
   *  The LLM produces the complete, coherent package: a short
   *  title (5-7 words), a clean overview, and all 4 structured
   *  fields locked. This is what ships to the DB. */
  finalized?: {
    title: string;
    overview: string;
    structured: StructuredIdeaCard;
    finalizedAt: string;
  };

  validation: ValidationState;

  /** Set after Transition completes. */
  createdVentureId?: string;

  createdAt: string;
  updatedAt: string;
}

/* ============================================================
   SESSION 1 — AGENT FLOW, CAPTURE, CLEAN
   ============================================================ */

/* ---------- Agent Flow primitive ---------- */
export type AgentFlowStepStatus = 'confirmed' | 'active';
export type AgentFlowStepType = 'text' | 'choice';

export interface AgentFlowStep {
  id: string;
  question: string;
  /** Short label shown on the collapsed line (e.g. "Problem", "Buyer"). */
  confirmedLabel?: string;
  answer?: string;
  status: AgentFlowStepStatus;
  type: AgentFlowStepType;
  choices?: string[];
}

/* ---------- Capture ---------- */
export type CaptureSignal = 'problem' | 'solution' | 'buyer' | 'impact' | 'market';

export interface CaptureExchange {
  id: string;
  agentQuestion: string;
  founderAnswer?: string;
  /** Which signal(s) this exchange was targeting. */
  targets: CaptureSignal[];
  /** Confirmed line label. */
  confirmedLabel?: string;
}

export interface CaptureState {
  /** The founder's answers, in order. */
  exchanges: CaptureExchange[];
  /** Signals covered across all answers. */
  covered: CaptureSignal[];
  /** Follow-ups remaining before Capture completes. */
  followUpsRemaining: number;
  /** True while the founder's answer is being processed. */
  processing?: boolean;
  /** Set when the flow completes and Clean can begin. */
  complete: boolean;
}

/* ---------- Clean ---------- */
export type CleanFieldKey = 'problem' | 'persona' | 'value' | 'sector';
export type CleanFieldStatus = 'pending' | 'active' | 'locked';

export interface CleanExchange {
  id: string;
  agentQuestion: string;
  founderAnswer?: string;
  /** Where in the reflect → test → sharpen → confirm cycle this is. */
  move: 'reflect' | 'test' | 'sharpen' | 'confirm';
}

export interface CleanFieldState {
  key: CleanFieldKey;
  label: string;
  status: CleanFieldStatus;
  /** The locked (confirmed) value, populated once the field completes. */
  value?: string;
  /** Full conversation history for this field. */
  exchanges: CleanExchange[];
  /** Optional agent confidence score for the field (used by sector). */
  confidence?: number;
  /** Founder's selected sector if they overrode the agent's choice. */
  overridden?: boolean;
}

export interface CleanState {
  fields: Record<CleanFieldKey, CleanFieldState>;
  /** Which field is currently active. */
  activeFieldKey: CleanFieldKey | null;
  /** Ordering for the rail. */
  order: CleanFieldKey[];
  complete: boolean;
}

/* ---------- Ideas List taxonomy ---------- */
export type IdeaListStatus =
  | 'capturing'
  | 'researching'
  | 'awaiting_review'
  | 'refining'
  | 'ready_to_validate'
  | 'killed'
  | 'validated';

/* ============================================================
   SESSION 2 — RESEARCH THREADS + ACKNOWLEDGMENT
   ============================================================ */



export interface ResearchThread {
  id: string;
  kind: ResearchThreadKind;
  /** Short label — "Market Sizing", "Competitor Landscape", etc. */
  label: string;
  /** One-line summary once complete — "TAM $4.2B · 12% CAGR" */
  summary?: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  /** Knowledge entry produced by this thread. */
  knowledgeEntryId?: string;
  startedAt?: string;
  completedAt?: string;
  origin?: 'bootstrap' | 'research_more' | 'revision' | string;
  targetGapId?: string;
  requiresReview?: boolean;
  failureResolved?: 'retry' | 'escalate' | 'ignore';
}

export type ResearchRunStatus =
  | 'idle'
  | 'running'
  | 'complete'          // all threads terminal, drawer waiting
  | 'awaiting_review'   // drawer open, founder reviewing
  | 'acknowledged';     // founder clicked "I've reviewed this"

export interface ResearchRunState {
  threads: ResearchThread[];
  status: ResearchRunStatus;
  /** Report IDs the founder has actually opened. */
  viewedReportIds: string[];
  /** Fires when the founder clicks "I've reviewed this". */
  acknowledgedAt?: string;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Whether the acknowledgment gate has been satisfied.
 * Synthesize cannot begin until `satisfied === true`.
 */
export interface AcknowledgmentState {
  required: boolean;
  satisfied: boolean;
  viewedReportIds: string[];
  requiredReportIds: string[];
}

/* ============================================================
   SESSION 3 — GRADUATION + IDEAS LIST TAXONOMY
   ============================================================ */

export type GraduationState = 'idle' | 'morphing' | 'confirmed';

export interface WorkspacePlan {
  tier: 'starter' | 'pro' | 'founder' | 'team';
  /** Ventures already in use against the plan. */
  venturesUsed: number;
  /** Venture names, for the "already in use by X" copy. */
  ventureNames: string[];
  /** Max ventures allowed on this plan. */
  ventureLimit: number;
}

/* ============================================================
   SESSION 4 — TARGETED RESEARCH (Research More)
   ============================================================ */

export interface ResearchGap {
  id: string;
  title: string;
  description: string;
  /** Which Idea Card fields this gap would inform. */
  relatedFields: CleanFieldKey[];
  /** How much closing this gap sharpens the decision. */
  impact: 'low' | 'medium' | 'high';
}

/* ============================================================
   VENTURE PAGES — Document architecture
   ============================================================ */

export type VentureFunnelStage =
  | 'inputs'
  | 'research'
  | 'strategize'
  | 'produce'
  | 'outcome';

export type ArtifactKind =
  | 'icp'
  | 'positioning'
  | 'wedge'
  | 'brand'
  | 'prd'
  | 'roadmap'
  | 'architecture'
  | 'api_spec'
  | 'ui_spec'
  | 'build_plan'
  | 'gtm_plan'
  | 'channel_strategy'
  | 'drip_campaign'
  | 'content_calendar'
  | 'messaging'
  | 'pipeline_design'
  | 'outreach_sequence'
  | 'discovery_script'
  | 'growth_experiment'
  | 'retention_plan'
  | 'performance_report'
  | 'decision_history';

export type ArtifactStatus = 'draft' | 'approved' | 'needs_revision';

export interface VentureDocument {
  id: string;
  ventureId: string;
  kind: ArtifactKind;
  title: string;
  content: string;
  /** Bento card summary shown before opening the full doc. */
  summary: string;
  /** Optional structured sections. When present, the drawer renders
   *  these with per-type templates instead of the markdown content.
   *  Used for research files and other non-markdown outputs. */
  sections?: import('./index').ResearchSection[] | null;
  /** Which page produced it. */
  producedBy: VenturePageKey;
  /** Which pages had their docs in the input stack. */
  consumedFrom: VenturePageKey[];
  status: ArtifactStatus;
  /** Set when this is the page's headline artifact that gates downstream use. */
  isHeadline: boolean;
  /** Cross-page references — other documents + their approval state. */
  citations: VentureDocCitation[];
  /** True if produced while an upstream dependency was still draft. */
  builtOnDraftInput: boolean;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  revisionNote?: string;
}

export interface VentureDocCitation {
  docId: string;
  title: string;
  /** So the pill can show draft/approved state without a lookup. */
  status: ArtifactStatus;
  sourcePage: VenturePageKey;
}

export type VenturePageKey =
  | 'strategy'
  | 'product'
  | 'engineering'
  | 'gtm'
  | 'campaigns'
  | 'sales'
  | 'growth'
  | 'analytics'
  | 'knowledge'
  | 'funding'
  | 'outcomes';

export interface VentureFunnelState {
  ventureId: string;
  pageKey: VenturePageKey;
  currentStage: VentureFunnelStage;
  /** Proposals generated for the Strategize stage, resolved one at a time. */
  proposals: ArtifactProposal[];
  /** Docs produced but not yet approved. */
  producedDocIds: string[];
  /** True when the founder has moved past Produce into Outcome. */
  awaitingApproval: boolean;
}

export interface ArtifactProposal {
  id: string;
  kind: ArtifactKind;
  title: string;
  rationale: string;
  /** The proposal content that will become the artifact if approved. */
  proposedContent: string;
  /** Summary preview shown in the hero cell. */
  proposedSummary: string;
  citations: VentureDocCitation[];
  status: 'pending' | 'accepted' | 'rejected';
}

/* ============================================================
   VENTURE PAGES — Document architecture
   ============================================================ */

// DUPLICATE — removed: export type VentureFunnelStage =
//   | 'inputs'
//   | 'research'
//   | 'strategize'
//   | 'produce'
//   | 'outcome';

// DUPLICATE — removed: export type ArtifactKind =
//   | 'icp'
//   | 'positioning'
//   | 'wedge'
//   | 'brand'
//   | 'prd'
//   | 'roadmap'
//   | 'architecture'
//   | 'api_spec'
//   | 'ui_spec'
//   | 'build_plan'
//   | 'gtm_plan'
//   | 'channel_strategy'
//   | 'drip_campaign'
//   | 'content_calendar'
//   | 'messaging'
//   | 'pipeline_design'
//   | 'outreach_sequence'
//   | 'discovery_script'
//   | 'growth_experiment'
//   | 'retention_plan'
//   | 'performance_report'
//   | 'decision_history';

// DUPLICATE — removed: export type ArtifactStatus = 'draft' | 'approved' | 'needs_revision';

export interface VentureDocument {
  id: string;
  ventureId: string;
  kind: ArtifactKind;
  title: string;
  content: string;
  /** Bento card summary shown before opening the full doc. */
  summary: string;
  /** Which page produced it. */
  producedBy: VenturePageKey;
  /** Which pages had their docs in the input stack. */
  consumedFrom: VenturePageKey[];
  status: ArtifactStatus;
  /** Set when this is the page's headline artifact that gates downstream use. */
  isHeadline: boolean;
  /** Cross-page references — other documents + their approval state. */
  citations: VentureDocCitation[];
  /** True if produced while an upstream dependency was still draft. */
  builtOnDraftInput: boolean;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  revisionNote?: string;
}

export interface VentureDocCitation {
  docId: string;
  title: string;
  /** So the pill can show draft/approved state without a lookup. */
  status: ArtifactStatus;
  sourcePage: VenturePageKey;
}

// DUPLICATE — removed: export type VenturePageKey =
//   | 'strategy'
//   | 'product'
//   | 'engineering'
//   | 'gtm'
//   | 'campaigns'
//   | 'sales'
//   | 'growth'
//   | 'analytics'
//   | 'knowledge'
//   | 'outcomes';

export interface VentureFunnelState {
  ventureId: string;
  pageKey: VenturePageKey;
  currentStage: VentureFunnelStage;
  /** Proposals generated for the Strategize stage, resolved one at a time. */
  proposals: ArtifactProposal[];
  /** Docs produced but not yet approved. */
  producedDocIds: string[];
  /** True when the founder has moved past Produce into Outcome. */
  awaitingApproval: boolean;
}

export interface ArtifactProposal {
  id: string;
  kind: ArtifactKind;
  title: string;
  rationale: string;
  /** The proposal content that will become the artifact if approved. */
  proposedContent: string;
  /** Summary preview shown in the hero cell. */
  proposedSummary: string;
  citations: VentureDocCitation[];
  status: 'pending' | 'accepted' | 'rejected';
}

/**
 * Per-venture per-page funnel state.
 * Keyed by `${ventureId}:${pageKey}` in the venture store.
 */
export interface VenturePageFunnel {
  ventureId: string;
  pageKey: VenturePageKey;
  currentStage: VentureFunnelStage;
  /** Strategize-stage proposals, resolved one at a time. */
  proposals: ArtifactProposal[];
  /** IDs of docs produced in the Produce stage. */
  producedDocIds: string[];
  /** True once Produce completes and the founder must approve. */
  awaitingApproval: boolean;
  /** Index into producedDocIds for the current approval. */
  currentApprovalIndex: number;
  /** Research thread state for this page's run. */
  researchThreads: Array<{
    id: string;
    kind: string;
    label: string;
    status: 'pending' | 'running' | 'complete';
    summary?: string;
  }>;
  startedAt: string;
  updatedAt: string;
}


// ============================================================
// VENTURE AGENT — Phase 0
// ============================================================
//
// Additions for:
//   · AgentSideDrawer    — six-zone, typed-block, manifest-driven
//   · FunctionToolStrip  — action lifecycle (Prepared → Proven)
//
// This block ADDS to what's above. It does NOT redeclare:
//   ArtifactKind, ArtifactStatus, Artifact, VentureDocument,
//   VenturePageKey, VentureFunnelState, VenturePageFunnel,
//   ArtifactProposal, VentureDocCitation, KnowledgeEntry,
//   OutcomeEntry, InquiryThread, Agent, AgentRole, AgentActivity.
//
// Note on naming: the existing `ArtifactKind` is the *semantic*
// category (icp, prd, ...). The new `ArtifactFormat` is the
// *physical* medium (doc, html, repo, ...). They are orthogonal
// — an ICP can be a doc; a landing page is an html surface.
//
// Two rules this block encodes:
//   1. No agent interaction in the main screen.
//   2. Every real-world action writes a Record.
// ============================================================


// ---------- Page identity (broader than VenturePageKey) ----------

/** All 11 venture surfaces, including the Overview aggregator. */
export type VenturePageId =
  | 'overview'
  | 'strategy'
  | 'product'
  | 'engineering'
  | 'gtm'
  | 'campaigns'
  | 'sales'
  | 'growth'
  | 'analytics'
  | 'knowledge'
  | 'funding'
  | 'outcomes';

/** Pages that read across the venture rather than producing within
 *  a single funnel. They run a lighter cycle. */
export type ReadingPageId = 'analytics' | 'knowledge' | 'outcomes';

/** Reading pages run this cycle instead of the five-stage funnel. */
export type ReadingStage = 'read' | 'detect' | 'recommend';


// ---------- Artifact format ----------

/**
 * The five physical formats an artifact can take. Orthogonal to
 * ArtifactKind (which is the semantic category: 'prd', 'icp', ...).
 *
 * Renderings:
 *   doc    → DocumentViewerDrawer (bottom sheet, read-only default)
 *   html   → DocumentViewerDrawer with live HTML render + share link
 *   repo   → outbound link + status card in the workspace
 *   data   → bento card with export
 *   record → appears in Outcomes automatically
 */
export type ArtifactFormat = 'doc' | 'html' | 'repo' | 'data' | 'record';


// ---------- Action lifecycle ----------

/**
 * Every real-world action moves through four states. Parallel to
 * ArtifactStatus — where that answers "do we agree on the plan?",
 * this answers "did it happen, and did it work?".
 *
 *   prepared  → the agent built it, waiting in the viewer
 *   confirmed → the founder approved it
 *   live      → it happened in the world
 *   proven    → evidence came back (replies, signups, payments)
 */
export type ActionState =
  | 'prepared'
  | 'confirmed'
  | 'live'
  | 'proven'
  | 'failed';

/**
 * Native runs on IV infrastructure (hosted landing pages, forms,
 * share links). Connected runs through a tool the founder linked.
 * Native is always available; Connected is opt-in.
 */
export type ActionMode = 'native' | 'connected';

export interface Action {
  id: string;
  /** Verb + destination, human-readable. "Deploy preview",
   *  "Send outreach", "Publish landing page". */
  verb: string;
  /** Where this action belongs: "Strategy › Market". */
  destination: string;
  mode: ActionMode;
  /** Connector id when mode === 'connected': 'github', 'vercel',
   *  'stripe', 'gmail', 'calendar', 'linear', etc. */
  connector?: string;
  state: ActionState;
  /** The action's content — email body, HTML page, deploy config.
   *  Shape depends on the verb. */
  payload: Record<string, unknown>;
  /** Preview target — a DocumentViewerDrawer key. */
  previewHref?: string;
  /** The Record written to Outcomes on execute. */
  recordId?: string;
  /** Where the proof came from (Stripe dashboard, Vercel URL). */
  evidenceUrl?: string;
  preparedAt: string;
  confirmedAt?: string;
  executedAt?: string;
  provenAt?: string;
  /** Hard failures only. Native-mode fallbacks ("Copy and open")
   *  are not failures. */
  failureReason?: string;
}


// ---------- Source chips (inline citations inside blocks) ----------

export interface SourceChip {
  label: string;
  target:
    | { kind: 'artifact'; artifactId: string }
    | { kind: 'knowledge'; entryId: string }
    | { kind: 'external'; url: string }
    | { kind: 'step'; stepId: string };
}


// ---------- Agent blocks (the drawer's universal language) ----------

interface AgentBaseBlock {
  id: string;
  runId: string;
  agentId: string;
  createdAt: string;
}

/**
 * Header + summary. The one block type that's always visible, even
 * when the drawer is collapsed to peek.
 */
export interface StatusBlock extends AgentBaseBlock {
  type: 'status';
  state:
    | 'working'
    | 'needs_you'
    | 'review_ready'
    | 'done'
    | 'failed'
    | 'paused';
  objective: string;
  progress?: { current: number; total: number };
}

/** Activity timeline. Each step has a label, optional sources, and
 *  reasoning behind a toggle (collapsed by default). */
export interface StepBlock extends AgentBaseBlock {
  type: 'step';
  label: string;
  sources?: SourceChip[];
  reasoning?: string;
  startedAt: string;
  completedAt?: string;
}

/** Needs you. Renders in the pinned zone above the activity. */
export interface QuestionBlock extends AgentBaseBlock {
  type: 'question';
  prompt: string;
  options?: Array<{ label: string; value: string; primary?: boolean }>;
  freeText?: boolean;
}

export interface FileRequestBlock extends AgentBaseBlock {
  type: 'file_request';
  prompt: string;
  /** Accepted MIME-ish kinds: 'pdf', 'image', 'csv', 'zip'. */
  acceptedKinds: string[];
  destinationHint?: string;
}

export interface ApprovalBlock extends AgentBaseBlock {
  type: 'approval';
  /** The output this approval gates. */
  targetOutputId: string;
  prompt: string;
  approveLabel?: string;
  rejectLabel?: string;
  /** Opens the DocumentViewerDrawer for review before approving. */
  editHref?: string;
}

/** What a single output block can render as. Distinct from
 *  ArtifactKind (semantic) and ArtifactFormat (physical). */
export type OutputKind =
  | 'document'
  | 'field_update'
  | 'table'
  | 'file'
  | 'chart'
  | 'email_batch'
  | 'action';

export interface OutputBlock extends AgentBaseBlock {
  type: 'output';
  kind: OutputKind;
  title: string;
  /** Where this lands: "Strategy › Market". */
  destination: string;
  status: 'draft' | 'needs_review' | 'approved' | 'published';
  /** Opens the DocumentViewerDrawer. */
  previewHref: string;
  /** Optional inline payload for ops without a surface. */
  payload?: any;
}

export interface ErrorBlock extends AgentBaseBlock {
  type: 'error';
  message: string;
  actions: Array<'retry' | 'escalate' | 'ignore'>;
}

export type AgentBlock =
  | StatusBlock
  | StepBlock
  | QuestionBlock
  | FileRequestBlock
  | ApprovalBlock
  | OutputBlock
  | ErrorBlock;


// ---------- Agent runs ----------

/**
 * A single execution of an agent. Persisted to the drawer store.
 * Reopening the drawer tomorrow re-renders from the stored run —
 * nothing is reconstructed.
 */
export interface AgentRun {
  id: string;
  agentId: string;
  ventureId?: string;
  /** Set when the run was spawned from the Idea Journey rail. */
  ideaId?: string;
  /** True for chat-like runs (research) where the composer stays
   *  visible and the founder can interject mid-run. Ops use the
   *  default (question → wait → continue). */
  conversationMode?: boolean;
  page?: VenturePageId;
  /** Mirrors the latest StatusBlock.state. Drives the header pill
   *  and the multi-agent switcher dot. */
  status: StatusBlock['state'];
  objective: string;
  /** The full timeline, in order. */
  blocks: AgentBlock[];
  startedAt: string;
  completedAt?: string;
  /** Set when the run leaves the dock. Auto-set on 'done' or
   *  'failed'; set manually when the founder closes the drawer.
   *  A closed run is still viewable via the ops card → View threads
   *  (read-only mode). */
  closedAt?: string;
  /** Why the run closed. Drives Outcomes classification — an
   *  'abandoned' run doesn't show up as a failure. */
  closedReason?: 'validated' | 'failed' | 'abandoned' | 'dismissed';
  /** Optional op metadata — set when the run was triggered by an op. */
  opId?: string;
  opIcon?: string;
  opVerb?: string;
}


// ---------- Agent manifest ----------

/**
 * Every agent ships a manifest. Adding a new agent means writing a
 * manifest and a skill — no drawer UI changes.
 */
export interface AgentManifest {
  /** Identity */
  id: string;
  name: string;
  /** Lucide icon name — the drawer resolves it from this string. */
  icon: string;
  /** Agent identity hue (or the venture hue if inherited). */
  hue?: string;

  /** Scope — which pages this agent may write to. */
  pages: VenturePageId[];

  /** Capabilities */
  outputKinds: OutputKind[];
  quickActions: Array<{
    id: string;
    label: string;
    payload?: Record<string, unknown>;
  }>;

  /** Governance — enforced at the manifest level so no agent can
   *  accidentally bypass it. */
  approvalPolicy: {
    default: 'always' | 'auto_publish_low_risk' | 'never';
    overrides?: Record<string, 'always' | 'auto'>;
  };
}

/* ============================================================
   RESEARCH FILES — Phase 6b.10c.3
   The output of each research thread is a branded 4-section file.
   Sections are typed; templates render them.
   ============================================================ */

export type ResearchSectionType =
  /* Research memo section types */
  | 'headline'
  | 'table'
  | 'narrative'
  | 'quote'
  /* Shared across memos and op outputs */
  | 'metrics'
  | 'list'
  | 'callout'
  /* Op-output section types (also valid in a research memo) */
  | 'paragraph'
  | 'code'
  | 'timeline'
  | 'hero'
  | 'feature-grid'
  | 'pricing'
  | 'embed'
  | 'terms';

export type ResearchThreadKind = 'market' | 'competitor' | 'customer';

export interface ResearchSection {
  id: string;
  type: ResearchSectionType;
  /** Small-caps eyebrow above the section. Optional. */
  label?: string | null;

  /* Only one of these is populated, based on `type`. All others
     arrive as null from the agent — a strict-schema requirement. */

  /* ── Research memo types ── */
  headline?: { title: string; kicker?: string | null } | null;
  table?: {
    columns: string[];
    rows: string[][];
    caption?: string | null;
  } | null;
  narrative?: { heading?: string | null; paragraphs: string[] } | null;
  quote?: { text: string; attribution: string } | null;

  /* ── Shared types ── */
  metrics?: Array<{
    label: string;
    value: string;
    note?: string | null;
    delta?: string | null;
    trend?: 'up' | 'down' | 'flat' | null;
  }> | null;
  list?: Array<{
    title: string;
    body?: string | null;
    meta?: string | null;
  }> | null;
  callout?: {
    label?: string | null;
    body: string;
    tone?: 'default' | 'attention' | 'ready' | null;
  } | null;

  /* ── Op-output types ── */
  paragraph?: string | null;
  code?: { language?: string | null; code: string } | null;
  timeline?: Array<{
    when: string;
    title: string;
    body?: string | null;
    status?: string | null;
  }> | null;
  hero?: {
    eyebrow?: string | null;
    headline: string;
    subhead?: string | null;
    ctaLabel?: string | null;
  } | null;
  featureGrid?: Array<{ title: string; body: string }> | null;
  pricing?: Array<{
    name: string;
    price: string;
    cadence?: string | null;
    features: string[];
    highlighted?: boolean;
  }> | null;
  embed?: { html: string; aspect?: 'auto' | 'square' | 'video' | null } | null;
  terms?: Array<{ label: string; body: string }> | null;
}

export interface ResearchEntry {
  id: string;
  kind: ResearchThreadKind;
  title: string;
  summary: string;
  sections: ResearchSection[]; /* exactly 4 */
  confidence: number;
  /* Set when the entry was produced from a founder interjection
     rather than the initial research pass. */
  founderPrompt?: string;
  /* Overrides the chrome label in the printed document. Set for
     op outputs so a Strategy Brief reads as "Strategy Brief" not
     "Founder Research Memo". */
  typeLabel?: string;
  createdAt: string;
}
