import { useMemo } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useDeliverablesStore } from '@/lib/deliverables';
import type { VentureSection } from './engine/types';

/**
 * DependencyBanner — page-level prerequisite gate.
 *
 * Reads the whole deliverables map once, then derives per-dep status
 * outside the hook. Rendering nothing when all hard deps are met.
 */
export function DependencyBanner({
  section,
}: {
  section: Extract<VentureSection, { type: 'dependencies' }>;
}) {
  const { ventureId } = useParams<{ ventureId: string }>();
  const deliverables = useDeliverablesStore((s) => s.deliverables);

  const hard = section.hard ?? [];

  const missing = useMemo(() => {
    return hard.filter((dep) => {
      const latest = Object.values(deliverables)
        .filter((d) => d.pageId === dep.pageId && d.opId === dep.opId)
        .sort((a, b) => b.version - a.version)[0];
      return !latest || latest.status !== 'validated';
    });
  }, [hard, deliverables]);

  if (missing.length === 0) return null;

  return (
    <section className="dependency-banner" role="alert">
      <div className="dependency-banner__icon">
        <AlertCircle className="h-4 w-4" />
      </div>
      <div className="dependency-banner__content">
        <div className="dependency-banner__title">
          {section.label ?? 'Missing prerequisites'}
        </div>
        <ul className="dependency-banner__list">
          {missing.map((dep) => (
            <li key={dep.opId} className="dependency-banner__item">
              <span className="dependency-banner__dot" />
              <span className="dependency-banner__label">{dep.label}</span>
              <Link
                to={`/ventures/${ventureId}/${dep.pageId}`}
                className="dependency-banner__link"
              >
                Open {dep.pageId}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
