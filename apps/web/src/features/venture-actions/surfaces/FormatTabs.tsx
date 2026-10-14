import { Code2, FileText, Presentation } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useSurfaceViewer, type SurfaceFormat } from '@/lib/stores/surfaceViewerStore';

const FORMATS: Array<{ id: SurfaceFormat; label: string; icon: typeof Code2 }> = [
  { id: 'html', label: 'HTML', icon: Code2 },
  { id: 'pdf', label: 'PDF', icon: FileText },
  { id: 'deck', label: 'Deck', icon: Presentation },
];

export function FormatTabs() {
  const format = useSurfaceViewer((s) => s.format);
  const setFormat = useSurfaceViewer((s) => s.setFormat);

  return (
    <div className="format-tabs" role="tablist" aria-label="View format">
      {FORMATS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={id === format}
          onClick={() => setFormat(id)}
          className={cn('format-tabs__tab', id === format && 'is-active')}
        >
          <Icon className="h-3 w-3" />
          {label}
        </button>
      ))}
    </div>
  );
}
