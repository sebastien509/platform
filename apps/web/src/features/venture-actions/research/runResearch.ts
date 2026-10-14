import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import { useShareStore } from '@/lib/share';

type ResearchMode = 'venture' | 'external' | 'compare' | 'files';

const MODE_LABELS: Record<ResearchMode, string> = {
  venture: 'Search venture files',
  external: 'External market research',
  compare: 'Compare internal vs external',
  files: 'Analyze selected files',
};

function rid(): string {
  return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * runResearch — launches a research op from the Knowledge research bar.
 * Same drawer lifecycle as every other op: questions, output, validate.
 */
export function runResearch(
  query: string,
  mode: ResearchMode,
  options?: { resetRuns?: boolean; ideaId?: string },
): string {
  const store = useAgentDrawerStore.getState();
  /* resetRuns is the Knowledge page default — it clears stale runs
   * so the drawer starts fresh. From the Validate page we do NOT
   * want that: the founder may have other runs in flight. */
  if (options?.resetRuns !== false) {
    store.resetRuns();
  }

  const agentId = 'research';
  const objective = `${MODE_LABELS[mode]} — "${query}"`;

  const runId = store.startRun({
    agentId,
    objective,
    page: 'knowledge' as any,
  });

  /* Attach op metadata so the drawer header shows the right icon + verb */
  store.updateRun(runId, {
    opId: 'knowledge.research',
    opIcon: 'search',
    opVerb: 'Research',
  } as any);

  const nowISO = () => new Date().toISOString();

  const emit = (block: any) => store.emitBlock(block);

  /* Step 1 — acknowledge the query */
  emit({
    id: rid(),
    runId,
    agentId,
    createdAt: nowISO(),
    type: 'step',
    label: `Starting ${MODE_LABELS[mode].toLowerCase()}…`,
    startedAt: nowISO(),
  });

  /* Step 2 — emit a scope question */
  setTimeout(() => {
    emit({
      id: 'req-research-scope',
      runId,
      agentId,
      createdAt: nowISO(),
      type: 'question',
      prompt: 'What depth do you want for this research?',
      options: [
        { label: 'Quick answer', value: 'quick', primary: true },
        { label: 'Deep dive', value: 'deep' },
        { label: 'Structured report', value: 'report' },
      ],
    });
    emit({
      id: rid(),
      runId,
      agentId,
      createdAt: nowISO(),
      type: 'status',
      state: 'needs_you',
      objective: 'Choose the depth of the research',
    });
  }, 900);

  store.setActiveRun(runId);
  store.openDrawer(runId);
  return runId;
}

/**
 * completeResearch — called after the founder answers the scope
 * question. Produces the report output.
 */
export function completeResearch(runId: string, scopeValue: string) {
  const store = useAgentDrawerStore.getState();
  const run = store.runs[runId];
  if (!run) return;

  const agentId = run.agentId;
  const nowISO = () => new Date().toISOString();

  const emit = (block: any) => store.emitBlock(block);

  emit({
    id: rid(),
    runId,
    agentId,
    createdAt: nowISO(),
    type: 'step',
    label: `Running ${scopeValue} research…`,
    startedAt: nowISO(),
  });

  /* Produce the report after a beat */
  setTimeout(() => {
    const linkId = useShareStore.getState().createLink({
      surfaceId: 'strategy.brief' as any,
      ventureId: '',
      snapshot: {
        title: `Research — ${run.objective}`,
        kicker: `Scope: ${scopeValue}`,
        sections: [
          {
            type: 'callout',
            id: 'summary',
            label: 'Summary',
            tone: 'ready',
            body: 'The venture\'s ICP has strong pain signals. Pricing remains the biggest open question. Recommend a willingness-to-pay test next.',
          },
          {
            type: 'list',
            id: 'findings',
            label: 'Findings',
            items: [
              { title: 'Strong ICP pain signal', body: '8 of 10 firms reported high urgency.' },
              { title: 'Positioning holds up', body: 'Wedge clarity rated 91%.' },
              { title: 'Pricing uncertain', body: 'Willingness-to-pay ranges $50-$250. Needs a test.' },
            ],
          },
          {
            type: 'metrics',
            id: 'signals',
            label: 'Signals',
            items: [
              { label: 'Pain confidence', value: '84%' },
              { label: 'Wedge clarity', value: '91%' },
              { label: 'Pricing confidence', value: '52%' },
            ],
          },
        ],
      },
      createdBy: 'Founder',
      commentsEnabled: false,
      expiresAt: null,
    });

    emit({
      id: rid(),
      runId,
      agentId,
      createdAt: nowISO(),
      type: 'step',
      label: 'Research report compiled',
      startedAt: nowISO(),
      completedAt: nowISO(),
    });

    emit({
      id: rid(),
      runId,
      agentId,
      createdAt: nowISO(),
      type: 'output',
      kind: 'document',
      title: 'Research report',
      destination: 'Knowledge › Research',
      status: 'needs_review',
      previewHref: `surface:${linkId}`,
    });

    emit({
      id: rid(),
      runId,
      agentId,
      createdAt: nowISO(),
      type: 'status',
      state: 'review_ready',
      objective: 'Research report ready for review',
    });
  }, 1400);
}
