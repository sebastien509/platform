import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageContainer } from '@/components/primary';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  KnowledgeCard,
  type KnowledgeCardItem,
} from '@/features/knowledge/KnowledgeCard';
import { ResearchBar } from '@/features/knowledge/ResearchBar';
import { useKnowledge } from '@/lib/hooks/useKnowledge';
import { useDeliverables } from '@/lib/hooks/useDeliverables';
import { useDocumentViewer } from '@/lib/stores/documentViewerStore';
import { useSurfaceViewer } from '@/lib/stores/surfaceViewerStore';
import { cn } from '@/lib/utils/cn';
import { Library as LibraryIcon } from 'lucide-react';
import type { ShareSnapshot } from '@/lib/share';
import type { KnowledgeEntry, KnowledgeEntryType } from '@/lib/types';
import type { Deliverable } from '@/lib/deliverables';

type Kind = 'all' | 'research' | 'outputs';
type ResearchType = KnowledgeEntryType | 'all';
type OutputType = string | 'all';

const KIND_FILTERS: Array<{ value: Kind; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'research', label: 'Research' },
  { value: 'outputs', label: 'Outputs' },
];

const RESEARCH_FILTERS: Array<{ value: ResearchType; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'market_analysis', label: 'Market' },
  { value: 'competitive_analysis', label: 'Competitor' },
  { value: 'customer_insight', label: 'Insight' },
  { value: 'interview_transcript', label: 'Interview' },
  { value: 'synthesized_answer', label: 'Synthesis' },
  { value: 'research_report', label: 'Report' },
  { value: 'research_note', label: 'Note' },
];

const OUTPUT_FILTERS: Array<{ value: OutputType; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'markdown', label: 'Doc' },
  { value: 'report', label: 'Report' },
  { value: 'deck', label: 'Deck' },
  { value: 'html', label: 'HTML' },
  { value: 'sheet', label: 'Sheet' },
  { value: 'code', label: 'Code' },
  { value: 'operational', label: 'Action' },
];

const KIND_TO_META: Record<KnowledgeEntryType, string> = {
  research_report: 'Report',
  market_analysis: 'Market',
  competitive_analysis: 'Competitor',
  interview_transcript: 'Interview',
  customer_insight: 'Insight',
  founder_selection: 'Selection',
  synthesized_answer: 'Synthesis',
  research_note: 'Note',
  document: 'Document',
};

function entryToItem(
  entry: KnowledgeEntry,
  ventureId: string | undefined
): KnowledgeCardItem {
  const confidence = entry.confidence ?? 0;
  const validated = confidence >= 55;
  const kind = KIND_TO_META[entry.type] ?? 'Research';

  const snapshot: ShareSnapshot = {
    title: entry.title,
    kicker: kind,
    sections: [
      ...(entry.summary
        ? [
            {
              type: 'paragraph' as const,
              id: 'summary',
              body: entry.summary,
            },
          ]
        : []),
      ...(entry.content
        ? [
            {
              type: 'paragraph' as const,
              id: 'content',
              body: entry.content,
            },
          ]
        : []),
    ],
  };

  return {
    id: entry.id,
    title: entry.title,
    body: entry.summary ?? '',
    meta: confidence > 0 ? `${kind} · ${confidence}%` : kind,
    status: validated ? 'Validated' : 'Draft',
    statusTone: validated ? 'success' : 'neutral',
    menuTarget: {
      id: entry.id,
      title: entry.title,
      summary: entry.summary,
      snapshot,
      internalPath: ventureId
        ? `/ventures/${ventureId}/knowledge#${entry.id}`
        : `/library/${entry.id}`,
    },
  };
}

function outputToItem(
  d: Deliverable,
  ventureId: string | undefined
): KnowledgeCardItem {
  const firstSection = (d.snapshot?.sections ?? [])[0] as
    | { body?: string }
    | undefined;
  const body = firstSection?.body?.slice(0, 160) ?? '';
  const typeLabel = d.renderType
    ? d.renderType.charAt(0).toUpperCase() + d.renderType.slice(1)
    : 'Document';
  const externalUrl = (d.snapshot as any)?.externalUrl as
    | string
    | undefined;

  return {
    id: d.id,
    title: d.title,
    body,
    meta: `${typeLabel} · v${d.version}`,
    status: 'Validated',
    statusTone: 'success',
    menuTarget: {
      id: d.id,
      title: d.title,
      summary: body,
      snapshot: d.snapshot,
      externalUrl,
      internalPath: ventureId
        ? `/ventures/${ventureId}/knowledge#${d.id}`
        : `/library/${d.id}`,
    },
  };
}

