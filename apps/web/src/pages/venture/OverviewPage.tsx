import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/primary';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import {
  useVentureOverview,
  type JourneyStep,
  type NextAction,
} from '@/features/venture-overview/useVentureOverview';
import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import { cn } from '@/lib/utils/cn';
import {
  ArrowRight, AlertTriangle, Sparkles, Check, Clock, Play,
  Layers3, Activity, CheckCircle2, ChevronRight, Target,
  CircleDot, FileCheck2, Workflow, ArrowUpRight,
} from 'lucide-react';
import './venture-overview-electric.css';

type Severity = NextAction['severity'];
const SEVERITY_ICON = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  info: Sparkles,
  none: Check,
};
const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Action required',
  warning: 'Recommended focus',
  info: 'Next step',
  none: 'Up to date',
};

function JourneyTile({ step, onClick }: { step: JourneyStep; onClick: () => void }) {
  const statusLabel = step.state === 'complete' ? 'Complete'
    : step.state === 'needs_review' ? 'Needs review'
    : step.state === 'in_progress' ? 'In progress' : 'Not started';
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('ov2-stage', `ov2-stage--${step.state}`)}
      aria-label={`${step.label}, ${statusLabel}, ${step.validatedCount} of ${step.opTarget} validated outputs`}
    >
      <span className="ov2-stage__top">
        <span className="ov2-stage__name">{step.label}</span>
        {step.state === 'complete'
          ? <CheckCircle2 size={15} aria-hidden="true" />
          : <ChevronRight size={15} aria-hidden="true" />}
      </span>
      <span className="ov2-stage__track" aria-hidden="true">
        <span style={{ width: `${step.percent}%` }} />
      </span>
      <span className="ov2-stage__bottom">
        <span>{statusLabel}</span>
        <span>{step.validatedCount}/{step.opTarget}</span>
      </span>
    </button>
  );
}

function NextActionCard({
  action,
  onAction,
}: {
  action: NextAction;
  onAction: () => void;
}) {
  const Icon = SEVERITY_ICON[action.severity];
  return (
    <section className={cn('ov2-next', `ov2-next--${action.severity}`)} aria-labelledby="ov2-next-title">
      <div className="ov2-next__intro">
        <span className="ov2-next__icon"><Icon size={18} aria-hidden="true" /></span>
        <div>
          <p className="ov2-eyebrow">{SEVERITY_LABEL[action.severity]}</p>
          <h2 id="ov2-next-title">{action.title}</h2>
        </div>
      </div>
      <p className="ov2-next__description">{action.why}</p>
      <button type="button" className="ov2-primary-action" onClick={onAction}>
        {action.primaryLabel}<ArrowRight size={15} aria-hidden="true" />
      </button>
    </section>
  );
}

