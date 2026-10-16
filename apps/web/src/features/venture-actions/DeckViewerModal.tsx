import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDeckViewer } from '@/lib/stores/deckViewerStore';

/**
 * DeckViewerModal — full-screen slide viewer.
 * Keyboard: ← → to navigate, Esc to close.
 */
export function DeckViewerModal() {
  const open = useDeckViewer((s) => s.open);
  const slides = useDeckViewer((s) => s.slides);
  const title = useDeckViewer((s) => s.title);
  const currentIndex = useDeckViewer((s) => s.currentIndex);
  const close = useDeckViewer((s) => s.close);
  const next = useDeckViewer((s) => s.next);
  const prev = useDeckViewer((s) => s.prev);
  const goTo = useDeckViewer((s) => s.goTo);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close, next, prev]);

  if (!open || slides.length === 0) return null;

  const slide = slides[currentIndex];

  return (
    <div className="deck-viewer" role="dialog" aria-modal="true">
      <div className="deck-viewer__backdrop" onClick={close} />

      <div className="deck-viewer__panel">
        <header className="deck-viewer__toolbar">
          <span className="deck-viewer__eyebrow">Deck</span>
          <h2 className="deck-viewer__title">{title ?? 'Untitled deck'}</h2>
          <span className="deck-viewer__counter">
            {currentIndex + 1} / {slides.length}
          </span>
          <button
            type="button"
            className="deck-viewer__btn"
            onClick={close}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="deck-viewer__stage">
          <article className="deck-slide">
            {slide.eyebrow && (
              <span className="deck-slide__eyebrow">{slide.eyebrow}</span>
            )}
            <h1 className="deck-slide__title">{slide.title}</h1>
            {slide.body && <p className="deck-slide__body">{slide.body}</p>}
            {slide.bullets && slide.bullets.length > 0 && (
              <ul className="deck-slide__bullets">
                {slide.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
            {slide.metric && (
              <div className="deck-slide__metric">
                <span className="deck-slide__metric-value">
                  {slide.metric.value}
                </span>
                <span className="deck-slide__metric-label">
                  {slide.metric.label}
                </span>
              </div>
            )}
          </article>

          <button
            type="button"
            className="deck-viewer__nav deck-viewer__nav--prev"
            onClick={prev}
            disabled={currentIndex === 0}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="deck-viewer__nav deck-viewer__nav--next"
            onClick={next}
            disabled={currentIndex === slides.length - 1}
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <footer className="deck-viewer__rail">
          {slides.map((_s, i) => (
            <button
              key={i}
              type="button"
              className={`deck-viewer__dot${i === currentIndex ? ' is-active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </footer>
      </div>
    </div>
  );
}
