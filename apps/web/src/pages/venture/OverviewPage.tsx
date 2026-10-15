
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './venture-overview-eclectic.css';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  FileText,
  Layers3,
  MessageSquareText,
  Play,
  Target,
  Workflow,
} from 'lucide-react';

import { PageContainer } from '@/components/primary';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { IVHexMark } from '@/components/shared/IVHexMark';

import {
  useVentureOverview,
} from '@/features/venture-overview/useVentureOverview';

import { useRuns } from '@/lib/hooks/useRuns';
import { useDeliverables } from '@/lib/hooks/useDeliverables';
import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';

import './venture-overview-intelligence.css';

type LooseRecord = Record<string, unknown>;

function readString(
  value: unknown,
  fallback = ''
): string {
  return typeof value === 'string' && value.trim()
    ? value
    : fallback;
}

function formatDate(value: unknown): string {
  const date = new Date(readString(value));

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function getRunTitle(run: LooseRecord): string {
  return readString(
    run.opVerb,
    readString(
      run.objective,
      'Venture operation'
    )
  );
}

function getRunStatus(run: LooseRecord): string {
  return readString(run.status, 'unknown');
}

function getRunPage(run: LooseRecord): string {
  return readString(run.page, 'overview');
}

function getRunTime(run: LooseRecord): string {
  return readString(
    run.completedAt,
    readString(run.startedAt)
  );
}

function getOutputTime(output: LooseRecord): string {
  return readString(
    output.validatedAt,
    readString(output.createdAt)
  );
}

function getOutputPage(output: LooseRecord): string {
  return readString(output.pageId, 'knowledge');
}

function isRunning(status: string): boolean {
  return [
    'running',
    'queued',
    'pending',
    'in_progress',
    'processing',
  ].includes(status);
}

function isActionable(status: string): boolean {
  return status === 'needs_you' ||
    status === 'review_ready';
}

function statusText(status: string): string {
  const labels: Record<string, string> = {
    needs_you: 'Needs your input',
    review_ready: 'Ready for review',
    running: 'Running',
    queued: 'Queued',
    pending: 'Pending',
    in_progress: 'In progress',
    processing: 'Processing',
    done: 'Completed',
    failed: 'Failed',
    validated: 'Validated',
    draft: 'Draft',
  };

  return labels[status] ??
    status.replace(/_/g, ' ');
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
  onAction,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="ivo-section-heading">
      <div>
        {eyebrow && (
          <span className="ivo-eyebrow">{eyebrow}</span>
        )}

        <h2>{title}</h2>

        {subtitle && <p>{subtitle}</p>}
      </div>

      {action && onAction && (
        <button
          type="button"
          className="ivo-text-action"
          onClick={onAction}
        >
          {action}
          <ArrowUpRight size={15} />
        </button>
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <div className="ivo-empty">
      <Icon size={19} strokeWidth={1.6} />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export default function OverviewPage() {
  const { ventureId } = useParams<{
    ventureId: string;
  }>();

  const navigate = useNavigate();

  const openDrawer = useAgentDrawerStore(
    state => state.openDrawer
  );

  const {
    venture,
    journey,
    narrative,
    nextAction,
    activity,
    needsYou,
    isLoading,
    relativeTime,
    stats,
  } = useVentureOverview(ventureId);

  const { runs } = useRuns({
    ventureId,
    hydrate: false,
  });

  const { data: deliverables } = useDeliverables({
    ventureId,
  });

  const runRecords = useMemo(
    () => (runs ?? []) as unknown as LooseRecord[],
    [runs]
  );

  const outputRecords = useMemo(
    () => (deliverables ?? []) as unknown as LooseRecord[],
    [deliverables]
  );

  const runningRuns = useMemo(
    () =>
      runRecords
        .filter(run =>
          isRunning(getRunStatus(run))
        )
        .sort((a, b) =>
          getRunTime(b).localeCompare(getRunTime(a))
        )
        .slice(0, 4),
    [runRecords]
  );

  const recentRuns = useMemo(
    () =>
      [...runRecords]
        .sort((a, b) =>
          getRunTime(b).localeCompare(getRunTime(a))
        )
        .slice(0, 4),
    [runRecords]
  );

  const latestOutputs = useMemo(
    () =>
      [...outputRecords]
        .sort((a, b) =>
          getOutputTime(b).localeCompare(
            getOutputTime(a)
          )
        )
        .slice(0, 4),
    [outputRecords]
  );

  const pendingReviews = needsYou.filter(
    run => isActionable(run.status)
  );

  const nextNeedsYou = needsYou.find(
    run => run.status === 'needs_you'
  );

  const firstReview = pendingReviews[0];

  const nextIncomplete = journey.find(
    step => step.state !== 'complete'
  );

  const progress = stats.totalPages > 0
    ? Math.round(
        (stats.completePages / stats.totalPages) * 100
      )
    : 0;

  const base = `/ventures/${ventureId}`;

  const goTo = (page: string) => {
    navigate(`${base}/${page}`);
  };

  const openRun = (run: LooseRecord) => {
    const id = readString(run.id);

    if (id) {
      openDrawer(id);
    } else {
      goTo(getRunPage(run));
    }
  };

  const handleNextAction = () => {
    if (
      nextAction.severity === 'critical' &&
      nextNeedsYou
    ) {
      openDrawer(nextNeedsYou.id);
      return;
    }

    if (nextAction.primaryTo) {
      navigate(nextAction.primaryTo);
    }
  };

  const handleReview = () => {
    if (firstReview) {
      openDrawer(firstReview.id);
    }
  };

  if (isLoading) {
    return (
      <PageContainer
        width="wide"
        className="ivo-page"
      >
        <LoadingSkeleton
          count={5}
          className="h-28"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      width="wide"
      className="ivo-page"
    >
      {/* Page identity */}

      <header className="ivo-page-header">
        <div className="ivo-page-header__copy">
          <span className="ivo-eyebrow">
            VENTURE / OVERVIEW
          </span>

          <h1>
            {venture?.name ?? 'Your venture'}
          </h1>

          <p>
            Your work, decisions, and next moves
            — in one place.
          </p>
        </div>

        <div className="ivo-page-header__signal">
          <CircleDot size={13} />
          Live workspace
        </div>
      </header>

      {/* Bento workspace */}

      <div className="ivo-bento">

        {/* 01. Founder briefing */}

        <section
          className="ivo-card ivo-card--focus"
          aria-labelledby="ivo-focus-title"
        >
          <div className="ivo-focus__top">
            <span className="ivo-eyebrow">
              YOUR CURRENT FOCUS
            </span>

            <span className="ivo-focus__status">
              <span className="ivo-status-dot" />
              Based on venture activity
            </span>
          </div>

          <div className="ivo-focus__main">
            <h2 id="ivo-focus-title">
              {nextAction.title}
            </h2>

            <p>
              {nextAction.why || narrative}
            </p>
          </div>

          <div className="ivo-focus__bottom">
            <button
              type="button"
              className="ivo-primary-action"
              onClick={handleNextAction}
            >
              {nextAction.primaryLabel}
              <ArrowUpRight size={16} />
            </button>

            <span className="ivo-focus__summary">
              {stats.completePages} of {stats.totalPages}
              {' '}venture stages complete
            </span>
          </div>
        </section>

        {/* 02. Venture context */}

        <section
          className="ivo-card ivo-card--context"
          aria-labelledby="ivo-context-title"
        >
          <div className="ivo-card__top">
            <BookOpen
              size={20}
              className="ivo-card__icon"
            />

            <ArrowUpRight
              size={17}
              className="ivo-card__corner"
            />
          </div>

          <div>
            <span className="ivo-eyebrow">
              VENTURE CONTEXT
            </span>

            <h2 id="ivo-context-title">
              What has changed?
            </h2>

            <p>
              Add research, customer feedback,
              new evidence, or an important
              change in direction.
            </p>
          </div>

          <button
            type="button"
            className="ivo-inline-action"
            onClick={() => goTo('knowledge')}
          >
            Update venture context
            <ArrowRight size={15} />
          </button>
        </section>

        {/* 03. Founder reviews */}

        <section
          className="ivo-card ivo-card--reviews"
          aria-labelledby="ivo-reviews-title"
        >
          <div className="ivo-card__top">
            <MessageSquareText
              size={20}
              className="ivo-card__icon"
            />

            <span className="ivo-count">
              {pendingReviews.length}
            </span>
          </div>

          <div>
            <span className="ivo-eyebrow">
              FOUNDER DECISIONS
            </span>

            <h2 id="ivo-reviews-title">
              {pendingReviews.length > 0
                ? 'Your input is needed'
                : 'Nothing waiting on you'}
            </h2>

            <p>
              {pendingReviews.length > 0
                ? `${pendingReviews.length} ${
                    pendingReviews.length === 1
                      ? 'operation needs'
                      : 'operations need'
                  } review or additional context.`
                : 'Operations requiring your decision will appear here.'}
            </p>
          </div>

          {pendingReviews.length > 0 && (
            <button
              type="button"
              className="ivo-inline-action"
              onClick={handleReview}
            >
              Review next item
              <ArrowRight size={15} />
            </button>
          )}
        </section>

        {/* 04. Active operations */}

        <section
          className="ivo-card ivo-card--operations"
          aria-labelledby="ivo-running-title"
        >
          <SectionHeading
            eyebrow="LIVE EXECUTION"
            title="Operations in progress"
            subtitle="Work currently moving through your venture."
          />

          {runningRuns.length === 0 ? (
            <EmptyState
              icon={Workflow}
              title="No active operations"
              description="Running OPS will appear here when execution begins."
            />
          ) : (
            <div className="ivo-run-list">
              {runningRuns.map((run, index) => {
                const status = getRunStatus(run);
                const page = getRunPage(run);
                const id = readString(
                  run.id,
                  `run-${index}`
                );

                return (
                  <button
                    type="button"
                    className="ivo-run"
                    key={id}
                    onClick={() => openRun(run)}
                  >
                    <IVHexMark
                      size="sm"
                      animated
                    />

                    <span className="ivo-run__content">
                      <strong>
                        {getRunTitle(run)}
                      </strong>

                      <span>
                        {page} · {statusText(status)}
                      </span>
                    </span>

                    <ChevronRight size={16} />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* 05. Journey / progress */}

        <section
          className="ivo-card ivo-card--journey"
          aria-labelledby="ivo-journey-title"
        >
          <SectionHeading
            eyebrow="VENTURE PROGRESS"
            title="From idea to venture"
            subtitle="Stage completion based on validated outputs."
          />

          <div className="ivo-journey-summary">
            <strong>{progress}%</strong>
            <span>
              {stats.completePages} of {stats.totalPages}
              {' '}stages complete
            </span>
          </div>

          <div
            className="ivo-progress-track"
            aria-label={`${progress}% of venture stages complete`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <span
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="ivo-journey-list">
            {journey.map(step => (
              <button
                key={step.key}
                type="button"
                className={[
                  'ivo-journey-item',
                  `ivo-journey-item--${step.state}`,
                ].join(' ')}
                onClick={() => goTo(step.key)}
              >
                <span className="ivo-journey-item__mark">
                  {step.state === 'complete' ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <CircleDot size={15} />
                  )}
                </span>

                <span className="ivo-journey-item__name">
                  {step.label}
                </span>

                <span className="ivo-journey-item__count">
                  {step.validatedCount}/{step.opTarget}
                </span>

                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </section>

        {/* 06. Latest outputs */}

        <section
          className="ivo-card ivo-card--outputs"
          aria-labelledby="ivo-outputs-title"
        >
          <SectionHeading
            eyebrow="KNOWLEDGE CREATED"
            title="Latest outputs"
            subtitle="Recent deliverables recorded by your OPS."
            action="Open knowledge"
            onAction={() => goTo('knowledge')}
          />

          {latestOutputs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No outputs yet"
              description="Documents and deliverables will appear as operations produce them."
            />
          ) : (
            <div className="ivo-output-grid">
              {latestOutputs.map((output, index) => {
                const id = readString(
                  output.id,
                  `output-${index}`
                );

                const title = readString(
                  output.title,
                  'Untitled deliverable'
                );

                const page = getOutputPage(output);
                const status = readString(
                  output.status,
                  'saved'
                );

                return (
                  <button
                    key={id}
                    type="button"
                    className="ivo-output"
                    onClick={() => goTo(page)}
                  >
                    <span className="ivo-output__preview">
                      <span className="ivo-output__paper">
                        <FileText size={21} />

                        <span />
                        <span />
                        <span />
                      </span>
                    </span>

                    <span className="ivo-output__details">
                      <strong title={title}>
                        {title}
                      </strong>

                      <span>
                        {page} · {statusText(status)}
                      </span>

                      <small>
                        {formatDate(getOutputTime(output))}
                      </small>
                    </span>

                    <ArrowUpRight
                      size={15}
                      className="ivo-output__arrow"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* 07. Recommended focus */}

        <section
          className="ivo-card ivo-card--recommended"
          aria-labelledby="ivo-recommended-title"
        >
          <div className="ivo-card__top">
            <Target
              size={20}
              className="ivo-card__icon"
            />

            <span className="ivo-eyebrow">
              WHAT'S NEXT
            </span>
          </div>

          <h2 id="ivo-recommended-title">
            {nextIncomplete
              ? `Make progress in ${nextIncomplete.label}`
              : 'Keep learning from your outcomes'}
          </h2>

          <p>
            {nextIncomplete
              ? `${nextIncomplete.validatedCount} of ${
                  nextIncomplete.opTarget
                } expected validated outputs are recorded for this stage.`
              : 'Your defined venture stages are complete. Continue tracking evidence and results.'}
          </p>

          <button
            type="button"
            className="ivo-inline-action"
            onClick={() =>
              goTo(nextIncomplete?.key ?? 'outcomes')
            }
          >
            {nextIncomplete
              ? `Explore ${nextIncomplete.label} OPS`
              : 'View outcomes'}

            <ArrowRight size={15} />
          </button>
        </section>

        {/* 08. Recent OPS */}

        <section
          className="ivo-card ivo-card--recent-ops"
          aria-labelledby="ivo-recent-ops-title"
        >
          <SectionHeading
            eyebrow="EXECUTION HISTORY"
            title="Latest operations"
            subtitle="The most recent OPS records."
          />

          {recentRuns.length === 0 ? (
            <EmptyState
              icon={Play}
              title="No operations recorded"
              description="Your execution history will build as OPS run."
            />
          ) : (
            <div className="ivo-recent-list">
              {recentRuns.map((run, index) => {
                const id = readString(
                  run.id,
                  `recent-${index}`
                );

                const status = getRunStatus(run);

                return (
                  <button
                    key={id}
                    type="button"
                    className="ivo-recent-run"
                    onClick={() => openRun(run)}
                  >
                    <span className="ivo-recent-run__icon">
                      {isRunning(status) ? (
                        <IVHexMark size="xs" />
                      ) : status === 'done' ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Clock3 size={16} />
                      )}
                    </span>

                    <span>
                      <strong>
                        {getRunTitle(run)}
                      </strong>

                      <small>
                        {statusText(status)}
                        {' · '}
                        {getRunPage(run)}
                      </small>
                    </span>

                    <ArrowUpRight size={15} />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* 09. Changes and decisions */}

        <section
          className="ivo-card ivo-card--activity"
          aria-labelledby="ivo-activity-title"
        >
          <SectionHeading
            eyebrow="VENTURE HISTORY"
            title="Recent changes"
            subtitle="A timeline of recorded activity and outputs."
            action="View outcomes"
            onAction={() => goTo('outcomes')}
          />

          {activity.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="Your timeline starts here"
              description="Completed work and saved evidence will build your venture history."
            />
          ) : (
            <div className="ivo-activity-list">
              {activity.slice(0, 6).map(item => (
                <div
                  className={[
                    'ivo-activity-item',
                    `ivo-activity-item--${item.tone}`,
                  ].join(' ')}
                  key={item.id}
                >
                  <span className="ivo-activity-item__dot" />

                  <div>
                    <p>{item.text}</p>

                    <time dateTime={item.timestamp}>
                      {relativeTime(item.timestamp)}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 10. Knowledge entry */}

        <section
          className="ivo-card ivo-card--knowledge"
          aria-labelledby="ivo-knowledge-title"
        >
          <div className="ivo-card__top">
            <Layers3
              size={20}
              className="ivo-card__icon"
            />

            <ArrowUpRight
              size={17}
              className="ivo-card__corner"
            />
          </div>

          <div>
            <span className="ivo-eyebrow">
              CONTINUOUS LEARNING
            </span>

            <h2 id="ivo-knowledge-title">
              Keep your venture informed.
            </h2>

            <p>
              Bring new findings, research,
              and customer evidence back
              into the workspace.
            </p>
          </div>

          <button
            type="button"
            className="ivo-inline-action"
            onClick={() => goTo('knowledge')}
          >
            Open knowledge
            <ArrowRight size={15} />
          </button>
        </section>

      </div>
    </PageContainer>
  );
}
