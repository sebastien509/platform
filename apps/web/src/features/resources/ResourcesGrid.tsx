import {
  BookOpen, FileText, PlayCircle, BarChart3, Link2,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ResourceItem, ResourceCategory } from './types';

const CATEGORY_META: Record<
  ResourceCategory,
  { label: string; icon: typeof BookOpen; tone: string }
> = {
  playbook: { label: 'Playbook', icon: BookOpen, tone: 'playbook' },
  template: { label: 'Template', icon: FileText, tone: 'template' },
  video: { label: 'Video', icon: PlayCircle, tone: 'video' },
  data: { label: 'Data', icon: BarChart3, tone: 'data' },
  link: { label: 'Link', icon: Link2, tone: 'link' },
};

export function ResourcesGrid({ items }: { items: ResourceItem[] }) {
  return (
    <div className="resources-grid">
      {items.map((item) => {
        const meta = CATEGORY_META[item.category];
        const Icon = meta.icon;
        const isExternal = item.category === 'link';
        return (
          <a
            key={item.id}
            href={item.url ?? '#'}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className={cn('resource-card', item.featured && 'is-featured')}
          >
            <header className="resource-card__head">
              <span className={cn('resource-card__type', `is-${meta.tone}`)}>
                <Icon className="h-3 w-3" />
                {meta.label}
              </span>
              {item.featured && (
                <span className="resource-card__featured">Featured</span>
              )}
            </header>

            <h3 className="resource-card__title">{item.title}</h3>
            <p className="resource-card__description">{item.description}</p>

            <footer className="resource-card__footer">
              <div className="resource-card__meta">
                <span className="resource-card__format">{item.format}</span>
                {item.duration && (
                  <>
                    <span className="resource-card__dot">·</span>
                    <span className="resource-card__duration">{item.duration}</span>
                  </>
                )}
                <span className="resource-card__dot">·</span>
                <span className="resource-card__source">{item.source}</span>
              </div>
              <span className="resource-card__open">
                {item.category === 'video' ? 'Watch' : isExternal ? 'Open' : 'Read'}
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </footer>
          </a>
        );
      })}
    </div>
  );
}
