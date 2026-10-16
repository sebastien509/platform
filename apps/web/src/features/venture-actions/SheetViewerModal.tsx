import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useSheetViewer } from '@/lib/stores/sheetViewerStore';

/**
 * SheetViewerModal — full-screen tabular grid.
 * Tabs across the top, sticky header row, formatted cells.
 */
export function SheetViewerModal() {
  const open = useSheetViewer((s) => s.open);
  const tabs = useSheetViewer((s) => s.tabs);
  const title = useSheetViewer((s) => s.title);
  const activeTab = useSheetViewer((s) => s.activeTab);
  const close = useSheetViewer((s) => s.close);
  const setTab = useSheetViewer((s) => s.setTab);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open || tabs.length === 0) return null;

  const tab = tabs[activeTab];

  return (
    <div className="sheet-viewer" role="dialog" aria-modal="true">
      <div className="sheet-viewer__backdrop" onClick={close} />

      <div className="sheet-viewer__panel">
        <header className="sheet-viewer__toolbar">
          <span className="sheet-viewer__eyebrow">Sheet</span>
          <h2 className="sheet-viewer__title">{title ?? 'Untitled sheet'}</h2>
          <button
            type="button"
            className="sheet-viewer__btn"
            onClick={close}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {tabs.length > 1 && (
          <nav className="sheet-viewer__tabs">
            {tabs.map((t, i) => (
              <button
                key={t.name}
                type="button"
                className={`sheet-viewer__tab${i === activeTab ? ' is-active' : ''}`}
                onClick={() => setTab(i)}
              >
                {t.name}
              </button>
            ))}
          </nav>
        )}

        <div className="sheet-viewer__body">
          <table className="sheet-viewer__table">
            <thead>
              <tr>
                <th className="sheet-viewer__corner" />
                {tab.columns.map((c, i) => (
                  <th key={i}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tab.rows.map((row, ri) => (
                <tr key={ri}>
                  <td className="sheet-viewer__rownum">{ri + 1}</td>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={
                        typeof cell === 'number' ? 'is-numeric' : ''
                      }
                    >
                      {cell ?? ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
