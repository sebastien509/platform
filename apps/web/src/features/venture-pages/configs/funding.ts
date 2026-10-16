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
    },
    {
      type: 'deliverables',
      id: 'funding-deliverables',
      label: 'Validated',
    },
  ],
};
