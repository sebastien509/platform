import { FileText } from 'lucide-react';
import type { ArtifactFile } from '../types';

interface FileViewProps {
  files: ArtifactFile[];
}

export function FileView({ files }: FileViewProps) {
  if (files.length === 0) {
    return <div className="collection-empty">No files yet.</div>;
  }

  return (
    <ul className="artifact-files">
      {files.map((f) => (
        <li key={f.name} className="artifact-file">
          <span className="artifact-file__icon">
            {f.icon ?? <FileText className="h-4 w-4" />}
          </span>
          <div className="artifact-file__main">
            <span className="artifact-file__name">{f.name}</span>
            {f.kind && (
              <span className="artifact-file__kind">{f.kind}</span>
            )}
          </div>
          {f.size && <span className="artifact-file__size">{f.size}</span>}
        </li>
      ))}
    </ul>
  );
}
