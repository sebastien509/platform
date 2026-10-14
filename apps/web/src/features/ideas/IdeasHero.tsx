
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Plus } from 'lucide-react';

import { IdeaStatusBadge } from './IdeaStatusBadge';
import { IdeasHexNetwork } from './IdeasHexNetwork';
import { statusDetail } from './listStatus';

import { placeholderHue } from '@/lib/utils/placeholderHue';
import { cn } from '@/lib/utils/cn';

import type {
  Idea,
  IdeaJourney,
  IdeaListStatus,
} from '@/lib/types';

interface HeroRow {
  idea: Idea;
  journey?: IdeaJourney;
  status: IdeaListStatus;
}

interface IdeasHeroProps {
  needingAction: HeroRow[];
  onOpen: (ideaId: string) => void;
  onCapture: () => void;
}

export function IdeasHero({
  needingAction,
  onOpen,
  onCapture,
}: IdeasHeroProps) {
  const [index, setIndex] = useState(0);

  if (needingAction.length === 0) {
    return (
      <div className="iv-card ideas-hero ideas-hero--cta">
        <div className="iv-card__body">
          <p className="text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            You're caught up
          </p>

          <h2 className="iv-card__title mt-2">
            Start a new idea
          </h2>

          <Button
            onClick={onCapture}
            className="w-full gap-1.5 mt-4"
          >
            <Plus className="h-4 w-4" />
            Capture an idea
          </Button>
        </div>
      </div>
    );
  }

  const safeIndex = Math.min(index, needingAction.length - 1);
  const current = needingAction[safeIndex];
  const detail = statusDetail(current.status, current.journey);
  const hue = placeholderHue(current.idea.id);

  return (
    <div className="iv-card ideas-hero">
      <div
        className="idea-card__cover"
        style={
          { '--idea-hue': String(hue) } as React.CSSProperties
        }
        aria-hidden="true"
      >
        <IdeasHexNetwork variant="hero" />
      </div>

      <div className="iv-card__body">
        <div className="flex items-center gap-2 flex-wrap">
          <IdeaStatusBadge status={current.status} />

          {detail && (
            <span className="text-2xs text-[var(--text-muted)]">
              {detail}
            </span>
          )}
        </div>

        <h2 className="iv-card__title mt-2">
          {current.idea.title || 'Untitled idea'}
        </h2>

        {current.idea.description && (
          <p className="iv-card__meta">
            {current.idea.description}
          </p>
        )}

        {needingAction.length > 1 && (
          <div
            className="ideas-hero__dots mt-4"
            role="status"
            aria-label={`${safeIndex + 1} of ${needingAction.length}`}
          >
            {needingAction.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show idea ${i + 1}`}
                className={cn(
                  'ideas-hero__dot',
                  i === safeIndex && 'is-active'
                )}
              />
            ))}
          </div>
        )}

        <Button
          onClick={() => onOpen(current.idea.id)}
          className="w-full gap-1.5 mt-4"
        >
          Continue where you left off
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
