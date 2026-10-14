import { useParams } from 'react-router-dom';
import { useLink } from '@/lib/share';
import { getSurfaceRenderer } from '@/features/venture-actions/surfaces';

/**
 * SharedSurface — standalone viewer for a share link.
 * Route: /share/:linkId
 * No auth. Renders whichever surface the link points to.
 */
export default function SharedSurface() {
  const { linkId } = useParams<{ linkId: string }>();
  const link = useLink(linkId);

  if (!link) {
    return (
      <div className="shared-surface shared-surface--missing">
        <div className="shared-surface__missing-inner">
          <h1>This link is no longer available</h1>
          <p>
            The link may have expired, been revoked, or the venture was
            archived. Ask the sender for a fresh link.
          </p>
        </div>
      </div>
    );
  }

  const Renderer = getSurfaceRenderer(link.surfaceId);

  if (!Renderer) {
    return (
      <div className="shared-surface shared-surface--missing">
        <div className="shared-surface__missing-inner">
          <h1>Surface not available</h1>
          <p>This kind of surface isn't supported yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-surface">
      <div className="shared-surface__container">
        <Renderer linkId={link.id} />
      </div>
    </div>
  );
}
