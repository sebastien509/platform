import { create } from 'zustand';

/* ============================================================
   TRACE ITEM — one node in the lineage
   ============================================================ */
export type TraceKind =
  | 'idea'
  | 'knowledge'
  | 'requirement'
  | 'task'
  | 'campaign'
  | 'outcome'
  | 'decision'
  | 'agent_finding';

export interface TraceItem {
  id: string;
  kind: TraceKind;
  title: string;
  summary?: string;
  agent?: import('@/components/agents/identity').AgentKey;
  createdAt?: string;
  confidence?: number;
  /** When set, clicking navigates here (and can close the drawer). */
  href?: string;
}

export interface TraceLineage {
  origin: TraceItem[];
  current: TraceItem;
  evidence: TraceItem[];
  downstream: TraceItem[];
  related: TraceItem[];
}

/* ============================================================
   STORE — one active trace at a time
   ============================================================ */
interface TraceState {
  open: boolean;
  currentId: string | null;
  currentKind: TraceKind | null;

  openTrace: (id: string, kind: TraceKind) => void;
  closeTrace: () => void;
  /** Re-root the drawer on a different item — walk the lineage. */
  walkTo: (id: string, kind: TraceKind) => void;
}

export const useTraceStore = create<TraceState>((set) => ({
  open: false,
  currentId: null,
  currentKind: null,

  openTrace: (id, kind) => set({ open: true, currentId: id, currentKind: kind }),
  closeTrace: () => set({ open: false }),
  walkTo: (id, kind) => set({ open: true, currentId: id, currentKind: kind }),
}));
