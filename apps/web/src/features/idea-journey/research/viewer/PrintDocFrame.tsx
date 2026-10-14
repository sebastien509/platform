import type { ReactNode } from 'react';
import { FileText } from 'lucide-react';
import type { ResearchThreadKind, ResearchSection } from '@/lib/types';

/* ============================================================
   PrintDocFrame — the editorial page around the document.

   Structure:
     · Masthead: kind badge, IV mark, H1, subhead, meta
     · Facts strip: pulled from the metrics section
     · Body: sections render inside
     · Footer: title + brand mark

   v2: status pill, confidence meter, adaptive facts strip.
   ============================================================ */

const KIND_LABEL: Record<ResearchThreadKind, string> = {
  market: 'Founder Research Memo',
  competitor: 'Competitor Landscape Memo',
  customer: 'Customer Signal Memo',
};

interface Hero {
  eyebrow?: string | null;
  headline?: string | null;
  subhead?: string | null;
  ctaLabel?: string | null;
}

interface Metric {
  label: string;
  value: string;
  note?: string | null;
}

interface Props {
  kind: ResearchThreadKind;
  typeLabel?: string;
  title: string;
  summary?: string;
  confidence?: number;
  founderPrompt?: string;
  hero?: Hero | null;
  facts?: Metric[] | null;
  /** v2 — status pill. 'approved' | 'validated' → Approved. Else Draft. */
  status?: string;
  children: ReactNode;
}

function normalizeStatus(s: string | undefined): 'approved' | 'draft' {
  if (!s) return 'draft';
  const l = s.toLowerCase();
  if (l === 'approved' || l === 'validated') return 'approved';
  return 'draft';
}

export function PrintDocFrame({
  kind,
  typeLabel,
  title,
  summary,
  confidence,
  founderPrompt,
  hero,
  facts,
  status,
  children,
}: Props) {
  const displayTitle = hero?.headline?.trim() || title;
  const displaySub = hero?.subhead?.trim() || summary;
  const normalizedStatus = normalizeStatus(status);
  const statusLabel = normalizedStatus === 'approved' ? 'Approved' : 'Draft';
  const factsCols = facts && facts.length > 0 ? Math.min(facts.length, 4) : 4;
  const hasConfidence = typeof confidence === 'number';

  return (
    <div className="pdf-page">
      <div className="pdf-page__inner">
        <div className="pdf-chrome">
          <span className="pdf-chrome__type">
            {typeLabel ?? KIND_LABEL[kind]}
          </span>
          <span className="pdf-chrome__brand" aria-label="IV">
            IV
          </span>
        </div>

        <header className="pdf-title">
          <h1 className="pdf-title__title">{displayTitle}</h1>
          {displaySub && (
            <p className="pdf-title__subtitle">{displaySub}</p>
          )}
          <div className="pdf-title__meta">
            <span
              className="rv-status"
              data-status={normalizedStatus}
            >
              {statusLabel}
            </span>
            <span className="pdf-title__byline">Prepared by IV Research</span>
            {hasConfidence && (
              <span className="pdf-title__confidence">
                <span className="rv-conf__bar" aria-hidden>
                  <span style={{ width: `${confidence}%` }} />
                </span>
                <strong>{confidence}% confidence</strong>
              </span>
            )}
            {founderPrompt && (
              <span className="pdf-title__focus">
                Focus: {founderPrompt}
              </span>
            )}
          </div>
        </header>

        {facts && facts.length > 0 && (
          <dl className="rv-facts" data-cols={factsCols}>
            {facts.map((m, i) => {
              const len = String(m.value ?? '').length;
              const isLong = len > 20;
              return (
                <div key={i} className="rv-fact">
                  <dt>{m.label}</dt>
                  <dd className={isLong ? 'is-long' : undefined}>
                    {m.value}
                  </dd>
                  {m.note && (
                    <span className="rv-fact__note">{m.note}</span>
                  )}
                </div>
              );
            })}
          </dl>
        )}

        <div className="pdf-body">{children}</div>

        <footer className="pdf-footer">
          <span className="pdf-footer__title">{title}</span>
          <span className="pdf-footer__mark">
            <FileText className="h-3 w-3" aria-hidden />
            IV Research
          </span>
        </footer>
      </div>
    </div>
  );
}

/** Pull the hero + first metrics section out of the sections list.
 *  Everything else renders below the masthead. */
export function splitSections(sections: ResearchSection[]): {
  hero: Hero | null;
  facts: Metric[] | null;
  rest: ResearchSection[];
} {
  const heroSec = sections.find((s) => s.type === 'hero') as any;
  const metricsIdx = sections.findIndex((s) => s.type === 'metrics');
  const metricsSec =
    metricsIdx >= 0 ? (sections[metricsIdx] as any) : null;

  const rest = sections.filter((s, i) => {
    if (s.type === 'hero') return false;
    if (i === metricsIdx) return false;
    return true;
  });

  return {
    hero: heroSec?.hero ?? null,
    facts: metricsSec?.metrics ?? null,
    rest,
  };
}
