import type { VenturePageConfig } from '../engine';

export const salesConfig: VenturePageConfig = {
  id: 'sales',
  eyebrow: 'Sales',
  title: 'Sales',
  description: 'Pipeline, outreach, and discovery.',
  hasSources: true,
  sections: [
    {
      type: 'dependencies',
      id: 'sales-deps',
      label: 'Missing prerequisites',
      hard: [
        {
          opId: 'strategy.define-icp',
          label: 'Validated ICP',
          pageId: 'strategy',
        },
        {
          opId: 'strategy.define-positioning',
          label: 'Validated positioning',
          pageId: 'strategy',
        },
      ],
    },
    {
      type: 'tools',
      id: 'sales-tools',
      label: 'Operations',
      icon: 'sparkles',
      actionIds: [
        'sales.generate-discovery-script',
        'sales.draft-outreach-sequence',
        'sales.share-proposal',
        'sales.summarize-call',
        'sales.send-outreach-sequence',
        'sales.book-calls',
      ],
    },
  ],
};
