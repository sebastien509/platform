import { useMemo } from 'react';
import { useTraceStore, type TraceItem, type TraceLineage, type TraceKind } from '@/lib/stores/traceStore';
import { useKnowledge } from '@/lib/hooks/useKnowledge';
import { useOutcomes } from '@/lib/hooks/useOutcomes';
import { unwrapList } from '@/lib/utils/unwrap';
import type { KnowledgeEntry, OutcomeEntry } from '@/lib/types';

/* -----------------------------------------------------------------
   Resolvers — one per kind. Each returns a TraceLineage or null.
   ----------------------------------------------------------------- */

function knowledgeToTraceItem(k: KnowledgeEntry): TraceItem {
  return {
    id: k.id,
    kind: 'knowledge',
    title: k.title,
    summary: k.summary,
    agent: k.contributingAgent,
    createdAt: k.createdAt,
    confidence: k.confidence,
    href: `/knowledge?entry=${k.id}`,
  };
}

function outcomeToTraceItem(o: OutcomeEntry): TraceItem {
  return {
    id: o.id,
    kind: 'outcome',
    title: o.title,
    summary: o.summary,
    agent: o.sourceAgent,
    createdAt: o.decisionMadeAt,
    href: o.sourceVentureId
      ? `/ventures/${o.sourceVentureId}/outcomes`
      : `/outcomes`,
  };
}

function resolveKnowledge(
  entry: KnowledgeEntry,
  allKnowledge: KnowledgeEntry[],
  allOutcomes: OutcomeEntry[]
): TraceLineage {
  const current = knowledgeToTraceItem(entry);

  /* Origin — the idea or venture this came from */
  const origin: TraceItem[] = [];
  if (entry.sourceIdeaId) {
    origin.push({
      id: entry.sourceIdeaId,
      kind: 'idea',
      title: `Idea ${entry.sourceIdeaId}`,
      summary: 'The idea this research was produced for.',
      href: `/ideas/${entry.sourceIdeaId}`,
    });
  }
  if (entry.sourceVentureId) {
    origin.push({
      id: entry.sourceVentureId,
      kind: 'idea', // treat as venture origin
      title: `Venture ${entry.sourceVentureId}`,
      summary: 'The venture this was produced inside.',
      href: `/ventures/${entry.sourceVentureId}`,
    });
  }

  /* Evidence — its own citations */
  const evidence: TraceItem[] = (entry.citations ?? []).map((c) => ({
    id: c.id,
    kind: 'knowledge' as const,
    title: c.label,
  }));

  /* Downstream — outcomes that reference this entry */
  const downstream: TraceItem[] = allOutcomes
    .filter((o) => o.supportingKnowledgeIds?.includes(entry.id))
    .map(outcomeToTraceItem);

  /* Related — semantic neighbours */
  const related: TraceItem[] = (entry.relatedEntryIds ?? [])
    .map((id) => allKnowledge.find((k) => k.id === id))
    .filter((k): k is KnowledgeEntry => !!k)
    .map(knowledgeToTraceItem);

  return { origin, current, evidence, downstream, related };
}

function resolveOutcome(
  outcome: OutcomeEntry,
  allKnowledge: KnowledgeEntry[]
): TraceLineage {
  const current = outcomeToTraceItem(outcome);

  /* Origin — the knowledge that supported the decision */
  const origin: TraceItem[] = (outcome.supportingKnowledgeIds ?? [])
    .map((id) => allKnowledge.find((k) => k.id === id))
    .filter((k): k is KnowledgeEntry => !!k)
    .map(knowledgeToTraceItem);

  /* Evidence — metrics, factual */
  const evidence: TraceItem[] = (outcome.metrics ?? []).map((m, i) => ({
    id: `${outcome.id}_m_${i}`,
    kind: 'decision' as const,
    title: `${m.label}: ${
      typeof m.value === 'number' ? m.value.toLocaleString() : m.value
    }${m.unit && m.unit !== '$' ? ` ${m.unit}` : ''}${m.unit === '$' ? '' : ''}`,
    summary: m.source ? `Measured via ${m.source}` : undefined,
  }));

  /* Downstream — what this led to */
  const downstream: TraceItem[] = [];
  (outcome.ledToNewVentureIds ?? []).forEach((id) => {
    downstream.push({
      id,
      kind: 'idea',
      title: `Venture ${id}`,
      summary: 'Created from this decision.',
      href: `/ventures/${id}`,
    });
  });
  (outcome.ledToNewIdeaIds ?? []).forEach((id) => {
    downstream.push({
      id,
      kind: 'idea',
      title: `Idea ${id}`,
      summary: 'Spun off from this decision.',
      href: `/ideas/${id}`,
    });
  });

  return { origin, current, evidence, downstream, related: [] };
}

/* -----------------------------------------------------------------
   Public hook
   ----------------------------------------------------------------- */
export function useTrace(): {
  lineage: TraceLineage | null;
  loading: boolean;
} {
  const currentId = useTraceStore((s) => s.currentId);
  const currentKind = useTraceStore((s) => s.currentKind);

  const { data: knowledgeRaw, isLoading: knowledgeLoading } = useKnowledge();
  const { data: outcomesRaw, isLoading: outcomesLoading } = useOutcomes();

  const lineage = useMemo<TraceLineage | null>(() => {
    if (!currentId || !currentKind) return null;
    if (knowledgeLoading || outcomesLoading) return null;

    const allKnowledge = unwrapList<KnowledgeEntry>(knowledgeRaw);
    const allOutcomes = unwrapList<OutcomeEntry>(outcomesRaw);

    if (currentKind === 'knowledge') {
      const entry = allKnowledge.find((k) => k.id === currentId);
      if (!entry) return null;
      return resolveKnowledge(entry, allKnowledge, allOutcomes);
    }

    if (currentKind === 'outcome') {
      const outcome = allOutcomes.find((o) => o.id === currentId);
      if (!outcome) return null;
      return resolveOutcome(outcome, allKnowledge);
    }

    // Other kinds (requirement, task, campaign, decision) — reserved for later.
    // Fall back to a stub so the drawer still opens.
    return {
      origin: [],
      current: {
        id: currentId,
        kind: currentKind as TraceKind,
        title: currentId,
      },
      evidence: [],
      downstream: [],
      related: [],
    };
  }, [
    currentId,
    currentKind,
    knowledgeRaw,
    outcomesRaw,
    knowledgeLoading,
    outcomesLoading,
  ]);

  return {
    lineage,
    loading: knowledgeLoading || outcomesLoading,
  };
}
