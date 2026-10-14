import { cn } from '@/lib/utils/cn';
import type { IdeaStage, IdeaStageState } from '@/lib/types';

const STAGE_ORDER: IdeaStage[] = [
  'capture',
  'clean',
  'research',
  'synthesize',
  'validate',
  'transition',
];

const STAGE_LABEL: Record<IdeaStage, string> = {
  capture: 'Capture',
  clean: 'Clean',
  research: 'Research',
  synthesize: 'Synthesize',
  validate: 'Validate',
  transition: 'Transition',
};

const TICK_COUNT = 5;

interface JourneyProgressProps {
  current: IdeaStage;
  stageStates: Record<IdeaStage, IdeaStageState>;
  /**
   * Fires when the founder clicks a clickable node.
   * Only completed previous stages are clickable.
   */
  onJump?: (stage: IdeaStage) => void;
  /** Demo/walkthrough flag — when true, next stages become clickable too. */
  demoMode?: boolean;
}

export function JourneyProgress({
  current,
  stageStates,
  onJump,
  demoMode = false,
}: JourneyProgressProps) {
  const idx = STAGE_ORDER.indexOf(current);
  const prev = idx > 0 ? STAGE_ORDER[idx - 1] : null;
  const next = idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;

  /* Prev is clickable only if it's a completed stage. */
  const prevClickable = Boolean(
    prev && onJump && stageStates[prev] === 'complete'
  );
  /* Next is clickable only in demo mode. */
  const nextClickable = Boolean(next && onJump && demoMode);

  const jump = (stage: IdeaStage | null) => {
    if (!stage || !onJump) return;
    onJump(stage);
  };

  return (
    <nav
      className={cn('journey-progress', demoMode && 'is-demo')}
      aria-label="Journey progress"
    >
      <div className="journey-progress__stack">
        {/* ---- Previous stage ---- */}
        {prev &&
          (prevClickable ? (
            <button
              type="button"
              className={cn(
                'journey-progress__node is-complete is-clickable'
              )}
              onClick={() => jump(prev)}
              aria-label={`Go back to ${STAGE_LABEL[prev]}`}
            >
              <span className="journey-progress__dot is-complete" />
              <span className="journey-progress__tooltip">
                {STAGE_LABEL[prev]}
              </span>
            </button>
          ) : (
            /* Not clickable — plain div. No button, no pointer, no click. */
            <div
              className={cn(
                'journey-progress__node',
                stageStates[prev] === 'complete' && 'is-complete'
              )}
              aria-hidden="true"
            >
              <span
                className={cn(
                  'journey-progress__dot',
                  stageStates[prev] === 'complete' && 'is-complete'
                )}
              />
            </div>
          ))}

        {/* ---- Path ---- */}
        {prev && (
          <div className="journey-progress__path" aria-hidden="true">
            {Array.from({ length: TICK_COUNT }).map((_, i) => (
              <span key={i} className="journey-progress__tick" />
            ))}
          </div>
        )}

        {/* ---- Active stage ---- */}
        <div className="journey-progress__node is-active">
          <span className="journey-progress__dot is-active" />
          <span className="journey-progress__label">
            {STAGE_LABEL[current]}
          </span>
        </div>

        {/* ---- Path ---- */}
        {next && (
          <div className="journey-progress__path" aria-hidden="true">
            {Array.from({ length: TICK_COUNT }).map((_, i) => (
              <span key={i} className="journey-progress__tick" />
            ))}
          </div>
        )}

        {/* ---- Next stage ---- */}
        {next &&
          (nextClickable ? (
            <button
              type="button"
              className="journey-progress__node is-future is-clickable"
              onClick={() => jump(next)}
              aria-label={`Jump to ${STAGE_LABEL[next]}`}
            >
              <span className="journey-progress__dot is-future" />
              <span className="journey-progress__tooltip">
                {STAGE_LABEL[next]}
              </span>
            </button>
          ) : (
            /* Not clickable — plain div. */
            <div
              className="journey-progress__node is-future"
              aria-hidden="true"
            >
              <span className="journey-progress__dot is-future" />
            </div>
          ))}
      </div>
    </nav>
  );
}