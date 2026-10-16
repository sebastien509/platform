import type { VenturePageConfig } from '../engine';

export const gtmConfig: VenturePageConfig = {
  id: 'gtm',
  eyebrow: 'GTM',
  title: 'Go-to-market',
  description: 'How we reach the first 100 customers.',
  hasSources: true,
  sections: [
    {
      type: 'dependencies',
      id: 'gtm-deps',
      label: 'Missing prerequisites',
      hard: [
        {
          opId: 'strategy.define-icp',
          label: 'Validated ICP',
          pageId: 'strategy',
        },
      ],
    },
    {
      type: 'tools',
      id: 'gtm-tools',
      label: 'Operations',
      icon: 'sparkles',
    },
  ],
};
