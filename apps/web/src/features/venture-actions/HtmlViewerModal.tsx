import { useEffect, useState } from 'react';
import { X, ExternalLink, Copy, Check, RefreshCw } from 'lucide-react';
import { useHtmlViewer } from '@/lib/stores/htmlViewerStore';

/**
 * HtmlViewerModal — full-screen iframe renderer for HTML payloads.
 *
 * The deliverable IS the HTML document. No editorial chrome.
 * Full viewport. Toolbar with copy + open-in-new-tab + close.
 */
export function HtmlViewerModal() {
  const open = useHtmlViewer((s) => s.open);
  const html = useHtmlViewer((s) => s.html);
  const title = useHtmlViewer((s) => s.title);
  const close = useHtmlViewer((s) => s.close);

  const [copied, setCopied] = useState(false);
  const [nonce, setNonce] = useState(0);

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

  if (!open || !html) return null;

  const handleCopy = async () => {
    if (typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
    } catch {
      // best-effort
    }
  };

  const handleOpenExternal = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    // Revoke after a beat — the tab has already loaded by then
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };

  return (
    <div className="html-viewer" role="dialog" aria-modal="true">
      <div className="html-viewer__backdrop" onClick={close} />

      <div className="html-viewer__panel">
        <header className="html-viewer__toolbar">
          <span className="html-viewer__eyebrow">HTML artifact</span>
          <h2 className="html-viewer__title">{title ?? 'Preview'}</h2>

          <div className="html-viewer__actions">
            <button
              type="button"
              className="html-viewer__btn"
              onClick={() => setNonce((n) => n + 1)}
              aria-label="Reload preview"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="html-viewer__btn"
              onClick={handleCopy}
              aria-label="Copy HTML"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? 'Copied' : 'Copy HTML'}
            </button>
            <button
              type="button"
              className="html-viewer__btn"
              onClick={handleOpenExternal}
              aria-label="Open in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </button>
            <button
              type="button"
              className="html-viewer__btn html-viewer__btn--close"
              onClick={close}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="html-viewer__body">
          <iframe
            key={nonce}
            title={title ?? 'HTML preview'}
            srcDoc={html}
            sandbox="allow-same-origin"
            className="html-viewer__frame"
          />
        </div>
      </div>
    </div>
  );
}
