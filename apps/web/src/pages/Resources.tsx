import { useState } from 'react';
import { PageContainer } from '@/components/primary';
import { ResourcesGrid } from '@/features/resources';
import { RESOURCE_ITEMS } from '@/features/resources';
import { cn } from '@/lib/utils/cn';
import type { ResourceCategory } from '@/features/resources';

const CATEGORY_FILTERS: Array<{ value: ResourceCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'playbook', label: 'Playbooks' },
  { value: 'template', label: 'Templates' },
  { value: 'video', label: 'Videos' },
  { value: 'data', label: 'Market data' },
  { value: 'link', label: 'Links' },
];

export default function ResourcesPage() {
  const [category, setCategory] = useState<ResourceCategory | 'all'>('all');

  const filtered = RESOURCE_ITEMS.filter(
    (r) => category === 'all' || r.category === category
  );

  const featured = filtered.filter((r) => r.featured);
  const rest = filtered.filter((r) => !r.featured);

  return (
    <PageContainer>
      <header className="marketplace-hero">
        <h1 className="marketplace-hero__title">Resources</h1>
        <p className="marketplace-hero__lede">
          Playbooks, templates, videos, and market data — everything a founder
          needs to move faster on the platform.
        </p>
      </header>

      <div className="plugin-tool-strip">
        <div className="plugin-tool-strip__filters">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setCategory(f.value)}
              className={cn(
                'plugin-tool-strip__pill',
                category === f.value && 'is-active'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {featured.length > 0 && (
        <section className="marketplace-section">
          <span className="marketplace-section__label">Featured</span>
          <ResourcesGrid items={featured} />
        </section>
      )}

      <section className="marketplace-section">
        <span className="marketplace-section__label">
          {featured.length > 0 ? 'All resources' : 'Resources'}
          <span className="marketplace-section__count">{rest.length}</span>
        </span>
        {rest.length > 0 ? (
          <ResourcesGrid items={rest} />
        ) : (
          <div className="marketplace-empty">
            No resources match that filter.
          </div>
        )}
      </section>
    </PageContainer>
  );
}
