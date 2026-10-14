import type { VentureDocument } from '@/lib/types';
import type { Deliverable } from '@/lib/deliverables';
import type { ShareSnapshot } from '@/lib/share';
import type { RenderType } from '../page-actions';
import type { ResearchSection } from '@/lib/types';
import type { ShareSection } from '@/lib/share';

/* ============================================================
   shareSectionToResearchSection

   The LLM produces ShareSection (flat shape). The printed-document
   renderer expects ResearchSection (nested shape). This converter
   bridges the two so op outputs render through the same
   SectionRenderer as research memos.
   ============================================================ */
export function shareSectionToResearchSection(s: ShareSection): ResearchSection {
  switch (s.type) {
    case 'paragraph':
      return {
        id: s.id,
        type: 'paragraph',
        label: s.label ?? null,
        paragraph: s.body,
      };
    case 'callout':
      return {
        id: s.id,
        type: 'callout',
        label: s.label ?? null,
        callout: { label: s.label ?? null, body: s.body, tone: s.tone },
      };
    case 'metrics':
      return {
        id: s.id,
        type: 'metrics',
        label: s.label ?? null,
        metrics: s.items.map((m) => ({
          label: m.label,
          value: m.value,
          delta: m.delta ?? null,
          trend: m.trend ?? null,
        })),
      };
    case 'list':
      return {
        id: s.id,
        type: 'list',
        label: s.label ?? null,
        list: s.items.map((i) => ({
          title: i.title,
          body: i.body ?? null,
          meta: i.meta ?? null,
        })),
      };
    case 'code':
      return {
        id: s.id,
        type: 'code',
        label: s.label ?? null,
        code: { language: s.language ?? null, code: s.code },
      };
    case 'timeline':
      return {
        id: s.id,
        type: 'timeline',
        label: s.label ?? null,
        timeline: s.items.map((i) => ({
          when: i.when,
          title: i.title,
          body: i.body ?? null,
          status: i.status ?? null,
        })),
      };
    case 'hero':
      return {
        id: s.id,
        type: 'hero',
        label: null,
        hero: {
          eyebrow: s.eyebrow ?? null,
          headline: s.headline,
          subhead: s.subhead ?? null,
          ctaLabel: s.cta?.label ?? null,
        },
      };
    case 'feature-grid':
      return {
        id: s.id,
        type: 'feature-grid',
        label: s.label ?? null,
        featureGrid: s.items.map((i) => ({ title: i.title, body: i.body })),
      };
    case 'pricing':
      return {
        id: s.id,
        type: 'pricing',
        label: s.label ?? null,
        pricing: s.tiers.map((t) => ({
          name: t.name,
          price: t.price,
          cadence: t.cadence ?? null,
          features: t.features,
          highlighted: t.highlighted ?? false,
        })),
      };
    case 'embed':
      return {
        id: s.id,
        type: 'embed',
        label: s.label ?? null,
        embed: { html: s.html, aspect: s.aspect ?? null },
      };
    case 'terms':
      return {
        id: s.id,
        type: 'terms',
        label: s.label ?? null,
        terms: s.items.map((i) => ({ label: i.label, body: i.body })),
      };
    default:
      return {
        id: (s as any).id ?? `sec-${Math.random().toString(36).slice(2, 6)}`,
        type: 'paragraph',
        paragraph: '',
      };
  }
}


/**
 * snapshotToDocument — convert a ShareSnapshot to a VentureDocument
 * so it renders inside the DocumentViewerDrawer. Used both at
 * validation time (persisted deliverables) and at Review time
 * (live run snapshots).
 */
export function snapshotToDocument(
  snapshot: ShareSnapshot,
  pageId: string,
  renderType: RenderType = 'markdown',
  id?: string,
  /* Defaults to 'draft' — the safer default for a fresh open.
     Callers that pass a validated deliverable explicitly pass
     'approved'. */
  status: 'draft' | 'approved' | 'needs_revision' = 'draft'
): VentureDocument {
  /* Pass sections through — the DocumentViewerDrawer's existing
     sections dispatch renders them via SectionRenderer with the
     full PrintDocFrame chrome. No more markdown flattening. */
  const sections: ResearchSection[] = snapshot.sections.map(
    shareSectionToResearchSection
  );

  return {
    id: id ?? `doc_${Date.now().toString(36)}`,
    title: snapshot.title,
    kind: mapRenderTypeToDocKind(renderType),
    status,
    isHeadline: false,
    summary: snapshot.kicker,
    content: '',
    sections,
    producedBy: pageId as any,
    citations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as unknown as VentureDocument;
}


/**
 * deliverableToDocument — wraps snapshotToDocument for persisted
 * deliverables.
 */
export function deliverableToDocument(d: Deliverable): VentureDocument {
  return snapshotToDocument(
    d.snapshot,
    d.pageId,
    (d.renderType ?? 'markdown') as RenderType,
    d.id,
    'approved'
  );
}

function mapRenderTypeToDocKind(rt: RenderType): any {
  switch (rt) {
    case 'report':
      return 'research';
    case 'code':
      return 'technical_spec';
    case 'markdown':
    default:
      return 'strategy_brief';
  }
}
