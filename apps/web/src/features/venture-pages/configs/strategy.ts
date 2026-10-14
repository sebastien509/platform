import type { VenturePageConfig } from '../engine';

export const strategyConfig: VenturePageConfig = {
  id: 'strategy',
  eyebrow: 'Strategy',
  title: 'Strategy',
  description: 'Who we are for, why we are different, where we sit.',
  hasSources: true,
  sections: [
    {
      type: 'dependencies',
      id: 'strategy-deps',
      label: 'Missing prerequisites',
    },
    {
      type: 'tools',
      id: 'strategy-tools',
      label: 'Operations',
      icon: 'sparkles',
      actionIds: [
        'strategy.define-icp',
        'strategy.define-positioning',
        'strategy.define-wedge',
        'strategy.generate-brand-brief',
        'strategy.draft-pricing-model',
      ],
    },
  ],
};
