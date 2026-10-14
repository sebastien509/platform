import type { VenturePageConfig } from '../engine';

export const engineeringConfig: VenturePageConfig = {
  id: 'engineering',
  eyebrow: 'Engineering',
  title: 'Engineering',
  description: 'What we are building, what is blocked, what is deployed.',
  hasSources: true,
  sections: [
    {
      type: 'dependencies',
      id: 'engineering-deps',
      label: 'Missing prerequisites',
      hard: [
        {
          opId: 'product.generate-prd',
          label: 'Validated PRD',
          pageId: 'product',
        },
      ],
    },
    {
      type: 'tools',
      id: 'eng-tools',
      label: 'Operations',
      icon: 'sparkles',
      actionIds: [
        'engineering.generate-architecture',
        'engineering.draft-api-spec',
        'engineering.generate-ui-spec',
        'engineering.scaffold-repo',
      ],
    },
  ],
};
