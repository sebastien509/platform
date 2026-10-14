import { useReducedMotion } from '@/lib/motion/useReducedMotion';

/**
 * Background: video layer + animated gradient overlay + edge tint.
 *
 * Layering order (bottom → top):
 *   1. Video (opacity 0.5, saturated, dimmed)
 *   2. Animated oklch gradient blended on top
 *   3. Top/bottom surface-0 tint for text legibility
 *
 * The video URL includes Cloudinary transform params
 * (q_auto,f_auto,w_1920) so the delivered file is size-optimized.
 */
const BG_VIDEO_URL =
  'https://res.cloudinary.com/dvcmopd4q/video/upload/v1790621335/132695-754551900_ue1elo.mp4';

export function IdeaJourneyBackground() {
  const reduced = useReducedMotion();

  return (
    <div className="idea-journey-shell__bg" aria-hidden="true">
      {!reduced && (
        <video
          className="idea-journey-shell__bg-video"
          src={BG_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
        />
      )}
      <div className="idea-journey-shell__bg-gradient" />
      <div className="idea-journey-shell__bg-tint" />
    </div>
  );
}
