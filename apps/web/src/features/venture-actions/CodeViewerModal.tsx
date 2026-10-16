import { useEffect, useMemo, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { useCodeViewer } from '@/lib/stores/codeViewerStore';

/**
 * CodeViewerModal — full-screen mono viewer for code payloads.
 * No syntax highlighting library — the code renders in a <pre>
 * with the platform mono font. Copy button copies raw code.
 */
export function CodeViewerModal() {
  const open = useCodeViewer((s) => s.open);
  const code = useCodeViewer((s) => s.code);
  const language = useCodeViewer((s) => s.language);
  const label = useCodeViewer((s) => s.label);
  const close = useCodeViewer((s) => s.close);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const lineCount = useMemo(
    () => (code ? code.split('\n').length : 0),
    [code]
  );

  if (!open || !code) return null;

  const handleCopy = async () => {
    if (typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // best-effort
    }
  };

  return (
    <div className="code-viewer" role="dialog" aria-modal="true">
      <div className="code-viewer__backdrop" onClick={close} />

      <div className="code-viewer__panel">
        <header className="code-viewer__toolbar">
          <span className="code-viewer__eyebrow">Code</span>
          <h2 className="code-viewer__title">{label ?? 'Code file'}</h2>
          {language && (
            <span className="code-viewer__lang">{language}</span>
          )}
          <span className="code-viewer__lines">{lineCount} lines</span>
          <div className="code-viewer__actions">
            <button
              type="button"
              className="code-viewer__btn"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              className="code-viewer__btn code-viewer__btn--close"
              onClick={close}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="code-viewer__body">
          <pre className="code-viewer__pre">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
