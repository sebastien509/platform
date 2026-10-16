import type { VenturePageConfig } from '../engine';

export const knowledgeConfig: VenturePageConfig = {
  id: 'knowledge',
  eyebrow: 'Knowledge',
  title: 'Knowledge',
  description: 'Everything the venture has learned.',
  hasSources: false,
  sections: [
    {
      type: 'tools',
      id: 'knowledge-tools',
    },
    {
      type: 'research-bar',
      id: 'knowledge-research',
      label: 'Research',
      hint: 'Search the venture library, run external market research, or compare both.',
      placeholder: 'Ask about your venture, uploaded files, or the market…',
      modes: ['venture', 'external', 'compare', 'files'],
    },
    {

      type: 'collection',

      id: 'knowledge-tunnel',

      mode: 'cards',

      label: 'Journey',

      icon: 'route',

      items: [],

    },

    {
      type: 'collection',
      id: 'knowledge-library',
      mode: 'cards',
      label: 'Library',
      icon: 'library',
      items: [
        {
          id: 'l1',
          title: 'Competitive teardown — Contract AI tools',
          body: 'Pricing, positioning, distribution.',
          status: 'Validated',
          statusTone: 'success',
          meta: 'Report',
        },
        {
          id: 'l2',
          title: 'ICP interviews — 8 firms',
          body: 'Hours spent, tools used, decision-makers.',
          status: 'Validated',
          statusTone: 'success',
          meta: 'Evidence',
        },
        {
          id: 'l3',
          title: 'Legal market sizing',
          body: 'US small firm segment.',
          status: 'Draft',
          statusTone: 'neutral',
          meta: 'Report',
        },
        {
          id: 'l4',
          title: 'Pricing sensitivity study',
          body: 'Willingness-to-pay across $50-$300 range.',
          status: 'Draft',
          statusTone: 'neutral',
          meta: 'Research',
        },
        {
          id: 'l5',
          title: 'Clause library — common risks',
          body: 'Top 20 clauses that appear in 80% of contracts.',
          status: 'Validated',
          statusTone: 'success',
          meta: 'Evidence',
        },
        {
          id: 'l6',
          title: 'Onboarding call notes',
          body: 'Early-access firm feedback and friction points.',
          status: 'Draft',
          statusTone: 'neutral',
          meta: 'Note',
        },
      ],
    },
  ],
};
