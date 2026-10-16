import type { ReactNode } from 'react';
import type { CollectionMode } from '@/components/collections';
import type { ArtifactView, ArtifactFile } from '@/components/artifacts';

/* ============================================================
   VENTURE PAGE ENGINE — TYPES
   ============================================================ */

export interface AgentSpec {
  name: string;
  role: string;
  status: 'working' | 'needs_you' | 'review_ready' | 'done' | 'idle';
  activity: string;
}

export interface PageState {
  stage: string;
  detail?: string;
  pendingCount?: number;
  tone?: 'default' | 'attention' | 'ready';
}

export type CardStatus = 'draft' | 'needs_review' | 'approved' | 'published';
export type CardArchetype = 'artifact' | 'metric' | 'model' | 'decision';

export interface CardMetric {
  label: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
}

export interface ModelStep {
  id: string;
  label: string;
  description?: string;
  status?: CardStatus;
}

export interface ModelLayer {
  id: string;
  label: string;
  description?: string;
  status?: CardStatus;
}

export interface ModelStage {
  id: string;
  label: string;
  count?: string;
  value?: string;
  percent?: number;
  status?: CardStatus;
}

export interface CardSpec {
  id: string;
  label: string;
  icon?: string;
  status?: CardStatus;
  span: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  archetype?: CardArchetype;
  title?: string;
  body?: string;
  metrics?: CardMetric[];
  model?: 'flow' | 'funnel' | 'stack' | 'sequence';
  steps?: ModelStep[];
  layers?: ModelLayer[];
  stages?: ModelStage[];
  prompt?: string;
  options?: Array<{ label: string; value: string; primary?: boolean; destructive?: boolean }>;
  variant?: 'default' | 'roomy' | 'compact' | 'summary' | 'interactive';
  actions?: string[];
}

/* ============================================================
   SECTION BASE
   ============================================================ */

export type SectionLayout = 'full' | 'wide' | 'half' | 'compact';

export interface SectionBase {
  id: string;
  label?: string;
  icon?: string;
  layout?: SectionLayout;
}

/* ============================================================
   OPS / WORK SECTIONS
   ============================================================ */

export interface GridSection extends SectionBase {
  type: 'grid';
  cards: CardSpec[];
}

export interface NarrativeSection extends SectionBase {
  type: 'narrative';
  kicker?: string;
  title: string;
  body: string;
  status?: CardStatus;
}

export interface MetricSection extends SectionBase {
  type: 'metric';
  metrics: CardMetric[];
}

export interface CollectionSection extends SectionBase {
  type: 'collection';
  mode: CollectionMode;
  items: import('@/components/collections').CollectionItem[];
  kanbanColumns?: import('@/components/collections').CollectionColumn[];
  tableColumns?: import('@/components/collections').CollectionTableColumn[];
}

export interface ArtifactSection extends SectionBase {
  type: 'artifact';
  view: ArtifactView;
  title: string;
  eyebrow?: string;
  status?: CardStatus;
  code?: string;
  codeLanguage?: string;
  files?: ArtifactFile[];
  previewContent?: ReactNode;
}

export interface DecisionSection extends SectionBase {
  type: 'decision';
  cards: CardSpec[];
}

export interface FeedbackSection extends SectionBase {
  type: 'feedback';
  surfaceFilter?: import('@/lib/share').SurfaceId;
}

export interface ToolsSection extends SectionBase {
  type: 'tools';
  /**
   * Optional override. When omitted, ops are resolved at render time
   * from page-actions.ts via getActionsForPage(pageKey).
   * page-actions.ts IS the registry — configs are layout only.
   */
  actionIds?: string[];
  recommendedActionIds?: string[];
  moreActionIds?: string[];
}

export interface DeliverableHistorySection extends SectionBase {
  type: 'deliverable-history';
}

/* ============================================================
   DEPENDENCIES + DELIVERABLES
   ============================================================ */

