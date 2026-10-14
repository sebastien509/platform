import { ArrowRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VentureKnowledgeCardProps {
  ventureId: string;
  /** Summary stat shown in the cell — e.g. "12 entries · 4 insights". */
  summary: string;
}

export function VentureKnowledgeCard({
  ventureId,
  summary,
}: VentureKnowledgeCardProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/ventures/${ventureId}/knowledge`)}
      className="venture-bento__card venture-bento__knowledge"
    >
      <span className="venture-bento__label">Knowledge</span>
      <div className="venture-bento__knowledge-body">
        <BookOpen className="h-5 w-5 text-[var(--accent)] shrink-0" />
        <p className="venture-bento__knowledge-summary">{summary}</p>
      </div>
      <span className="venture-bento__knowledge-link">
        Open library <ArrowRight className="h-3 w-3" />
      </span>
    </button>
  );
}
