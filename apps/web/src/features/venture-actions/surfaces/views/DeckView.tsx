import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useLink } from '@/lib/share';
import { SurfaceSections } from '../sections';

/**
 * DeckView — each section becomes a slide.
 * Simple prev/next navigation. Each slide is full-viewport.
 */
export function DeckView({ linkId }: { linkId: string }) {
  const link = useLink(linkId);
  const [index, setIndex] = useState(0);

  if (!link) return null;
  const sections = link.snapshot.sections;
  if (sections.length === 0) return null;

  const total = sections.length;
  const current = sections[index];
  const atStart = index === 0;
  const atEnd = index === total - 1;

  return (
    <div className="deck-view">
      <div className="deck-view__slide">
        <header className="deck-view__slide-head">
          <span className="deck-view__eyebrow">{link.snapshot.title}</span>
          <span className="deck-view__counter">
            {index + 1} / {total}
          </span>
        </header>
        <div className="deck-view__slide-body">
          <SurfaceSections sections={[current]} />
        </div>
      </div>

      <div className="deck-view__controls">
        <button
          type="button"
          className={cn('deck-view__btn', atStart && 'is-disabled')}
          onClick={() => !atStart && setIndex(index - 1)}
          disabled={atStart}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <div className="deck-view__dots">
          {sections.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              className={cn('deck-view__dot', i === index && 'is-active')}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
        <button
          type="button"
          className={cn('deck-view__btn', atEnd && 'is-disabled')}
          onClick={() => !atEnd && setIndex(index + 1)}
          disabled={atEnd}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
