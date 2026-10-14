import type { ResearchSection } from '@/lib/types';

export function TimelineSection({ section }: { section: ResearchSection }) {
  const items = section.timeline ?? [];
  if (items.length === 0) return null;
  return (
    <section className="rv-section">
      {section.label && (
        <div className="rv-section__rail">
          <span>{section.label}</span>
        </div>
      )}
      <div className="rv-section__content">
        <ol className="rv-timeline">
          {items.map((item, i) => (
            <li key={i} className="rv-timeline__item">
              <div className="rv-timeline__rail">
                <span className="rv-timeline__dot" />
                {i < items.length - 1 && (
                  <span className="rv-timeline__line" />
                )}
              </div>
              <div className="rv-timeline__body">
                <div className="rv-timeline__head">
                  <span className="rv-timeline__when">{item.when}</span>
                  {item.status && (
                    <span className="rv-timeline__status">
                      {item.status}
                    </span>
                  )}
                </div>
                <h3 className="rv-timeline__title">{item.title}</h3>
                {item.body && (
                  <p className="rv-timeline__detail">{item.body}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
