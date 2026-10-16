import { Section, SectionGrid } from '@/components/layout';
import { CollectionView } from '@/components/collections';
import { ArtifactFrame } from '@/components/artifacts';
import { OpsGrid } from '@/features/venture-actions';
import { getActionsForPage } from '@/features/venture-actions/page-actions';
import { SignalHero } from '../SignalHero';
import { OutcomeCards } from '../OutcomeCards';
import { DecisionImpactTable } from '../DecisionImpactTable';
import { LearningTimeline } from '../LearningTimeline';
import { MetricGrid } from '../MetricGrid';
import { DataTable } from '../DataTable';
import { ShareFeedbackTab } from '../ShareFeedbackTab';
import { ResearchBar } from '../ResearchBar';
import { ConnectorsList } from '../ConnectorsList';
import { DependencyBanner } from '../DependencyBanner';
import { DeliverablesSection } from '../DeliverablesSection';
import { DeliverableHistoryView } from '../DeliverableHistoryView';
import { getIcon } from '../iconMap';
import { ArchetypeRenderer } from './ArchetypeRenderer';
import type { VentureSection } from './types';


/* ---------- Empty-section guard ----------
   A section with no content is a bug, not a feature.
   Render nothing rather than an empty shell. */

function isSectionEmpty(section: VentureSection): boolean {
  switch (section.type) {
    case 'grid':
      return section.cards.length === 0;
    case 'narrative':
      return !section.title && !section.body;
    case 'metric':
      return section.metrics.length === 0;
    case 'collection':
      return section.items.length === 0 && !section.kanbanColumns?.length;
    case 'artifact':
      return false;
    case 'decision':
      return section.cards.length === 0;
    case 'tools':
      /* tools are always resolved from the registry; never empty */
      return false;
    case 'feedback':
      return false;
    case 'deliverable-history':
      return false;
    case 'dependencies':
      return false;
    case 'deliverables':
      return false;
    case 'research-bar':
      return false;
    case 'connectors':
      return section.connectors.length === 0;
    case 'signal-hero':
      return !section.headline;
    case 'outcome-cards':
      return section.cards.length === 0;
    case 'decision-impact':
      return section.rows.length === 0;
    case 'learning-timeline':
      return section.events.length === 0;
    case 'metric-grid':
      return section.metrics.length === 0;
    case 'data-table':
      return section.rows.length === 0;
    default:
      return false;
  }
}

interface SectionRendererProps {
  section: VentureSection;
  ventureId?: string;
  /** The parent page's key — used by tools sections to look up actions. */
  pageKey: string;
  /** True when the page has an unmet hard dependency. */
  pageBlocked?: boolean;
}

/**
 * SectionRenderer — dispatches on `section.type`.
 * Seven section types map to six content families.
 */
export function SectionRenderer({
  section,
  ventureId,
  pageKey,
  pageBlocked = false,
}: SectionRendererProps) {
  if (isSectionEmpty(section)) return null;

  switch (section.type) {
    case 'grid':
      return <GridSectionView section={section} />;
    case 'narrative':
      return <NarrativeView section={section} />;
    case 'metric':
      return <MetricView section={section} />;
    case 'collection':
      return <CollectionViewWrapper section={section} />;
    case 'artifact':
      return <ArtifactView section={section} />;
    case 'decision':
      return <DecisionView section={section} />;
    case 'tools':
      return <ToolsView section={section} ventureId={ventureId} pageKey={pageKey} pageBlocked={pageBlocked} />;
    case 'feedback':
      return <FeedbackView section={section} />;
    case 'deliverable-history':
      return <DeliverableHistoryView section={section} />;
    case 'dependencies':
      return <DependencyBanner section={section} />;
    case 'deliverables':
      return <DeliverablesSection section={section} pageId={pageKey} />;
    case 'research-bar':
      return <ResearchBar section={section} />;
    case 'connectors':
      return <ConnectorsList section={section} />;
    case 'signal-hero':
      return <SignalHero section={section} />;
    case 'outcome-cards':
      return <OutcomeCards section={section} />;
    case 'decision-impact':
      return <DecisionImpactTable section={section} />;
    case 'learning-timeline':
      return <LearningTimeline section={section} />;
    case 'metric-grid':
      return <MetricGrid section={section} />;
    case 'data-table':
      return <DataTable section={section} />;
    default:
      return null;
  }
}

/* ---------- Grid ---------- */
function GridSectionView({
  section,
}: {
  section: Extract<VentureSection, { type: 'grid' }>;
}) {
  return (
    <SectionGrid>
      {section.cards.map((card) => (
        <ArchetypeRenderer key={card.id} card={card} />
      ))}
    </SectionGrid>
  );
}

