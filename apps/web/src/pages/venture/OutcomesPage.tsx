import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PageContainer } from '@/components/primary';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  useOutcomes,
  type OutcomeRow,
  type OutcomeKind,
} from '@/features/venture-outcomes/useOutcomes';
import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import { cn } from '@/lib/utils/cn';
import {
  Mail,
  Github,
  Rocket,
  FileText,
  MessageSquare,
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Activity,
  XCircle,
} from 'lucide-react';

type Filter = 'all' | 'tasks' | 'emails' | 'external';

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'emails', label: 'Emails' },
  { value: 'external', label: 'External' },
];

const KIND_ICON: Record<OutcomeKind, typeof Mail> = {
  task: Sparkles,
  email: Mail,
  repo: Github,
  deploy: Rocket,
  notion: FileText,
  slack: MessageSquare,
  calendar: Calendar,
};

function kindLabel(kind: OutcomeKind): string {
  switch (kind) {
    case 'task':
      return 'Task';
    case 'email':
      return 'Email';
    case 'repo':
      return 'GitHub';
    case 'deploy':
      return 'Vercel';
    case 'notion':
      return 'Notion';
    case 'slack':
      return 'Slack';
    case 'calendar':
      return 'Calendar';
  }
}

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function OutcomesPage() {
  const { ventureId } = useParams<{ ventureId: string }>();
  const { rows, stats, isLoading } = useOutcomes(ventureId);
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return rows;
    if (filter === 'tasks') return rows.filter((r) => r.kind === 'task');
    if (filter === 'emails') return rows.filter((r) => r.kind === 'email');
    if (filter === 'external')
      return rows.filter((r) => r.kind !== 'task' && r.kind !== 'email');
    return rows;
  }, [rows, filter]);

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeleton count={6} className="h-32" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <header className="marketplace-hero">
        <h1 className="marketplace-hero__title">Outcomes</h1>
        <p className="marketplace-hero__lede">
          Everything the platform has done for this venture — every task run,
          every email sent, every repo created, every deploy live. The
          action log.
        </p>
      </header>

      {/* Stats */}
      <section className="oc-stats">
        <div className="oc-stat">
          <span className="oc-stat__value">{stats.tasks}</span>
          <span className="oc-stat__label">Tasks run</span>
        </div>
        <div className="oc-stat">
          <span className="oc-stat__value">{stats.emails}</span>
          <span className="oc-stat__label">Emails sent</span>
        </div>
        <div className="oc-stat">
          <span className="oc-stat__value">{stats.external}</span>
          <span className="oc-stat__label">External acts</span>
        </div>
        <div className="oc-stat">
          <span className="oc-stat__value">{stats.errors}</span>
          <span className="oc-stat__label">Failures</span>
        </div>
      </section>

      {/* Filters */}
      <div className="plugin-tool-strip">
        <div className="plugin-tool-strip__filters">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                'plugin-tool-strip__pill',
                filter === f.value && 'is-active'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bento grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title={
            rows.length === 0
              ? 'No outcomes yet'
              : 'No outcomes match that filter'
          }
          description={
            rows.length === 0
              ? 'Run an op — tasks and external actions land here automatically.'
              : 'Try a broader filter.'
          }
          icon={<Activity className="h-6 w-6" />}
        />
      ) : (
        <div className="oc-bento">
          {filtered.map((row) => (
            <OutcomeCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}

function OutcomeCard({ row }: { row: OutcomeRow }) {
  const Icon = KIND_ICON[row.kind];
  const label = kindLabel(row.kind);
  const openDrawer = useAgentDrawerStore((s) => s.openDrawer);

  const isError = row.status === 'error';
  const isRunning = row.status === 'running';
  const isNeedsYou = row.status === 'needs_you';
  const isAbandoned = row.status === 'abandoned';

  return (
    <article
      className={cn(
        'oc-card',
        isError && 'is-error',
        isRunning && 'is-running',
        isNeedsYou && 'is-needs-you',
        isAbandoned && 'is-abandoned'
      )}
    >
      <header className="oc-card__head">
        <span className="oc-card__icon">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="oc-card__kind">{label}</span>
        <span className="oc-card__time">{relativeTime(row.createdAt)}</span>
      </header>

      <h3 className="oc-card__title">{row.title}</h3>

      {row.detail && <p className="oc-card__detail">{row.detail}</p>}

      {isError && row.errorMessage && (
        <p className="oc-card__error">
          <AlertCircle className="h-3 w-3" />
          {row.errorMessage.slice(0, 80)}
        </p>
      )}

      <footer className="oc-card__footer">
        {isError && (
          <span className="oc-card__status is-error">
            <AlertCircle className="h-3 w-3" />
            Failed
          </span>
        )}
        {isAbandoned && (
          <span className="oc-card__status is-abandoned">
            <XCircle className="h-3 w-3" />
            Abandoned
          </span>
        )}
        {isRunning && (
          <span className="oc-card__status is-running">
            <Loader2 className="h-3 w-3 animate-spin" />
            Running
          </span>
        )}
        {isNeedsYou && (
          <button
            type="button"
            className="oc-card__status is-needs-you"
            onClick={() => row.kind === 'task' && openDrawer(row.externalId!)}
          >
            <Sparkles className="h-3 w-3" />
            Open
          </button>
        )}
        {!isError && !isRunning && !isNeedsYou && !isAbandoned && (
          <span className="oc-card__status is-ok">
            <CheckCircle2 className="h-3 w-3" />
            Done
          </span>
        )}
        {row.externalUrl && (
          <a
            className="oc-card__open"
            href={row.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open external"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </footer>
    </article>
  );
}
