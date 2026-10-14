import { useEffect, useMemo, useRef } from 'react';
import { useVentureStore } from '@/lib/stores/ventureStore';
import type {
  Venture,
  IdeaJourney,
  VenturePageFunnel,
  VenturePageKey,
  VentureDocument,
  ArtifactProposal,
  VentureDocCitation,
} from '@/lib/types';

interface ThreadDef {
  id: string;
  kind: string;
  label: string;
}

interface UseVentureFunnelArgs {
  venture: Venture;
  sourceJourney?: IdeaJourney;
  ventureName: string;
  pageKey: VenturePageKey;
  threads: readonly ThreadDef[];
  threadSummaries: Record<string, string>;
  /** Build proposals once research completes. Receives Strategy docs. */
  buildProposals: (
    journey: IdeaJourney,
    ventureName: string,
    sourceDocs: VentureDocument[]
  ) => ArtifactProposal[];
  /** Which source page's docs feed this page (for citations). */
  sourcePageKey?: VenturePageKey | VenturePageKey[];
}

export function useVentureFunnel({
  venture,
  sourceJourney,
  ventureName,
  pageKey,
  threads,
  threadSummaries,
  buildProposals,
  sourcePageKey,
}: UseVentureFunnelArgs) {
  /* ---- Raw store slices (stable refs) ---- */
  const funnelStates = useVentureStore((s) => s.funnelStates);
  const documentsMap = useVentureStore((s) => s.documents);
  const setFunnel = useVentureStore((s) => s.setFunnel);
  const upsertDocument = useVentureStore((s) => s.upsertDocument);
  const approveDocument = useVentureStore((s) => s.approveDocument);
  const requestRevision = useVentureStore((s) => s.requestRevision);

  /* ---- Derived ---- */
  const funnel = useMemo(
    () => funnelStates[`${venture.id}:${pageKey}`],
    [funnelStates, venture.id, pageKey]
  );

  const documents = useMemo(
    () => Object.values(documentsMap).filter((d) => d.ventureId === venture.id),
    [documentsMap, venture.id]
  );

  /* ---- Source docs from an upstream page ---- */
  const sourceDocs = useMemo(() => {
    if (!sourcePageKey) return [];
    const keys = Array.isArray(sourcePageKey) ? sourcePageKey : [sourcePageKey];
    return documents.filter(
      (d) => keys.includes(d.producedBy) && d.isHeadline
    );
  }, [documents, sourcePageKey]);

  const sourceCitations: VentureDocCitation[] = useMemo(
    () =>
      sourceDocs.map((d) => ({
        docId: d.id,
        title: d.title,
        status: d.status,
        sourcePage: d.producedBy,
      })),
    [sourceDocs]
  );

  const hasDraftSource = sourceDocs.some((d) => d.status !== 'approved');

  /* ---- Init once ---- */
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    if (funnel) {
      initializedRef.current = true;
      return;
    }
    const initial: VenturePageFunnel = {
      ventureId: venture.id,
      pageKey,
      currentStage: 'inputs',
      proposals: [],
      producedDocIds: [],
      awaitingApproval: false,
      currentApprovalIndex: 0,
      researchThreads: threads.map((t) => ({
        id: t.id,
        kind: t.kind,
        label: t.label,
        status: 'pending' as const,
      })),
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setFunnel(venture.id, pageKey, initial);
    initializedRef.current = true;
  }, [funnel, venture.id, pageKey, setFunnel, threads]);

  /* ---- Actions ---- */

  function startResearch() {
    const live = useVentureStore.getState().funnelStates[
      `${venture.id}:${pageKey}`
    ];
    if (!live) return;

    const running: VenturePageFunnel = {
      ...live,
      currentStage: 'research',
      researchThreads: live.researchThreads.map((t) => ({
        ...t,
        status: 'running' as const,
      })),
      updatedAt: new Date().toISOString(),
    };
    setFunnel(venture.id, pageKey, running);

    running.researchThreads.forEach((thread, i) => {
      setTimeout(() => {
        const current = useVentureStore.getState().funnelStates[
          `${venture.id}:${pageKey}`
        ];
        if (!current) return;

        const nextThreads = current.researchThreads.map((t) =>
          t.id === thread.id
            ? {
                ...t,
                status: 'complete' as const,
                summary: threadSummaries[t.kind] ?? 'Report complete.',
              }
            : t
        );
        const allDone = nextThreads.every((t) => t.status === 'complete');

        useVentureStore.getState().setFunnel(venture.id, pageKey, {
          ...current,
          researchThreads: nextThreads,
          currentStage: allDone ? 'strategize' : 'research',
          proposals:
            allDone && current.proposals.length === 0 && sourceJourney
              ? buildProposals(sourceJourney, ventureName, sourceDocs)
              : current.proposals,
          updatedAt: new Date().toISOString(),
        });
      }, 1400 + i * 700);
    });
  }

  function acceptProposal(
    proposalId: string,
    proposalToDoc: (
      p: ArtifactProposal,
      v: string,
      n: string
    ) => VentureDocument
  ) {
    const live = useVentureStore.getState().funnelStates[
      `${venture.id}:${pageKey}`
    ];
    if (!live || !sourceJourney) return;

    const proposal = live.proposals.find((p) => p.id === proposalId);
    if (!proposal) return;

    const doc = proposalToDoc(proposal, venture.id, ventureName);
    upsertDocument(doc);

    const nextProposals = live.proposals.map((p) =>
      p.id === proposalId ? { ...p, status: 'accepted' as const } : p
    );
    const allResolved = nextProposals.every((p) => p.status !== 'pending');

    setFunnel(venture.id, pageKey, {
      ...live,
      proposals: nextProposals,
      producedDocIds: [...live.producedDocIds, doc.id],
      currentStage: allResolved ? 'produce' : 'strategize',
      updatedAt: new Date().toISOString(),
    });

    if (allResolved) {
      setTimeout(() => {
        const after = useVentureStore.getState().funnelStates[
          `${venture.id}:${pageKey}`
        ];
        if (!after) return;
        useVentureStore.getState().setFunnel(venture.id, pageKey, {
          ...after,
          currentStage: 'outcome',
          awaitingApproval: true,
          currentApprovalIndex: 0,
          updatedAt: new Date().toISOString(),
        });
      }, 900);
    }
  }

  function rejectProposal(proposalId: string) {
    const live = useVentureStore.getState().funnelStates[
      `${venture.id}:${pageKey}`
    ];
    if (!live) return;

    const nextProposals = live.proposals.map((p) =>
      p.id === proposalId ? { ...p, status: 'rejected' as const } : p
    );
    const allResolved = nextProposals.every((p) => p.status !== 'pending');

    setFunnel(venture.id, pageKey, {
      ...live,
      proposals: nextProposals,
      currentStage: allResolved ? 'produce' : 'strategize',
      updatedAt: new Date().toISOString(),
    });
  }

  function approveCurrent() {
    const live = useVentureStore.getState().funnelStates[
      `${venture.id}:${pageKey}`
    ];
    if (!live) return;

    const allDocs = useVentureStore.getState().documents;
    const headline = Object.values(allDocs)
      .filter((d) => d.ventureId === venture.id && d.isHeadline)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const currentDoc = headline[live.currentApprovalIndex];
    if (!currentDoc) return;

    approveDocument(currentDoc.id);

    const nextIndex = live.currentApprovalIndex + 1;
    setFunnel(venture.id, pageKey, {
      ...live,
      currentApprovalIndex: nextIndex,
      awaitingApproval: nextIndex < headline.length,
      updatedAt: new Date().toISOString(),
    });
  }

  function handleRevision() {
    const live = useVentureStore.getState().funnelStates[
      `${venture.id}:${pageKey}`
    ];
    if (!live) return;

    const allDocs = useVentureStore.getState().documents;
    const headline = Object.values(allDocs)
      .filter((d) => d.ventureId === venture.id && d.isHeadline)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const currentDoc = headline[live.currentApprovalIndex];
    if (!currentDoc) return;
    requestRevision(currentDoc.id, 'Founder requested revision.');
  }

  /* ---- Derived values ---- */
  const activeProposal = useMemo(
    () => funnel?.proposals.find((p) => p.status === 'pending') ?? null,
    [funnel]
  );

  const headlineDocs = useMemo(
    () =>
      documents
        .filter((d) => d.isHeadline)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [documents]
  );

  const nonHeadlineDocs = useMemo(
    () => documents.filter((d) => !d.isHeadline),
    [documents]
  );

  const currentApprovalDoc =
    headlineDocs[funnel?.currentApprovalIndex ?? 0];

  return {
    funnel,
    documents,
    headlineDocs,
    nonHeadlineDocs,
    currentApprovalDoc,
    activeProposal,
    sourceDocs,
    sourceCitations,
    hasDraftSource,
    startResearch,
    acceptProposal,
    rejectProposal,
    approveCurrent,
    handleRevision,
  };
}
