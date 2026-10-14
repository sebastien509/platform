import type { ResearchSection } from '@/lib/types';

/** A cell is "numeric" if it's a number, percentage, currency, or
 *  a short range/delta — not prose. */
function isNumericCell(v: unknown): boolean {
  if (v == null) return false;
  const s = String(v).trim();
  if (!s) return false;
  if (s.length > 18) return false;
  return /^[\s$€£¥+-]?[\d,.]+(\s*[-–—]\s*[\s$€£¥]?[\d,.]+)?\s*(%|x|k|m|b|bn|\/mo)?$/i.test(
    s,
  );
}

export function TableSection({ section }: { section: ResearchSection }) {
  const t = section.table;
  if (!t || !t.columns || t.columns.length === 0) return null;

  /* Which columns are numeric across all rows? Those get right-aligned. */
  const numericCols = t.columns.map((_, ci) =>
    (t.rows ?? []).every((row) => isNumericCell(row[ci])),
  );

  return (
    <section className="rv-section">
      {section.label && (
        <div className="rv-section__rail">
          <span>{section.label}</span>
        </div>
      )}
      <div className="rv-section__content">
        <figure className="rv-table-wrap">
          <div
            className="rv-table-scroll"
            tabIndex={0}
            style={
              { '--rv-cols': t.columns.length } as React.CSSProperties
            }
          >
            <table className="rv-table">
              <thead>
                <tr>
                  {t.columns.map((col, i) => (
                    <th key={i} className={numericCols[i] ? 'is-num' : undefined}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.rows?.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={numericCols[ci] ? 'is-num' : undefined}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {t.caption && (
            <figcaption className="rv-table__caption">{t.caption}</figcaption>
          )}
        </figure>
      </div>
    </section>
  );
}
