import type { ResearchSection } from '@/lib/types';

function getInitials(name: string): string {
  return name
    .trim()
    .split(/[\s,]+/)
    .filter((w) => w.length > 0 && /^[A-Za-zÀ-ÿ]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

type Severity = 'high' | 'medium' | 'low';

function parseSeverity(meta?: string | null): Severity | null {
  if (!meta) return null;
  const m = meta.match(/severity[:\s]+(high|medium|med|low)/i);
  if (!m) return null;
  const v = m[1].toLowerCase();
  if (v === 'med') return 'medium';
  return v as Severity;
}

function severityLevel(s: Severity): 1 | 2 | 3 {
  return s === 'high' ? 3 : s === 'medium' ? 2 : 1;
}

function severityLabel(s: Severity): string {
  return s === 'high' ? 'High' : s === 'medium' ? 'Medium' : 'Low';
}

function looksLikePerson(title: string): boolean {
  const cleaned = title
    .trim()
    .replace(/^(Dr|Mr|Mrs|Ms|Prof|Sir|Mx|Rev)\.?\s+/i, '');
  return /^[A-Z][a-zÀ-ÿ]+\s+[A-Z]/.test(cleaned);
}

export function ListSection({ section }: { section: ResearchSection }) {
  const items = section.list ?? [];
  if (items.length === 0) return null;

  const isArchetype =
    items.length >= 2 &&
    items.every(
      (i) => typeof i.title === 'string' && looksLikePerson(i.title),
    );

  const severities = items.map((i) => parseSeverity(i.meta));
  const hasSeverity = severities.some((s) => s !== null);

  if (isArchetype) {
    return (
      <section className="rv-section">
        {section.label && (
          <div className="rv-section__rail">
            <span>{section.label}</span>
          </div>
        )}
        <div className="rv-section__content">
          <ol className="rv-archetypes">
            {items.map((item, i) => (
              <li key={i} className="rv-archetype">
                <span className="rv-archetype__avatar">
                  {getInitials(item.title ?? '')}
                </span>
                <span className="rv-archetype__n">{pad(i + 1)}</span>
                <div className="rv-archetype__body">
                  <h3 className="rv-archetype__name">{item.title}</h3>
                  {item.body && (
                    <p className="rv-archetype__detail">{item.body}</p>
                  )}
                  {item.meta && (
                    <div className="rv-archetype__fit">
                      <span className="rv-archetype__fit-label">
                        Why they fit
                      </span>
                      <p className="rv-archetype__fit-text">{item.meta}</p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  if (hasSeverity) {
    const order: Severity[] = ['high', 'medium', 'low'];
    const groups: Record<Severity, typeof items> = {
      high: [],
      medium: [],
      low: [],
    };
    for (let i = 0; i < items.length; i++) {
      const sev = severities[i] ?? 'medium';
      groups[sev].push(items[i]);
    }

    let runningIndex = 0;
    return (
      <section className="rv-section">
        {section.label && (
          <div className="rv-section__rail">
            <span>{section.label}</span>
          </div>
        )}
        <div className="rv-section__content">
          {order.map((level) => {
            if (groups[level].length === 0) return null;
            return (
              <div key={level}>
                <div className="rv-group">{severityLabel(level)} severity</div>
                <ol className="rv-rows">
                  {groups[level].map((item, i) => {
                    runningIndex += 1;
                    return (
                      <li key={`${level}-${i}`} className="rv-row">
                        <span className="rv-row__n">{pad(runningIndex)}</span>
                        <div className="rv-row__body">
                          <h3 className="rv-row__title">{item.title}</h3>
                          {item.body && (
                            <p className="rv-row__detail">{item.body}</p>
                          )}
                        </div>
                        <span
                          className="rv-sev"
                          data-level={severityLevel(level)}
                        >
                          <span className="rv-sev__bars" aria-hidden>
                            <b />
                            <b />
                            <b />
                          </span>
                          {severityLabel(level)}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="rv-section">
      {section.label && (
        <div className="rv-section__rail">
          <span>{section.label}</span>
        </div>
      )}
      <div className="rv-section__content">
        <ol className="rv-rows">
          {items.map((item, i) => (
            <li key={i} className="rv-row">
              <span className="rv-row__n">{pad(i + 1)}</span>
              <div className="rv-row__body">
                <h3 className="rv-row__title">{item.title}</h3>
                {item.body && (
                  <p className="rv-row__detail">{item.body}</p>
                )}
              </div>
              {item.meta && (
                <span className="rv-row__tag">{item.meta}</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
