import type { VenturePageConfig } from '../engine';

export const productConfig: VenturePageConfig = {
  id: 'product',
  eyebrow: 'Product',
  title: 'Product',
  description: 'What we are building, in what order, and why.',
  hasSources: true,
  sections: [
    {
      type: 'dependencies',
      id: 'product-deps',
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
      id: 'product-tools',
      label: 'Operations',
      icon: 'sparkles',
      actionIds: [
        'product.generate-prd',
        'product.generate-prototype',
        'product.publish-prototype',
      ],
    },
  ],
};
