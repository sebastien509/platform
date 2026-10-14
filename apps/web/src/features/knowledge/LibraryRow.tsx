import {
  FileText, BarChart3, MessageSquare, Sparkles,
  CheckCircle2, Globe, MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { KnowledgeEntry, KnowledgeEntryType } from '@/lib/types';

const TYPE_META: Partial<
  Record<
    KnowledgeEntryType,
    { label: string; icon: typeof FileText; tone: string }
  >
> = {
  document: { label: 'Document', icon: FileText, tone: 'note' },
  research_report: { label: 'Report', icon: FileText, tone: 'report' },
  market_analysis: { label: 'Market', icon: Globe, tone: 'market' },
  competitive_analysis: { label: 'Competitor', icon: BarChart3, tone: 'competitive' },
  interview_transcript: { label: 'Interview', icon: MessageSquare, tone: 'interview' },
  customer_insight: { label: 'Insight', icon: Sparkles, tone: 'insight' },
  founder_selection: { label: 'Selection', icon: CheckCircle2, tone: 'selection' },
  synthesized_answer: { label: 'Synthesis', icon: Sparkles, tone: 'synthesis' },
  research_note: { label: 'Note', icon: FileText, tone: 'note' },
};

function typeMeta(type: KnowledgeEntryType) {
  return TYPE_META[type] ?? { label: 'Entry', icon: FileText, tone: 'note' };
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface LibraryRowProps {
  entry: KnowledgeEntry;
  onOpen: () => void;
  onOpenMenu: (e: React.MouseEvent) => void;
  menuOpen: boolean;
}

/**
 * LibraryRow — a compact, card-like row for one Library entry.
 * Type badge + title + one-line preview + date + 3-dot menu.
 * Nothing more. This is a reference list, not an editorial layout.
 */
export function LibraryRow({ entry, onOpen, onOpenMenu, menuOpen }: LibraryRowProps) {
  const meta = typeMeta(entry.type);
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="library-card"
      aria-label={entry.title}
    >
      <span className={cn('library-card__type', `is-${meta.tone}`)}>
        <Icon className="h-3.5 w-3.5" />
      </span>

      <span className="library-card__body">
        <span className="library-card__title">{entry.title}</span>
        {entry.summary && (
          <span className="library-card__preview">{entry.summary}</span>
        )}
      </span>

      <span className="library-card__meta">
        <span className="library-card__kind">{meta.label}</span>
        <span className="library-card__date">
          {formatDate(entry.createdAt)}
        </span>
      </span>

      <span
        role="button"
        tabIndex={0}
        className={cn('library-card__menu', menuOpen && 'is-open')}
        onClick={(e) => {
          e.stopPropagation();
          onOpenMenu(e);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onOpenMenu(e as unknown as React.MouseEvent);
          }
        }}
        aria-label="More actions"
        aria-haspopup="menu"
      >
        <MoreHorizontal className="h-4 w-4" />
      </span>
    </button>
  );
}
