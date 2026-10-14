import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Download } from 'lucide-react';
import { useDeliverablesStore } from '@/lib/deliverables';
import type { Deliverable } from '@/lib/deliverables';

interface CodeViewProps {
  deliverableId: string | null;
  onClose: () => void;
}

/**
 * CodeView — reads a code deliverable and renders it in a full-screen
 * modal with a monospace panel and copy/download actions.
 */
export function CodeView({ deliverableId, onClose }: CodeViewProps) {
  const deliverable = useDeliverablesStore((s) =>
    deliverableId ? s.deliverables[deliverableId] : undefined
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!deliverableId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [deliverableId, onClose]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  if (!deliverable) return null;

  const code = extractCode(deliverable);
  const language = extractLanguage(deliverable);

  const handleCopy = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
      } catch {
        /* noop */
      }
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deliverable.title}.${language === 'json' ? 'json' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <div className="code-view-modal" role="dialog" aria-modal="true">
        <motion.div
          className="code-view-modal__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        />
        <motion.div
          className="code-view-modal__panel"
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <header className="code-view-modal__header">
            <div className="code-view-modal__heading">
              <span className="code-view-modal__eyebrow">Code</span>
              <h2 className="code-view-modal__title">{deliverable.title}</h2>
              {language && (
                <span className="code-view-modal__lang">{language}</span>
              )}
            </div>
            <div className="code-view-modal__actions">
              <button
                type="button"
                className="code-view-modal__btn"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                className="code-view-modal__btn"
                onClick={handleDownload}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
              <button
                type="button"
                className="code-view-modal__close"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>
          <div className="code-view-modal__body">
            <pre className="code-view-modal__code">{code}</pre>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function extractCode(d: Deliverable): string {
  const codeSections = d.snapshot.sections.filter((s) => s.type === 'code');
  if (codeSections.length > 0) {
    return codeSections
      .map((s: any) => s.code)
      .join('\n\n');
  }
  // Fallback — render snapshot sections as text
  return d.snapshot.sections
    .map((s: any) => {
      if (s.type === 'paragraph') return s.body;
      if (s.type === 'callout') return s.body;
      if (s.type === 'list') return s.items.map((i: any) => `- ${i.title}`).join('\n');
      return '';
    })
    .join('\n\n');
}

function extractLanguage(d: Deliverable): string | undefined {
  for (const s of d.snapshot.sections as any[]) {
    if (s.type === 'code' && s.language) return s.language;
  }
  return undefined;
}
