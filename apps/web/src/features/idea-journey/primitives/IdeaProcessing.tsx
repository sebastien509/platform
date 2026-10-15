/**
 * IdeaProcessing — the "agent is thinking" placeholder.
 *
 * Wraps HexProcessing with the journey's default size + palette.
 * Change the props here to retune every capture / clean / synthesize
 * loading state at once.
 */

import { HexProcessing } from './HexProcessing';

export function IdeaProcessing() {
  return (
    <div
      className="idea-processing"
      aria-live="polite"
      aria-label="Agent is thinking"
      role="status"
    >
      <div className="idea-processing__hex-clip">
        <HexProcessing
          size={140}
          color="#8a8a8a"
          thickness={2}
        />
      </div>
    </div>
  );
}