export interface PageDependency {
  opId: string;
  label: string;
  pageId: string;
}

export interface DependenciesSection extends SectionBase {
  type: 'dependencies';
  hard?: PageDependency[];
  soft?: string[];
}

export interface DeliverablesSection extends SectionBase {
  type: 'deliverables';
  opIds?: string[];
}

/* ============================================================
   SYSTEM SECTIONS
   ============================================================ */

export type ResearchMode = 'venture' | 'external' | 'compare' | 'files';

export interface ResearchBarSection extends SectionBase {
  type: 'research-bar';
  modes?: ResearchMode[];
  placeholder?: string;
  hint?: string;
}

export interface ConnectorDef {
  id: string;
  name: string;
  category: 'code' | 'deploy' | 'crm' | 'email' | 'calendar' | 'payments' | 'analytics' | 'storage' | 'comms';
  status: 'connected' | 'available' | 'needs_reauth' | 'error';
  usedBy?: string[];
  permissions?: string[];
  accountLabel?: string;
  icon?: string;
}

export interface ConnectorsSection extends SectionBase {
  type: 'connectors';
  connectors: ConnectorDef[];
}

export interface SignalHeroSection extends SectionBase {
  type: 'signal-hero';
  eyebrow?: string;
  headline: string;
  body: string;
  stats?: Array<{
    label: string;
    value: string;
    tone?: 'default' | 'positive' | 'attention' | 'negative';
  }>;
}

export type OutcomeState = 'positive' | 'mixed' | 'negative' | 'inconclusive' | 'pending';

export interface OutcomeCardSpec {
  id: string;
  page: string;
  state: OutcomeState;
  title: string;
  hypothesis: string;
  expected?: Array<{ label: string; value: string }>;
  actual?: Array<{ label: string; value: string }>;
  confidenceFrom?: number;
  confidenceTo?: number;
  decision?: string;
  evidence?: string[];
}

export interface OutcomeCardsSection extends SectionBase {
  type: 'outcome-cards';
  cards: OutcomeCardSpec[];
}

export interface DecisionImpactSection extends SectionBase {
  type: 'decision-impact';
  rows: Array<{
    id: string;
    decision: string;
    expected: string;
    actual: string;
    impact: OutcomeState;
  }>;
}

export interface LearningTimelineSection extends SectionBase {
  type: 'learning-timeline';
  events: Array<{
    id: string;
    when: string;
    title: string;
    body?: string;
    confidenceFrom?: number;
    confidenceTo?: number;
  }>;
}

export interface DataTableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right';
}

export interface DataTableSection extends SectionBase {
  type: 'data-table';
  columns: DataTableColumn[];
  rows: Array<Record<string, any>>;
}

export interface MetricGridSection extends SectionBase {
  type: 'metric-grid';
  columns?: 2 | 3 | 4;
  metrics: Array<{
    label: string;
    value: string;
    delta?: string;
    trend?: 'up' | 'down' | 'flat';
    source?: string;
  }>;
}

/* ============================================================
   SECTION UNION
   ============================================================ */

export type VentureSection =
  | GridSection
  | NarrativeSection
  | MetricSection
  | CollectionSection
  | ArtifactSection
  | DecisionSection
  | FeedbackSection
  | ToolsSection
  | DeliverableHistorySection
  | DependenciesSection
  | DeliverablesSection
  | ResearchBarSection
  | ConnectorsSection
  | SignalHeroSection
  | OutcomeCardsSection
  | DecisionImpactSection
  | LearningTimelineSection
  | DataTableSection
  | MetricGridSection;

/* ============================================================
   TAB + PAGE CONFIG
   ============================================================ */

export interface TabConfig {
  id: string;
  label: string;
  sections: VentureSection[];
}

export interface VenturePageConfig {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  pageState?: PageState;
  agent?: AgentSpec;
  hasSources?: boolean;
  sections?: VentureSection[];
  tabs?: TabConfig[];
}
