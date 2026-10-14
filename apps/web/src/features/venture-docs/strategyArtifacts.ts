import type {
  ArtifactProposal,
  VentureDocument,
  VenturePageKey,
} from '@/lib/types';

/* ============================================================
   Turn an accepted proposal into a VentureDocument.
   ============================================================ */

export function proposalToDocument(
  proposal: ArtifactProposal,
  ventureId: string,
  ventureName: string
): VentureDocument {
  const now = new Date().toISOString();
  const isHeadline = ['icp', 'positioning', 'brand'].includes(proposal.kind);

  return {
    id: `doc_${proposal.kind}_${ventureId}`,
    ventureId,
    kind: proposal.kind,
    title: proposal.title,
    summary: proposal.proposedSummary,
    content: proposal.proposedContent.replace(
      /\{\{ventureName\}\}/g,
      ventureName
    ),
    producedBy: 'strategy' as VenturePageKey,
    consumedFrom: ['strategy'],
    status: 'draft',
    isHeadline,
    citations: proposal.citations,
    builtOnDraftInput: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Which proposals are headline (gating downstream) vs supporting.
 * Only headline docs go through the approval gate.
 */
export const HEADLINE_KINDS = ['icp', 'positioning', 'brand'] as const;

export function isHeadlineKind(kind: string): boolean {
  return (HEADLINE_KINDS as readonly string[]).includes(kind);
}