/* ---------- Narrative ---------- */
function NarrativeView({
  section,
}: {
  section: Extract<VentureSection, { type: 'narrative' }>;
}) {
  const Icon = getIcon(section.icon);
  return (
    <article className="section-narrative">
      <header className="section-narrative__head">
        <span className="section-narrative__label">
          {Icon && <Icon className="venture-bento__icon" />}
          {section.label}
        </span>
        {section.status && (
          <span className={`venture-bento__status is-${section.status}`}>
            {section.status.replace('_', ' ')}
          </span>
        )}
      </header>
      {section.kicker && (
        <p className="section-narrative__kicker">{section.kicker}</p>
      )}
      <h2 className="section-narrative__title">{section.title}</h2>
      <p className="section-narrative__body">{section.body}</p>
    </article>
  );
}

/* ---------- Metric ---------- */
function MetricView({
  section,
}: {
  section: Extract<VentureSection, { type: 'metric' }>;
}) {
  const Icon = getIcon(section.icon);
  return (
    <section className="section-metric-row">
      {section.label && (
        <span className="section-metric-row__label">
          {Icon && <Icon className="venture-bento__icon" />}
          {section.label}
        </span>
      )}
      <div className="section-metric-row__items">
        {section.metrics.map((m) => (
          <div key={m.label} className="section-metric-row__item">
            <span className="section-metric-row__item-label">{m.label}</span>
            <span className="section-metric-row__item-value">{m.value}</span>
            {m.delta && (
              <span
                className={`section-metric-row__delta is-${m.trend ?? 'flat'}`}
              >
                {m.delta}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Collection ---------- */
function CollectionViewWrapper({
  section,
}: {
  section: Extract<VentureSection, { type: 'collection' }>;
}) {
  const Icon = getIcon(section.icon);
  return (
    <Section
      id={section.id}
      title={section.label}
      icon={Icon ? <Icon /> : undefined}
    >
      <CollectionView
        mode={section.mode}
        items={section.items}
        kanbanColumns={section.kanbanColumns}
        tableColumns={section.tableColumns}
      />
    </Section>
  );
}

/* ---------- Artifact ----------
   No icon on this one — the ArtifactFrame header owns its own
   identity. This is the only view that does NOT use getIcon. */
function ArtifactView({
  section,
}: {
  section: Extract<VentureSection, { type: 'artifact' }>;
}) {
  return (
    <ArtifactFrame
      title={section.title}
      eyebrow={section.eyebrow}
      status={section.status}
      views={[section.view]}
      preview={section.previewContent}
      code={section.code}
      codeLanguage={section.codeLanguage}
      files={section.files}
    />
  );
}

/* ---------- Decision ---------- */
function DecisionView({
  section,
}: {
  section: Extract<VentureSection, { type: 'decision' }>;
}) {
  return (
    <SectionGrid>
      {section.cards.map((card) => (
        <div
          key={card.id}
          data-size={
            card.span === 12
              ? 'full'
              : card.span >= 7
              ? 'wide'
              : 'half'
          }
        >
          <ArchetypeRenderer card={card} />
        </div>
      ))}
    </SectionGrid>
  );
}

/* ---------- Tools ---------- */
function ToolsView({
  section,
  ventureId,
  pageKey,
  pageBlocked,
}: {
  section: Extract<VentureSection, { type: 'tools' }>;
  ventureId?: string;
  pageKey: string;
  pageBlocked?: boolean;
}) {
  /* Resolve actionIds:
   *  · If the section specifies them explicitly → use those.
   *  · Otherwise → read them from the registry (page-actions.ts).
   *    The configs are layout only; page-actions is the source of truth. */
  const allActionIds =
    section.actionIds && section.actionIds.length > 0
      ? section.actionIds
      : getActionsForPage(pageKey).map((a) => a.id);

  return (
    <div className="operations-row" id={section.id}>
      <OpsGrid
        allActionIds={allActionIds}
        recommendedActionIds={section.recommendedActionIds}
        moreActionIds={section.moreActionIds}
        pageId={pageKey}
        ventureId={ventureId}
        pageBlocked={pageBlocked}
      />
    </div>
  );
}

/* ---------- Feedback ---------- */
function FeedbackView({
  section,
}: {
  section: Extract<VentureSection, { type: 'feedback' }>;
}) {
  const Icon = getIcon(section.icon);
  return (
    <Section
      id={section.id}
      title={section.label}
      icon={Icon ? <Icon /> : undefined}
    >
      <ShareFeedbackTab />
    </Section>
  );
}
