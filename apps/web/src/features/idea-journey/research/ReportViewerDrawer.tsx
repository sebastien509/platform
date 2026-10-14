import { useEffect } from 'react';
import { FileText, Download, ExternalLink, Calendar} from 'lucide-react';
import { DrawerShell } from '@/components/containers';
import { Button } from '@/components/ui/button';
import { CitationStack } from '@/components/agents/citation';
import { AgentIcon } from '@/components/agents/identity';
import type { KnowledgeEntry } from '@/lib/types';

interface ReportViewerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: KnowledgeEntry | null;
  /** Called when founder clicks "Open as full page". */
  onOpenAsPage?: (entryId: string) => void;
  /** Fired once when the report drawer opens — the founder has "seen" it. */
  onViewed?: (entryId: string) => void;
}

export function ReportViewerDrawer({
  open,
  onOpenChange,
  entry,
  onOpenAsPage,
  onViewed,
}: ReportViewerDrawerProps) {
  const entryId = entry?.id;
  useEffect(() => {
    if (open && entryId) onViewed?.(entryId);
  }, [open, entryId, onViewed]);
  if (!entry) {
    return (
      <DrawerShell
        open={open}
        onOpenChange={onOpenChange}
        title="Report"
        side="right"
        width={720}
      >
        <p className="text-sm text-[var(--text-muted)] py-8 text-center">
          No report selected.
        </p>
      </DrawerShell>
    );
  }

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title={entry.title}
      side="right"
      width={720}
    >
      <div className="space-y-6 py-4">
        {/* Meta strip */}
        <div className="flex flex-wrap items-center gap-3 text-2xs text-[var(--text-muted)]">
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
            <span className="tabular-nums">{entry.confidence}% confidence</span>
          )}
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

        {/* Full content */}
        {entry.content && (
          <div>
            <p className="text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">
              Report
            </p>
            <div className="prose prose-sm prose-invert max-w-none text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
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
              maxVisible={10}
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

        {/* Actions */}
        {onOpenAsPage && (
          <div className="border-t border-[var(--border-subtle)] pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenAsPage(entry.id)}
              className="gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open as full page
            </Button>
          </div>
        )}
      </div>
    </DrawerShell>
  );
}
