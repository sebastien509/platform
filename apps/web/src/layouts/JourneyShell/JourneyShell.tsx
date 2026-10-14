import { useState } from 'react';
import { Link, Outlet, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { BRAND_ASSETS, cldTransform } from '@/lib/assets';
import { useIdeas } from '@/lib/hooks/useIdeas';
import { useJourneyStore } from '@/lib/stores/journeyStore';
import { unwrapList } from '@/lib/utils/unwrap';
import { isLocalIdeaId } from '@/features/ideas/localIdea';
import { ExitRailModal } from '@/features/idea-journey/ExitRailModal';

export function JourneyShell() {
  const navigate = useNavigate();
  const params = useParams<{ ideaId: string }>();
  const ideaId = params.ideaId;

  const { data: ideasData } = useIdeas();
  const ideas = unwrapList(ideasData);

  const journey = useJourneyStore((s) =>
    ideaId ? s.journeys[ideaId] : undefined
  );

  const [exitOpen, setExitOpen] = useState(false);

  /**
   * Guard fires when the founder is on a LOCAL idea that hasn't
   * graduated from Synthesize. Server-backed ideas never trigger
   * the guard — they're already persisted.
   */
  const shouldGuard =
    Boolean(ideaId) &&
    isLocalIdeaId(ideaId) &&
    journey != null &&
    journey.stageStates.synthesize !== 'complete';

  /* Returning founder (≥1 graduated idea in the DB) gets the topbar. */
  const showTopbar = ideas.length >= 1;

  const attemptExit = () => {
    if (shouldGuard) {
      setExitOpen(true);
    } else {
      navigate('/ideas');
    }
  };

  const handleDiscard = () => {
    if (ideaId) {
      useJourneyStore.setState((s) => ({
        ideas: s.ideas.filter((i) => i.id !== ideaId),
        journeys: Object.fromEntries(
          Object.entries(s.journeys).filter(([k]) => k !== ideaId)
        ),
      }));
    }
    setExitOpen(false);
    navigate('/ideas');
  };

  const handleStay = () => setExitOpen(false);

  return (
    <div className="journey-shell">
      {showTopbar && (
        <header className="journey-shell__topbar">
          <div className="journey-shell__topbar-left">
            <Link
              to="/ideas"
              className="journey-shell__brand"
              onClick={(e) => {
                e.preventDefault();
                attemptExit();
              }}
            >
              <img
                src={cldTransform(BRAND_ASSETS.wordmark, {
                  width: 400,
                  trim: true,
                  crop: 'fit',
                })}
                alt="IV by InthraOS"
                className="journey-shell__wordmark"
              />
            </Link>
          </div>
          <div className="journey-shell__topbar-center" />
          <div className="journey-shell__topbar-right">
            <button
              type="button"
              onClick={attemptExit}
              className="journey-shell__exit"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              All ideas
            </button>
          </div>
        </header>
      )}

      <main className="journey-shell__main">
        <Outlet />
      </main>

      {exitOpen && (
        <ExitRailModal onStay={handleStay} onDiscard={handleDiscard} />
      )}
    </div>
  );
}
