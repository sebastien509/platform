import {
  Presentation, TrendingUp, FileText, Palette, Radar,
  PenLine, Users, BarChart3, Shield, Activity,
  Layers, Check, RefreshCw, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { MarketplaceApp } from './types';

const ICONS: Record<string, any> = {
  presentation: Presentation,
  'trending-up': TrendingUp,
  'file-text': FileText,
  palette: Palette,
  radar: Radar,
  'pen-line': PenLine,
  users: Users,
  'bar-chart': BarChart3,
  shield: Shield,
  activity: Activity,
};

export function OpsGrid({ apps }: { apps: MarketplaceApp[] }) {
  return (
    <div className="marketplace-grid">
      {apps.map((app) => {
        const Icon = ICONS[app.icon] ?? Layers;
        return (
          <article
            key={app.id}
            className={cn('marketplace-card', `is-${app.status}`)}
          >
            <header className="marketplace-card__head">
              <span className="marketplace-card__icon">
                <Icon className="h-4 w-4" />
              </span>
              <div className="marketplace-card__identity">
                <span className="marketplace-card__name">{app.name}</span>
                <span className="marketplace-card__vendor">
                  by {app.developer} · v{app.version}
                </span>
              </div>
              <StatusPill status={app.status} />
            </header>

            <p className="marketplace-card__tagline">{app.tagline}</p>

            <ul className="marketplace-card__capabilities">
              {app.capabilities.slice(0, 3).map((c) => (
                <li key={c} className="marketplace-card__capability">
                  {c}
                </li>
              ))}
            </ul>

            <footer className="marketplace-card__footer">
              <div className="marketplace-card__meta">
                <span className="marketplace-card__pricing">
                  {app.pricingLabel ?? (app.pricing === 'free' ? 'Free' : app.pricing)}
                </span>
                <span className="marketplace-card__installs">
                  {app.installs} installs
                </span>
              </div>
              <button
                type="button"
                className={cn(
                  'marketplace-card__action',
                  app.status === 'installed' && 'is-secondary'
                )}
              >
                {app.status === 'installed' ? 'Manage' : 'Install'}
                <ArrowRight className="h-3 w-3" />
              </button>
            </footer>

            <span className="marketplace-card__produces">
              Produces on {app.producesOn.join(' · ')}
            </span>
          </article>
        );
      })}
    </div>
  );
}

function StatusPill({ status }: { status: MarketplaceApp['status'] }) {
  if (status === 'installed') {
    return (
      <span className="marketplace-card__status is-installed">
        <Check className="h-2.5 w-2.5" />
        Installed
      </span>
    );
  }
  if (status === 'update_available') {
    return (
      <span className="marketplace-card__status is-warning">
        <RefreshCw className="h-2.5 w-2.5" />
        Update
      </span>
    );
  }
  return (
    <span className="marketplace-card__status is-available">
      Available
    </span>
  );
}
