import type { VentureSection } from './engine/types';

export function LearningTimeline({
  section,
}: {
  section: Extract<VentureSection, { type: 'learning-timeline' }>;
}) {
  return (
    <ol className="learning-timeline">
      {section.events.map((e, i) => (
        <li key={e.id} className="learning-timeline__item">
          <div className="learning-timeline__rail">
            <span className="learning-timeline__dot" />
            {i < section.events.length - 1 && (
              <span className="learning-timeline__line" />
            )}
          </div>
          <div className="learning-timeline__content">
            <span className="learning-timeline__when">{e.when}</span>
            <span className="learning-timeline__title">{e.title}</span>
            {e.body && (
              <span className="learning-timeline__body">{e.body}</span>
            )}
            {typeof e.confidenceFrom === 'number' &&
              typeof e.confidenceTo === 'number' && (
                <span className="learning-timeline__confidence">
                  Confidence {e.confidenceFrom}% → {e.confidenceTo}%
                </span>
              )}
          </div>
        </li>
      ))}
    </ol>
  );
}