export default function OverviewPage() {
  const { ventureId } = useParams<{ ventureId: string }>();
  const navigate = useNavigate();
  const {
    venture, journey, narrative, nextAction, activity, needsYou,
    isLoading, relativeTime, stats,
  } = useVentureOverview(ventureId);
  const openDrawer = useAgentDrawerStore((s) => s.openDrawer);

  if (isLoading) {
    return (
      <PageContainer width="wide">
        <LoadingSkeleton count={4} className="h-24" />
      </PageContainer>
    );
  }

  // The funnel percentage measures completed pages, NOT business health.
  const funnelPercent = stats.totalPages > 0
    ? Math.round((stats.completePages / stats.totalPages) * 100) : 0;
  const reviewedCount = journey.filter((s) => s.state === 'needs_review').length;
  const nextNeedsYou = needsYou.find((run) => run.status === 'needs_you');
  const goToAction = () => {
    // This action actually opens the relevant run instead of merely navigating
    // to the current overview route.
    if (nextAction.severity === 'critical' && nextNeedsYou) {
      openDrawer(nextNeedsYou.id);
      return;
    }
    navigate(nextAction.primaryTo);
  };

  return (
    <PageContainer width="wide" className="ov2-page">
      <header className="ov2-hero">
        <div className="ov2-hero__content">
          <div className="ov2-hero__kicker"><CircleDot size={13} /> Venture workspace</div>
          <h1>{venture?.name ?? 'Venture overview'}</h1>
          <p>{narrative}</p>
          <div className="ov2-hero__shortcuts">
            <button type="button" onClick={() => navigate(`/ventures/${ventureId}/strategy`)}>
              Open Strategy <ArrowUpRight size={14} />
            </button>
            <button type="button" onClick={() => navigate(`/ventures/${ventureId}/knowledge`)}>
              Venture knowledge <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
        <div className="ov2-hero__score" aria-label={`${funnelPercent}% of funnel pages complete`}>
          <span className="ov2-hero__score-label">Funnel completion</span>
          <strong>{funnelPercent}<span>%</span></strong>
          <div className="ov2-hero__score-track"><span style={{ width: `${funnelPercent}%` }} /></div>
          <small>{stats.completePages} of {stats.totalPages} workflow pages complete</small>
        </div>
      </header>

      <div className="ov2-summary" aria-label="Venture execution summary">
        <div className="ov2-summary__item"><span className="ov2-summary__icon is-blue"><Workflow size={18}/></span><div><strong>{stats.runs}</strong><span>OPS runs</span></div></div>
        <div className="ov2-summary__item"><span className="ov2-summary__icon is-violet"><FileCheck2 size={18}/></span><div><strong>{stats.outputs}</strong><span>Outputs</span></div></div>
        <div className="ov2-summary__item"><span className="ov2-summary__icon is-mint"><CheckCircle2 size={18}/></span><div><strong>{stats.completePages}/{stats.totalPages}</strong><span>Pages complete</span></div></div>
        <div className="ov2-summary__item"><span className="ov2-summary__icon is-amber"><AlertTriangle size={18}/></span><div><strong>{needsYou.length}</strong><span>Need review</span></div></div>
      </div>

      <div className="ov2-focus-grid">
        <NextActionCard action={nextAction} onAction={goToAction} />
        <section className="ov2-insight" aria-labelledby="ov2-progress-title">
          <div className="ov2-section-title"><span className="ov2-section-icon is-violet"><Target size={17}/></span><div><p className="ov2-eyebrow">Execution insight</p><h2 id="ov2-progress-title">Where things stand</h2></div></div>
          <p className="ov2-insight__copy">Progress is measured from validated outputs against each workflow page's target. It does not represent business health or market validation.</p>
          <div className="ov2-insight__legend"><span><i className="is-done"/> {stats.completePages} complete</span><span><i className="is-review"/> {reviewedCount} need review</span></div>
          <button type="button" className="ov2-inline-link" onClick={() => navigate(`/ventures/${ventureId}/analytics`)}>View venture analytics <ArrowUpRight size={14}/></button>
        </section>
      </div>

      <section className="ov2-section ov2-journey" aria-labelledby="ov2-journey-title">
        <div className="ov2-section-heading"><div><span className="ov2-eyebrow">From strategy to growth</span><h2 id="ov2-journey-title">Venture journey</h2></div><span className="ov2-section-heading__meta">{stats.completePages} of {stats.totalPages} complete</span></div>
        <div className="ov2-journey__grid">{journey.map((step) => <JourneyTile key={step.key} step={step} onClick={() => navigate(`/ventures/${ventureId}/${step.key}`)} />)}</div>
      </section>

      <div className="ov2-bottom-grid">
        <section className="ov2-section" aria-labelledby="ov2-needs-title">
          <div className="ov2-section-heading"><div className="ov2-title-with-icon"><span className="ov2-section-icon is-amber"><Layers3 size={16}/></span><h2 id="ov2-needs-title">Needs your review</h2></div>{needsYou.length > 0 && <span className="ov2-count">{needsYou.length}</span>}</div>
          {needsYou.length === 0 ? (
            <div className="ov2-empty"><span className="ov2-empty__symbol is-mint"><Check size={19}/></span><strong>All clear for now</strong><p>Paused runs and review-ready outputs will appear here.</p></div>
          ) : (
            <ul className="ov2-list">{needsYou.map((run) => (
              <li key={run.id} className="ov2-list__item">
                <span className="ov2-list__dot is-amber" aria-hidden="true" />
                <div className="ov2-list__body"><strong>{(run as any).opVerb ?? run.objective ?? 'Run'}</strong><span>{run.status === 'needs_you' ? 'Answer required' : 'Ready for review'}</span></div>
                <button type="button" onClick={() => openDrawer(run.id)} aria-label={`Open ${(run as any).opVerb ?? run.objective ?? 'run'}`}><Play size={13}/> Open</button>
              </li>
            ))}</ul>
          )}
        </section>
        <section className="ov2-section" aria-labelledby="ov2-activity-title">
          <div className="ov2-section-heading"><div className="ov2-title-with-icon"><span className="ov2-section-icon is-cyan"><Activity size={16}/></span><h2 id="ov2-activity-title">Recent execution</h2></div><button type="button" className="ov2-inline-link" onClick={() => navigate(`/ventures/${ventureId}/analytics`)}>Analytics <ArrowUpRight size={13}/></button></div>
          {activity.length === 0 ? (
            <div className="ov2-empty"><span className="ov2-empty__symbol is-blue"><Clock size={18}/></span><strong>Ready for first activity</strong><p>Runs and saved outputs will build this timeline automatically.</p></div>
          ) : (
            <ul className="ov2-list">{activity.map((entry) => (
              <li key={entry.id} className="ov2-list__item">
                <span className={cn('ov2-list__dot', `is-${entry.tone}`)} aria-hidden="true"/>
                <div className="ov2-list__body"><strong>{entry.text}</strong></div>
                <time className="ov2-list__time" dateTime={entry.timestamp}>{relativeTime(entry.timestamp)}</time>
              </li>
            ))}</ul>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
