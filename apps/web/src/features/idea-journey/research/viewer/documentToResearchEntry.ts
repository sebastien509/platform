import type { VentureDocument, ResearchEntry, ResearchThreadKind } from '@/lib/types';

/**
 * documentToResearchEntry — adapts a VentureDocument carrying
 * structured `sections` into the ResearchEntry shape the viewer
 * templates expect.
 *
 * Kind is inferred from the page or defaults to 'market'.
 */
/* Op outputs render through the same printed document as
   research memos. The chrome label distinguishes them — a
   Strategy Brief reads as "Strategy Brief", not "Research Memo". */
const PAGE_TYPE_LABEL: Record<string, string> = {
  strategy: 'Strategy Brief',
  product: 'Product',
  engineering: 'Technical Documentation',
  gtm: 'GTM Plan',
  campaigns: 'Campaign',
  sales: 'Proposal',
  growth: 'Growth',
  analytics: 'Analytics',
  knowledge: 'Research Memo',
  outcomes: 'Outcomes',
};

export function documentToResearchEntry(doc: VentureDocument): ResearchEntry {
  const pageKind = (doc as any).researchKind as ResearchThreadKind | undefined;
  const kind: ResearchThreadKind =
    pageKind ?? guessKindFromTitle(doc.title);

  /* Derive the chrome label from the doc's origin page. Research
     memos (kind = market/competitor/customer) keep their own
     labels via KIND_LABEL; op outputs get a page-specific label. */
  const typeLabel =
    PAGE_TYPE_LABEL[(doc as any).producedBy] ?? undefined;

  return {
    id: doc.id,
    kind,
    title: doc.title,
    summary: doc.summary ?? '',
    sections: doc.sections ?? [],
    confidence: (doc as any).confidence ?? 70,
    founderPrompt: (doc as any).founderPrompt,
    typeLabel,
    createdAt: doc.createdAt,
  };
}

function guessKindFromTitle(title: string): ResearchThreadKind {
  const t = title.toLowerCase();
  if (t.includes('competit') || t.includes('landscape')) return 'competitor';
  if (t.includes('customer') || t.includes('interview')) return 'customer';
  return 'market';
}
