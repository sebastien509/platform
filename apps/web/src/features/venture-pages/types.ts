import type { VenturePageId } from '@/lib/types';

export type { VenturePageId } from '@/lib/types';

/* ============================================================
   AGENT
   ============================================================ */

export interface AgentSpec {
  name: string;
  role: string;
  status: 'working' | 'needs_you' | 'review_ready' | 'done' | 'idle';
  activity: string;
}

/* ============================================================
   CARDS — the four archetypes
   ============================================================
   Every card in a grid section declares an archetype. The
   archetype decides the card's structure — not decoration.
   Default is 'artifact' for backward compatibility.

   · artifact — a produced thing (PRD, brief, positioning,
                plan). Title + body + supporting metrics.
   · metric   — a number that matters. Value is the hero.
   · model    — a diagram. Flow, funnel, stack, or sequence.
                The visual IS the content.
   · decision — something the founder must resolve. Action
                is dominant, tinted amber.
   ============================================================ */

export type CardArchetype = 'artifact' | 'metric' | 'model' | 'decision';

export type CardStatus = 'draft' | 'needs_review' | 'approved' | 'published';

export interface CardMetric {
  label: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
}

/* ---------- Model payload ---------- */

export type ModelKind = 'flow' | 'funnel' | 'stack' | 'sequence';

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
  /** 0–100 — bar width */
  percent?: number;
  status?: CardStatus;
}

/* ---------- Card ---------- */

export interface CardSpec {
  id: string;
  label: string;
  /** Lucide icon name — resolved via iconMap. Optional. */
  icon?: string;
  status?: CardStatus;
  /** 12-col grid span. Asymmetry comes from here. */
  span: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

  /** The archetype decides the card's structure. Default: 'artifact'. */
  archetype?: CardArchetype;

  /* ---------- Common content ---------- */

  /** Artifact + Model + Decision: the card's headline. */
  title?: string;
  /** Artifact + Decision: the card's body copy. */
  body?: string;
  /** Artifact: small metric chips. Metric: the hero numbers. */
  metrics?: CardMetric[];

  /* ---------- Model payload ---------- */

  model?: ModelKind;
  steps?: ModelStep[];
  layers?: ModelLayer[];
  stages?: ModelStage[];

  /* ---------- Decision payload ---------- */

  prompt?: string;
  options?: Array<{
    label: string;
    value: string;
    primary?: boolean;
    destructive?: boolean;
  }>;
  actionLabel?: string;

  /* ---------- Presentation modifiers ---------- */

  /** Roomy = more padding. Compact = less. Interactive = hover-lift. */
  variant?: 'default' | 'roomy' | 'compact' | 'summary' | 'interactive';

  /** Optional inline action IDs — rendered as buttons in the card footer. */
  actions?: string[];
}

/* ============================================================
   SECTIONS — whole-tab shapes
   ============================================================ */

export type SectionKind =
  | 'grid'
  | 'narrative'
  | 'metric-row'
  | 'timeline'
  | 'kanban'
  | 'checklist'
  | 'list'
  | 'comparison';

export interface NarrativeSection {
  kind: 'narrative';
  id: string;
  label: string;
  kicker?: string;
  title: string;
  body: string;
  meta?: string;
  status?: CardStatus;
  icon?: string;
}

export interface MetricRowSection {
  kind: 'metric-row';
  id: string;
  label?: string;
  icon?: string;
  metrics: CardMetric[];
}

export interface TimelineItem {
  id: string;
  when: string;
  title: string;
  body?: string;
  status?: CardStatus;
  meta?: string;
  icon?: string;
  featured?: boolean;
}

export interface TimelineSection {
  kind: 'timeline';
  id: string;
  label?: string;
  icon?: string;
  items: TimelineItem[];
}

export interface KanbanSection {
  kind: 'kanban';
  id: string;
  label?: string;
  icon?: string;
  columns: Array<{
    id: string;
    title: string;
    meta?: string;
    items: Array<{ id: string; title: string; body?: string; meta?: string }>;
  }>;
}

export interface ChecklistSection {
  kind: 'checklist';
  id: string;
  label?: string;
  icon?: string;
  items: Array<{
    id: string;
    title: string;
    body?: string;
    status?: 'todo' | 'doing' | 'done' | 'blocked';
    owner?: string;
  }>;
}

export interface ListSection {
  kind: 'list';
  id: string;
  label?: string;
  icon?: string;
  items: Array<{
    id: string;
    title: string;
    body?: string;
    status?: CardStatus;
    meta?: string;
    icon?: string;
  }>;
}

export interface ComparisonSection {
  kind: 'comparison';
  id: string;
  label?: string;
  icon?: string;
  variants: Array<{
    id: string;
    title: string;
    body?: string;
    metrics?: CardMetric[];
    winning?: boolean;
  }>;
}

export interface GridSection {
  kind: 'grid';
  id: string;
  /** Optional Lucide icon name. */
  icon?: string;
  /** Optional section header text. */
  label?: string;
  cards: CardSpec[];
}

export type Section =
  | GridSection
  | NarrativeSection
  | MetricRowSection
  | TimelineSection
  | KanbanSection
  | ChecklistSection
  | ListSection
  | ComparisonSection;

/* ============================================================
   TABS + PAGE
   ============================================================ */

export interface TabSpec {
  id: string;
  label: string;
  /** Optional Lucide icon name. */
  icon?: string;
  sections: Section[];
}

export interface PageSpec {
  id: VenturePageId;
  eyebrow: string;
  title: string;
  lede: string;
  agent: AgentSpec;
  tabs: TabSpec[];
  hasSources?: boolean;
}

export const STATUS_LABEL: Record<AgentSpec['status'], string> = {
  working: 'Working',
  needs_you: 'Needs you',
  review_ready: 'Review ready',
  done: 'Done',
  idle: 'Idle',
};

export const STATUS_SLUG: Record<AgentSpec['status'], string> = {
  working: 'working',
  needs_you: 'needs-you',
  review_ready: 'review-ready',
  done: 'done',
  idle: 'paused',
};
