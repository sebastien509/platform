import type { VenturePageConfig } from '../engine';

export const fundingConfig: VenturePageConfig = {
  id: 'funding',
  eyebrow: 'Funding',
  title: 'Funding',
  description: 'Pitch, model, and raise from the right investors.',
  hasSources: true,
  sections: [
    {
      type: 'tools',
      id: 'funding-tools',
      actionIds: [
        'funding.build-pitch-deck',
        'funding.draft-one-pager',
        'funding.build-financial-model',
        'funding.prepare-investor-faq',
        'funding.build-target-list',
        'funding.draft-investor-update',
        'funding.outreach-investors',
        'funding.prepare-data-room',
      ],
    },
    {
      type: 'deliverables',
      id: 'funding-deliverables',
      label: 'Validated',
    },
  ],
};
