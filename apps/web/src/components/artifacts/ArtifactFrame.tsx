import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { StatusBadge, type StatusTone } from '../objects';
import { PreviewView } from './views/PreviewView';
import { CodeView } from './views/CodeView';
import { FileView } from './views/FileView';
import type { ArtifactView, ArtifactFile } from './types';

interface ArtifactFrameProps {
  title: string;
  eyebrow?: string;
  status?: string;
  statusTone?: StatusTone;
  /** Tabs to expose. First is selected by default. */
  views?: ArtifactView[];
  /** Content per view. */
  preview?: ReactNode;
  code?: string;
  codeLanguage?: string;
  files?: ArtifactFile[];
  /** Right-side header actions. */
  actions?: ReactNode;
  className?: string;
}

const VIEW_LABELS: Record<ArtifactView, string> = {
  preview: 'Preview',
  code: 'Code',
  files: 'Files',
};

/**
 * ArtifactFrame — one frame, multiple views.
 * Documents, prototypes, code, and files all share this.
 * Configs speak intent (`view="code"`), not component names.
 */
export function ArtifactFrame({
  title,
  eyebrow,
  status,
  statusTone = 'neutral',
  views = ['preview'],
  preview,
  code,
  codeLanguage,
  files,
  actions,
  className,
}: ArtifactFrameProps) {
  const [active, setActive] = useState<ArtifactView>(views[0]);

  return (
    <div className={cn('artifact-frame', className)}>
      <header className="artifact-frame__header">
        <div className="artifact-frame__identity">
          {eyebrow && (
            <span className="artifact-frame__eyebrow">{eyebrow}</span>
          )}
          <span className="artifact-frame__title">{title}</span>
          {status && <StatusBadge tone={statusTone}>{status}</StatusBadge>}
        </div>
        {views.length > 1 && (
          <div className="artifact-frame__tabs" role="tablist">
            {views.map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={active === v}
                className={cn(
                  'artifact-frame__tab',
                  active === v && 'is-active'
                )}
                onClick={() => setActive(v)}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>
        )}
        {actions && (
          <div className="artifact-frame__actions">{actions}</div>
        )}
      </header>

      <div className="artifact-frame__body">
        {active === 'preview' && preview && (
          <PreviewView>{preview}</PreviewView>
        )}
        {active === 'code' && code !== undefined && (
          <CodeView code={code} language={codeLanguage} />
        )}
        {active === 'files' && files && <FileView files={files} />}
      </div>
    </div>
  );
}
