import { type ReactNode } from 'react';

export type ArtifactView = 'preview' | 'code' | 'files';

export interface ArtifactFile {
  name: string;
  size?: string;
  kind?: string;
  icon?: ReactNode;
}
