/* ============================================================
   IV — Agent Drawer DEV Trigger
   Fixed-position button (bottom-left). Spawns a demo agent run
   so the drawer can be verified end-to-end without real agents.

   Remove before production.
   ============================================================ */

import { Sparkles } from 'lucide-react';
import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';

export function AgentDrawerDevTrigger() {
  const startRun = useAgentDrawerStore((s) => s.startRun);
  const openDrawer = useAgentDrawerStore((s) => s.openDrawer);
  const emitBlock = useAgentDrawerStore((s) => s.emitBlock);

  const spawnDemoRun = () => {
    const runId = startRun({
      agentId: 'research',
      objective: 'Scanning competitor pricing pages — 8 of 12 complete.',
      page: 'strategy',
    });

    const now = new Date().toISOString();

    emitBlock({
      id: `blk_${Date.now()}_1`,
      runId,
      agentId: 'research',
      createdAt: now,
      type: 'step',
      label: 'Fetched pricing pages for Ironclad',
      startedAt: now,
      completedAt: now,
      sources: [
        { label: 'ironcladapp.com', target: { kind: 'external', url: '#' } },
        {
          label: 'Pricing page snapshot',
          target: { kind: 'artifact', artifactId: 'a1' },
        },
      ],
      reasoning:
        'Public pricing page returned three tiers; mid-market tier is $349/mo.',
    });

    setTimeout(() => {
      emitBlock({
        id: `blk_${Date.now()}_2`,
        runId,
        agentId: 'research',
        createdAt: new Date().toISOString(),
        type: 'step',
        label: 'Fetched pricing pages for Luminance',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        sources: [
          { label: 'luminance.com', target: { kind: 'external', url: '#' } },
        ],
      });
    }, 1200);

    setTimeout(() => {
      emitBlock({
        id: `blk_${Date.now()}_3`,
        runId,
        agentId: 'research',
        createdAt: new Date().toISOString(),
        type: 'status',
        state: 'needs_you',
        objective: 'Two pricing pages require a decision before continuing.',
      });

      emitBlock({
        id: `blk_${Date.now()}_4`,
        runId,
        agentId: 'research',
        createdAt: new Date().toISOString(),
        type: 'question',
        prompt:
          'Both incumbents price above $300/mo. Which wedge should I explore?',
        options: [
          {
            label: 'SMB self-serve under $200',
            value: 'smb',
            primary: true,
          },
          { label: 'Mid-market under $500', value: 'mid' },
          { label: 'Skip — enough data', value: 'skip' },
        ],
      });
    }, 2400);

    /* Emit an output block so the Review → DocumentViewerDrawer
     * flow can be verified. k_002 resolves via the Knowledge
     * fallback in DocumentViewerDrawer. */
    setTimeout(() => {
      emitBlock({
        id: `blk_${Date.now()}_5`,
        runId,
        agentId: 'research',
        createdAt: new Date().toISOString(),
        type: 'output',
        kind: 'document',
        title: 'Competitive teardown — Contract AI tools',
        destination: 'Strategy › Market',
        status: 'needs_review',
        previewHref: 'k_002',
      });
    }, 3200);

    openDrawer(runId);
  };

  return (
    <button
      type="button"
      onClick={spawnDemoRun}
      title="Spawn demo agent run"
      style={{
        position: 'fixed',
        left: 16,
        bottom: 16,
        zIndex: 60,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 9px',
        borderRadius: 'var(--radius-pill)',
        border: '1px solid var(--border)',
        background: 'var(--surface-3)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-sans)',
        fontSize: 9,
        fontWeight: 650,
        letterSpacing: '0.02em',
        cursor: 'pointer',
        boxShadow: 'none',
      }}
    >
      <Sparkles className="h-3.5 w-3.5" />
      dev
    </button>
  );
}
