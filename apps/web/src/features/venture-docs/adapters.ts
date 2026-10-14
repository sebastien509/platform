import type { KnowledgeEntry, VentureDocument } from '@/lib/types';

/**
 * Adapter — KnowledgeEntry → VentureDocument.
 *
 * Research reports produced during the idea stage aren't venture
 * documents, but the DocumentViewerDrawer renders VentureDocument.
 * This adapter bridges the two so the founder reviews reports in
 * the same drawer that renders every other document on the platform.
 *
 * Fields the viewer needs but KnowledgeEntry doesn't carry are set
 * to sensible defaults. `producedBy: 'knowledge'` is the correct
 * provenance — these reports came from the knowledge system.
 */
export function knowledgeEntryToDocument(
  entry: KnowledgeEntry
): VentureDocument {
  return {
    id: entry.id,
    title: entry.title,
    summary: entry.summary ?? '',
    content: entry.content ?? '',
    kind: (entry.type ?? 'research_report') as VentureDocument['kind'],
    status: 'draft',
    producedBy: 'knowledge',
    isHeadline: false,
    citations: (entry.citations ?? []) as unknown as VentureDocument['citations'],
    createdAt: entry.createdAt,
    updatedAt: entry.createdAt,
    approvedAt: undefined,
    revisionNote: undefined,
    builtOnDraftInput: false,
  } as VentureDocument;
}