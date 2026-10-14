import { useState } from 'react';
import { PageContainer } from '@/components/primary';
import { PluginToolStrip } from '@/features/ops-marketplace/PluginToolStrip';
import { OpsGrid as AppGrid } from '@/features/ops-marketplace/OpsGrid';
import { MARKETPLACE_APPS } from '@/features/ops-marketplace/catalog';
import type { AppCategory } from '@/features/ops-marketplace/types';

const CATEGORY_FILTERS: Array<{ value: AppCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'fundraising', label: 'Fundraising' },
  { value: 'finance', label: 'Finance' },
  { value: 'legal', label: 'Legal' },
  { value: 'design', label: 'Design' },
  { value: 'research', label: 'Research' },
  { value: 'content', label: 'Content' },
  { value: 'hiring', label: 'Hiring' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'customer', label: 'Customer' },
];

export default function AppsAgentsPage() {
  const [category, setCategory] = useState<AppCategory | 'all'>('all');
  const [query, setQuery] = useState('');

  const filtered = MARKETPLACE_APPS.filter((app) => {
    if (category !== 'all' && app.category !== category) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        app.name.toLowerCase().includes(q) ||
        app.developer.toLowerCase().includes(q) ||
        app.tagline.toLowerCase().includes(q) ||
        app.capabilities.some((c) => c.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const installed = filtered.filter((a) => a.status === 'installed');
  const available = filtered.filter((a) => a.status !== 'installed');

  return (
    <PageContainer>
      <header className="marketplace-hero">
        <h1 className="marketplace-hero__title">Apps &amp; Agents</h1>
        <p className="marketplace-hero__lede">
          Specialized apps that run on top of IV. Install one and it produces
          real documents, dashboards, and reports on your venture pages —
          the same way a native op does.
        </p>
      </header>

      <PluginToolStrip
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
        filters={CATEGORY_FILTERS}
      />

      {installed.length > 0 && (
        <section className="marketplace-section">
          <span className="marketplace-section__label">
            Installed
            <span className="marketplace-section__count">{installed.length}</span>
          </span>
          <AppGrid apps={installed} />
        </section>
      )}

      <section className="marketplace-section">
        <span className="marketplace-section__label">
          {installed.length > 0 ? 'Available' : 'All apps'}
          <span className="marketplace-section__count">{available.length}</span>
        </span>
        {available.length > 0 ? (
          <AppGrid apps={available} />
        ) : (
          <div className="marketplace-empty">
            No apps match that filter.
          </div>
        )}
      </section>
    </PageContainer>
  );
}
