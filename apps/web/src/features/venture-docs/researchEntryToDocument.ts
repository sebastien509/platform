import type { ResearchEntry, VentureDocument } from '@/lib/types';

/**
 * researchEntryToDocument — wraps a ResearchEntry as a VentureDocument
 * so it can open in the DocumentViewerDrawer.
 *
 * Sections carry the structured memo content; the drawer dispatches
 * to ResearchDocumentContent when `sections` is present.
 */
export function researchEntryToDocument(
  entry: ResearchEntry,
  ventureId: string
): VentureDocument {
  return {
    id: entry.id,
    ventureId,
    kind: 'research_report' as any,
    title: entry.title,
    summary: entry.summary,
    content: '',
    sections: entry.sections,
    citations: [],
    producedBy: 'knowledge',
    consumedFrom: [],
    isHeadline: false,
    builtOnDraftInput: false,
    status: 'approved',
    createdAt: entry.createdAt,
    updatedAt: entry.createdAt,
  } as unknown as VentureDocument;
}
