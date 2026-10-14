import { Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { AppCategory } from './types';

interface PluginToolStripProps {
  query: string;
  onQueryChange: (v: string) => void;
  category: AppCategory | 'all';
  onCategoryChange: (v: AppCategory | 'all') => void;
  filters: Array<{ value: AppCategory | 'all'; label: string }>;
}

export function PluginToolStrip({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  filters,
}: PluginToolStripProps) {
  return (
    <div className="plugin-tool-strip">
      <div className="plugin-tool-strip__search">
        <Search className="h-3.5 w-3.5" />
        <input
          type="text"
          placeholder="Search apps, developers, capabilities\u2026"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="plugin-tool-strip__input"
        />
      </div>

      <div className="plugin-tool-strip__filters">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => onCategoryChange(f.value)}
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
  );
}
