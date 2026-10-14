import { type ReactNode } from 'react';

interface PreviewViewProps {
  children: ReactNode;
}

export function PreviewView({ children }: PreviewViewProps) {
  return (
    <div className="artifact-preview">
      <div className="artifact-preview__canvas">{children}</div>
    </div>
  );
}
