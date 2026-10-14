import { useParams } from 'react-router-dom';
import { FeedbackList } from '@/features/venture-actions/surfaces/FeedbackList';

/**
 * ShareFeedbackTab — mounts the FeedbackList on a venture page.
 * Renders inside any Section that wants to show viewer comments.
 * Reads ventureId from the route.
 */
export function ShareFeedbackTab() {
  const { ventureId } = useParams<{ ventureId: string }>();
  return <FeedbackList ventureId={ventureId ?? ''} />;
}
