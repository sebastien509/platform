import type { VenturePageConfig } from '../engine';

export const growthConfig: VenturePageConfig = {
  id: 'growth',
  eyebrow: 'Growth',
  title: 'Growth',
  description: 'Experiments and retention.',
  hasSources: true,
  sections: [
    {
      type: 'dependencies',
      id: 'growth-deps',
      label: 'Missing prerequisites',
      hard: [
        {
          opId: 'gtm.define-segments',
          label: 'Validated GTM segments',
          pageId: 'gtm',
        },
      ],
    },
    {
      type: 'tools',
      id: 'growth-tools',
      label: 'Operations',
      icon: 'sparkles',
    },
  ],
};
