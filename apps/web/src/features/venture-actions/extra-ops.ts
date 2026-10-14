import type { ActionDef } from './page-actions';
import type { VenturePageKey } from '@/lib/types';

/* Every op now lives in page-actions.ts. This file is kept as a
   placeholder in case secondary ops need their own registry later
   (e.g. versioning helpers that don't render as cards). */
export const EXTRA_OPS: Partial<Record<VenturePageKey, ActionDef[]>> = {};
