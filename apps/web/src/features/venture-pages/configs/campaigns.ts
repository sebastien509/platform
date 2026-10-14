import type { VenturePageConfig } from '../engine';

export const campaignsConfig: VenturePageConfig = {
  id: 'campaigns',
  eyebrow: 'Campaigns',
  title: 'Campaigns',
  description: 'Sequences, assets, and live surfaces.',
  hasSources: true,
  sections: [
    {
      type: 'dependencies',
      id: 'campaigns-deps',
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
      id: 'campaigns-tools',
      label: 'Operations',
      icon: 'sparkles',
      actionIds: [
        'campaigns.generate-drip-sequence',
        'campaigns.draft-email',
        'campaigns.launch-drip',
      ],
    },
  ],
};
