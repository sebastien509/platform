import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Download, ExternalLink, Calendar } from 'lucide-react';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { CitationStack } from '@/components/agents/citation';
import { AgentIcon } from '@/components/agents/identity';
import { useKnowledge } from '@/lib/hooks/useKnowledge';
import { Search } from 'lucide-react';

export default function ResearchReportViewerPage() {
  const { ideaId, reportId } = useParams<{
    ideaId: string;
    reportId: string;
  }>();
  const navigate = useNavigate();
  const { data, isLoading, error} = useKnowledge();

  if (isLoading) {
    return (
      <>
        <LoadingSkeleton count={1} className="h-96" />
      </>
    );
  }

  if (error) {
    return (
      <>
        <EmptyState
          title="Report failed to load"
          description="Try again in a moment."
          icon={<Search className="h-6 w-6" />}
        />
      </>
    );
  }

  const entry = (data?.data ?? []).find((k) => k.id === reportId);

  if (!entry) {
    return (
      <>
        <EmptyState
          title="Report not found"
          description="This report may have been moved or deleted."
          icon={<Search className="h-6 w-6" />}
          action={
            <Button
              variant="outline"
              onClick={() => navigate(`/ideas/${ideaId}`)}
            >
              Back to idea
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Back link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/ideas/${ideaId}`)}
          className="gap-1.5 -ml-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to idea
        </Button>

        {/* Title block */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            {entry.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-2xs text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {entry.type.replace(/_/g, ' ')}
            </span>
            {entry.contributingAgent && (
              <span className="inline-flex items-center gap-1">
                <AgentIcon agent={entry.contributingAgent} size={11} />
                {entry.contributingAgent}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(entry.createdAt).toLocaleDateString()}
            </span>
            {entry.confidence !== undefined && (
              <span className="tabular-nums">
                {entry.confidence}% confidence
              </span>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-lg bg-[var(--surface-2)] p-4">
          <p className="text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1">
            Summary
          </p>
          <p className="text-sm text-[var(--text-primary)] leading-relaxed">
            {entry.summary}
          </p>
        </div>

        {/* Content */}
        {entry.content && (
          <div>
            <p className="text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">
              Report
            </p>
            <div className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
              {entry.content}
            </div>
          </div>
        )}

        {/* Citations */}
        {entry.citations && entry.citations.length > 0 && (
          <div>
            <p className="text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">
              Sources
            </p>
            <CitationStack
              citations={entry.citations.map((c) => ({
                id: c.id,
                label: c.label,
              }))}
              maxVisible={20}
            />
          </div>
        )}

        {/* Attachments */}
        {entry.attachments && entry.attachments.length > 0 && (
          <div>
            <p className="text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">
              Attachments
            </p>
            <ul className="space-y-1">
              {entry.attachments.map((a) => (
                <li key={a.id}>
                  <a
                    href={a.url}
                    className="flex items-center gap-2 rounded-md border border-[var(--border-subtle)] px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <Download className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                    <span className="flex-1">{a.label}</span>
                    <ExternalLink className="h-3 w-3 text-[var(--text-muted)]" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
