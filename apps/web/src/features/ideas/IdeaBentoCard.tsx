
import { ArrowRight } from 'lucide-react';

import { IdeaStatusBadge } from './IdeaStatusBadge';
import { IdeasHexNetwork } from './IdeasHexNetwork';
import { statusDetail } from './listStatus';

import { placeholderHue } from '@/lib/utils/placeholderHue';

import type {
  Idea,
  IdeaJourney,
  IdeaListStatus,
} from '@/lib/types';

interface IdeaBentoCardProps {
  idea: Idea;
  journey?: IdeaJourney;
  status: IdeaListStatus;
  onClick: () => void;
}

export function IdeaBentoCard({
  idea,
  journey,
  status,
  onClick,
}: IdeaBentoCardProps) {
  const hue = placeholderHue(idea.id);
  const detail = statusDetail(status, journey);

  return (
    <button
      type="button"
      onClick={onClick}
      className="idea-bento-card"
      style={
        { '--idea-hue': String(hue) } as React.CSSProperties
      }
    >
      <div className="idea-bento-card__cover" aria-hidden="true">
        <IdeasHexNetwork variant="card" />
      </div>

      <div className="idea-bento-card__body">
        <div className="idea-bento-card__header">
          <h3 className="idea-bento-card__title">
            {idea.title}
          </h3>

          <IdeaStatusBadge status={status} />
        </div>

        {idea.description && (
          <p className="idea-bento-card__description">
            {idea.description}
          </p>
        )}

        <div className="idea-bento-card__footer">
          {detail && (
            <span className="idea-bento-card__detail">
              {detail}
            </span>
          )}

          <ArrowRight className="idea-bento-card__arrow" />
        </div>
      </div>
    </button>
  );
}
