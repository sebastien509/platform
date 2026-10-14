import { AlertTriangle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VenturePageShell } from './VenturePageShell';
import { VenturePageHero } from './VenturePageHero';
import { VentureSourceCard } from './VentureSourceCard';
import { VentureKnowledgeCard } from './VentureKnowledgeCard';
import { VentureArtifactCard } from './VentureArtifactCard';
import { ArtifactApprovalGate } from './ArtifactApprovalGate';
import { useVentureFunnel } from './useVentureFunnel';
import {
  PRODUCT_THREADS,
  buildProductProposals,
} from './productQuestionBank';
import { proposalToDocument } from './strategyArtifacts';
import { useKnowledge } from '@/lib/hooks/useKnowledge';
import { unwrapList } from '@/lib/utils/unwrap';
import { useArtifactEditor } from '@/lib/stores/artifactEditorStore';
import type { Venture, IdeaJourney, KnowledgeEntry } from '@/lib/types';

interface ProductFunnelProps {
  venture: Venture;
  sourceJourney?: IdeaJourney;
  ventureName: string;
}

const THREAD_SUMMARIES: Record<string, string> = {
  feature_gap: 'Three P0 features overlap with the confirmed problem.',
  pricing: 'Packaging compresses cleanly to a single tier for MVP.',
  mvp_scope: 'MVP scope is 3 features, not the 6 the founder initially listed.',
};

export function ProductFunnel({
  venture,
  sourceJourney,
  ventureName,
}: ProductFunnelProps) {
  const funnelApi = useVentureFunnel({
    venture,
    sourceJourney,
    ventureName,
    pageKey: 'product',
    threads: PRODUCT_THREADS,
    threadSummaries: THREAD_SUMMARIES,
    buildProposals: buildProductProposals,
    sourcePageKey: 'strategy',
  });

  const {
    funnel,
    nonHeadlineDocs,
    currentApprovalDoc,
    activeProposal,
    sourceCitations,
    hasDraftSource,
    startResearch,
    acceptProposal,
    rejectProposal,
    approveCurrent,
    handleRevision,
  } = funnelApi;

  const { data: knowledgeData } = useKnowledge();
  const knowledgeEntries = unwrapList<KnowledgeEntry>(knowledgeData);

  if (!funnel) {
    return (
      <VenturePageShell eyebrow="Product" title="Definition">
        <div className="venture-bento__card venture-bento__hero" />
      </VenturePageShell>
    );
  }

  function renderHero() {
    /* ---- Inputs ---- */
    if (funnel.currentStage === 'inputs') {
      return (
        <VenturePageHero
          stageLabel="Ready to research"
          footer={
            <Button size="sm" onClick={startResearch} className="gap-1.5">
              <Play className="h-3.5 w-3.5" />
              Start research
            </Button>
          }
        >
          {hasDraftSource && (
            <div className="venture-input-flag">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>
                Strategy has unapproved docs. Product will build against draft
                inputs — flagged in the PRD.
              </span>
            </div>
          )}
          <p>
            Product Agent will research feature gaps, pricing, and MVP scope
            signals — then propose the requirements, prioritization, and
            roadmap.
          </p>
        </VenturePageHero>
      );
    }

    /* ---- Research ---- */
    if (funnel.currentStage === 'research') {
      const complete = funnel.researchThreads.filter(
        (t) => t.status === 'complete'
      ).length;
      const total = funnel.researchThreads.length;
      return (
        <VenturePageHero
          stageLabel="Research running"
          meta={
            <span className="venture-bento__artifact-status tabular-nums">
              {complete} of {total}
            </span>
          }
        >
          <div className="strategy-threads">
            {funnel.researchThreads.map((t) => (
              <div key={t.id} className="strategy-thread-row">
                <span className="strategy-thread-row__label">{t.label}</span>
                {t.summary && (
                  <span className="strategy-thread-row__summary">
                    {t.summary}
                  </span>
                )}
              </div>
            ))}
          </div>
        </VenturePageHero>
      );
    }

    /* ---- Strategize ---- */
    if (funnel.currentStage === 'strategize' && activeProposal) {
      return (
        <VenturePageHero
          stageLabel={activeProposal.title}
          footer={
            <>
              <Button
                size="sm"
                onClick={() =>
                  acceptProposal(activeProposal.id, proposalToDocument)
                }
                className="gap-1.5"
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => rejectProposal(activeProposal.id)}
                className="gap-1.5"
              >
                Keep original
              </Button>
            </>
          }
        >
          <p className="strategy-proposal-rationale">
            {activeProposal.rationale}
          </p>
          <pre className="strategy-proposal-content">
            {activeProposal.proposedContent}
          </pre>
        </VenturePageHero>
      );
    }

    /* ---- Produce ---- */
    if (funnel.currentStage === 'produce') {
      return (
        <VenturePageHero stageLabel="Producing documents">
          <p>Writing the accepted artifacts…</p>
        </VenturePageHero>
      );
    }

    /* ---- Outcome ---- */
    if (funnel.currentStage === 'outcome' && currentApprovalDoc) {
      const isLast =
        funnel.currentApprovalIndex + 1 >= (funnel.producedDocIds.length || 1);
      return (
        <VenturePageHero
          stageLabel={
            isLast
              ? `Approve ${currentApprovalDoc.title} (final)`
              : `Approve ${currentApprovalDoc.title}`
          }
          footer={
            <ArtifactApprovalGate
              onApprove={approveCurrent}
              onRequestRevision={handleRevision}
            />
          }
        >
          <p className="strategy-approval-summary">
            {currentApprovalDoc.summary}
          </p>
        </VenturePageHero>
      );
    }

    /* ---- Complete ---- */
    return (
      <VenturePageHero stageLabel="Product complete">
        <p>
          All product documents approved. Engineering can now build against
          the PRD and roadmap.
        </p>
      </VenturePageHero>
    );
  }

  return (
    <VenturePageShell eyebrow="Product" title="Definition">
      {renderHero()}
      {nonHeadlineDocs.map((doc) => (
        <VentureArtifactCard key={doc.id} doc={doc} onOpen={(id) => useArtifactEditor.getState().openEditor(id)} />
      ))}
      <VentureSourceCard citations={sourceCitations} />
      <VentureKnowledgeCard
        ventureId={venture.id}
        summary={`${knowledgeEntries.length} entries across the venture`}
      />
    </VenturePageShell>
  );
}
