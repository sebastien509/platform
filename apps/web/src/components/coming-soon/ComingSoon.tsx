import { Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ComingSoonProps {
  title: string;
  description: string;
  /** Optional ETA — "Q1 2027" etc. */
  eta?: string;
}

/**
 * ComingSoon — the golden treatment for pages not ready for MVP.
 * Replaces the page body with a roadmap preview.
 */
export function ComingSoon({ title, description, eta }: ComingSoonProps) {
  const navigate = useNavigate();

  return (
    <div className="coming-soon">
      <div className="coming-soon__glow" aria-hidden="true" />

      <span className="coming-soon__badge">
        <Sparkles className="h-3.5 w-3.5" />
        Coming soon
      </span>

      <h1 className="coming-soon__title">{title}</h1>
      <p className="coming-soon__copy">{description}</p>

      {eta && <p className="coming-soon__eta">Shipping {eta}</p>}

      <button
        type="button"
        className="coming-soon__back"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
    </div>
  );
}