export default function KnowledgePage() {
  const params = useParams<{ ventureId?: string; id?: string }>();
  const ventureId = params.ventureId ?? params.id;

  const [kind, setKind] = useState<Kind>('all');
  const [researchType, setResearchType] = useState<ResearchType>('all');
  const [outputType, setOutputType] = useState<OutputType>('all');

  const { data: knowledgeData, isLoading: kLoading } = useKnowledge({
    ventureId,
  });
  const entries = knowledgeData?.data ?? [];

  const { data: allOutputs, isLoading: oLoading } = useDeliverables({
    ventureId,
  });
  const outputs = allOutputs ?? [];

  const openDocument = useDocumentViewer((s) => s.openInline);
  const openSurface = useSurfaceViewer((s) => s.openFromRun);

  function openEntry(entry: KnowledgeEntry) {
    const section = entry.content
      ? [
          {
            id: 'body',
            type: 'narrative' as const,
            label: null,
            narrative: { paragraphs: entry.content.split('\n\n') },
          },
        ]
      : [];
    openDocument({
      id: entry.id,
      title: entry.title,
      summary: entry.summary,
      kind: 'research_report',
      ventureId: ventureId ?? '',
      status: 'approved',
      content: entry.content ?? '',
      sections: section as any,
      citations: [],
      producedBy: 'knowledge',
      consumedFrom: [],
      isHeadline: false,
      builtOnDraftInput: false,
      createdAt: entry.createdAt,
      updatedAt: entry.createdAt,
    } as any);
  }

  function openOutput(d: Deliverable) {
    if (d.shareLinkId && d.runId) {
      openSurface(d.shareLinkId, d.runId);
      return;
    }
    openDocument({
      id: d.id,
      title: d.title,
      summary: d.snapshot?.kicker ?? '',
      kind: 'research_report',
      ventureId: d.ventureId ?? ventureId ?? '',
      status: 'approved',
      content: '',
      sections: (d.snapshot?.sections ?? []) as any,
      citations: [],
      producedBy: d.opId,
      consumedFrom: [],
      isHeadline: false,
      builtOnDraftInput: false,
      createdAt: d.createdAt,
      updatedAt: d.createdAt,
    } as any);
  }

  function openItem(item: KnowledgeCardItem) {
    const entry = entries.find((e) => e.id === item.id);
    if (entry) return openEntry(entry);
    const output = outputs.find((d) => d.id === item.id);
    if (output) return openOutput(output);
  }

  const items: KnowledgeCardItem[] = useMemo(() => {
    const out: KnowledgeCardItem[] = [];

    if (kind === 'all' || kind === 'research') {
      for (const e of entries) {
        if (researchType !== 'all' && e.type !== researchType) continue;
        out.push(entryToItem(e, ventureId));
      }
    }

    if (kind === 'all' || kind === 'outputs') {
      for (const d of outputs) {
        if (outputType !== 'all' && d.renderType !== outputType) continue;
        out.push(outputToItem(d, ventureId));
      }
    }

    return out;
  }, [kind, researchType, outputType, entries, outputs, ventureId]);

  const isLoading = kLoading || oLoading;
  const totalContext = entries.length + outputs.length;

  return (
    <PageContainer>
      <header className="marketplace-hero">
        <h1 className="marketplace-hero__title">Knowledge</h1>
        <p className="marketplace-hero__lede">
          Every document and file this venture has produced — research memos,
          insights, PRDs, decks, specs, and pitches. Ask a question and the
          agent will synthesize an answer from what's here.
        </p>
      </header>

      <ResearchBar ventureId={ventureId} entryCount={totalContext} />

      <div className="plugin-tool-strip">
        <div className="plugin-tool-strip__filters">
          {KIND_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setKind(f.value)}
              className={cn(
                'plugin-tool-strip__pill',
                kind === f.value && 'is-active'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {kind === 'research' && (
          <div className="plugin-tool-strip__filters">
            {RESEARCH_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setResearchType(f.value)}
                className={cn(
                  'plugin-tool-strip__pill',
                  researchType === f.value && 'is-active'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {kind === 'outputs' && (
          <div className="plugin-tool-strip__filters">
            {OUTPUT_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setOutputType(f.value)}
                className={cn(
                  'plugin-tool-strip__pill',
                  outputType === f.value && 'is-active'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton count={6} className="h-32" />
      ) : items.length === 0 ? (
        <EmptyState
          title={
            totalContext === 0
              ? 'No knowledge yet'
              : 'No entries match those filters'
          }
          description={
            totalContext === 0
              ? 'Run an op — validated outputs and research land here automatically.'
              : 'Try a broader filter.'
          }
          icon={<LibraryIcon className="h-6 w-6" />}
        />
      ) : (
        <div className="kb-grid">
          {items.map((item) => (
            <KnowledgeCard
              key={`${item.id}-${item.menuTarget.id}`}
              item={item}
              onOpen={() => openItem(item)}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
