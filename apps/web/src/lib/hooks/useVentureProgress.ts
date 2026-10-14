import type { FunctionArea } from '@/features/apps-agents';

export type FunctionStatus = 'not_started' | 'in_progress' | 'complete';

export interface FunctionProgress {
  key: FunctionArea;
  label: string;
  status: FunctionStatus;
  path: string;
}

const FUNCTION_LABELS: Record<FunctionArea, string> = {
  research: 'Research',
  strategy: 'Strategy',
  product: 'Product',
  engineering: 'Engineering',
  gtm: 'GTM',
  campaigns: 'Campaigns',
  sales: 'Sales',
  growth: 'Growth',
  analytics: 'Analytics',
  knowledge: 'Knowledge',
  outcomes: 'Outcomes',
  funding: 'Funding',
};

const VENTURE_FUNCTIONS: FunctionArea[] = [
  'strategy',
  'product',
  'engineering',
  'gtm',
  'campaigns',
  'sales',
  'growth',
  'analytics',
  'knowledge',
  'outcomes',
];

/* -----------------------------------------------------------------
   Derive progress from venture.functions.* presence + density.
   Real API will return an explicit status field; this heuristic
   bridges until then.
   ----------------------------------------------------------------- */
function deriveStatus(fnKey: FunctionArea, fnData: any): FunctionStatus {
  if (!fnData) return 'not_started';

  switch (fnKey) {
    case 'strategy': {
      const has = !!fnData.vision && fnData.vision !== 'Not defined';
      const done =
        has &&
        !!fnData.icp &&
        fnData.icp !== 'Not defined' &&
        !!fnData.positioning &&
        fnData.positioning !== 'Not defined';
      return done ? 'complete' : has ? 'in_progress' : 'not_started';
    }
    case 'product': {
      const reqs = fnData.requirements ?? [];
      if (reqs.length === 0) return 'not_started';
      const done = reqs.filter((r: any) => r.status === 'completed').length;
      return done === reqs.length ? 'complete' : 'in_progress';
    }
    case 'engineering': {
      const tasks = fnData.tasks ?? [];
      if (tasks.length === 0) return 'not_started';
      const done = tasks.filter((t: any) => t.status === 'completed').length;
      return done === tasks.length ? 'complete' : 'in_progress';
    }
    case 'gtm': {
      const has = !!fnData.icp && fnData.icp !== 'Not defined';
      return has ? 'in_progress' : 'not_started';
    }
    case 'campaigns': {
      const has = (fnData.campaigns ?? []).length > 0;
      return has ? 'in_progress' : 'not_started';
    }
    case 'sales': {
      const has = (fnData.prospects ?? []).length > 0;
      return has ? 'in_progress' : 'not_started';
    }
    case 'growth': {
      const has = (fnData.experiments ?? []).length > 0;
      return has ? 'in_progress' : 'not_started';
    }
    case 'analytics': {
      const has = !!fnData.acquisition;
      return has ? 'in_progress' : 'not_started';
    }
    case 'knowledge': {
      return 'in_progress';
    }
    case 'outcomes': {
      return 'in_progress';
    }
    default:
      return 'not_started';
  }
}

/* -----------------------------------------------------------------
   The real hook: takes the already-loaded venture object.
   ----------------------------------------------------------------- */
export function deriveVentureProgress(
  ventureId: string,
  venture: any
): {
  functions: FunctionProgress[];
  suggestedNext?: FunctionProgress;
  counts: {
    complete: number;
    inProgress: number;
    notStarted: number;
    total: number;
  };
} {
  const functions: FunctionProgress[] = VENTURE_FUNCTIONS.map((key) => ({
    key,
    label: FUNCTION_LABELS[key],
    status: deriveStatus(key, venture?.functions?.[key]),
    path: `/ventures/${ventureId}/${key}`,
  }));

  const suggestedNext = functions.find(
    (f) => f.status === 'not_started' || f.status === 'in_progress'
  );

  const counts = functions.reduce(
    (acc, f) => {
      if (f.status === 'complete') acc.complete += 1;
      else if (f.status === 'in_progress') acc.inProgress += 1;
      else acc.notStarted += 1;
      acc.total += 1;
      return acc;
    },
    { complete: 0, inProgress: 0, notStarted: 0, total: 0 }
  );

  return { functions, suggestedNext, counts };
}
