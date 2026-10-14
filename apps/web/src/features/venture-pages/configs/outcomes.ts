import type { VenturePageConfig } from '../engine';

export const outcomesConfig: VenturePageConfig = {
  id: 'outcomes',
  eyebrow: 'Outcomes',
  title: 'Outcomes',
  description: 'What the venture tried, what happened, and what changed.',
  hasSources: false,
  sections: [
    {
      type: 'signal-hero',
      id: 'outcomes-signal',
      eyebrow: 'Venture signal',
      headline: 'Evidence is converging around small legal teams.',
      body:
        'ICP pain is validated with strong urgency signals. Positioning holds up under testing. Pricing remains the biggest open question — a willingness-to-pay test is the next evidence needed.',
      stats: [
        { label: 'Validated outcomes', value: '3', tone: 'positive' },
        { label: 'Mixed signals', value: '2', tone: 'attention' },
        { label: 'Unresolved assumptions', value: '1' },
      ],
    },
    {
      type: 'outcome-cards',
      id: 'outcomes-recent',
      label: 'Recent outcomes',
      icon: 'check',
      cards: [
        {
          id: 'o1',
          page: 'Strategy',
          state: 'positive',
          title: 'ICP validation',
          hypothesis:
            'Small law firms experience enough pain to urgently seek a faster review workflow.',
          expected: [{ label: 'Strong signals', value: '5' }],
          actual: [{ label: 'Strong signals', value: '8' }],
          confidenceFrom: 62,
          confidenceTo: 84,
          decision: 'Continue focusing on 2-10 lawyer firms.',
          evidence: ['20 interviews', '8 strong signals', '3 demos', '1 trial'],
        },
        {
          id: 'o2',
          page: 'GTM',
          state: 'positive',
          title: 'Founder-led outbound',
          hypothesis:
            'Partners would respond to speed and risk-reduction messaging.',
          expected: [{ label: 'Reply rate', value: '10%' }],
          actual: [{ label: 'Reply rate', value: '18%' }],
          confidenceFrom: 58,
          confidenceTo: 77,
          decision: 'Continue with refined messaging.',
          evidence: ['84 emails sent', '15 replies', '3 demos'],
        },
        {
          id: 'o3',
          page: 'Strategy',
          state: 'negative',
          title: 'Price test at $299',
          hypothesis:
            'Firms would accept a $299 seat price for a senior-associate-level reviewer.',
          expected: [{ label: 'Conversion', value: 'Stable' }],
          actual: [{ label: 'Conversion', value: '-18%' }],
          confidenceFrom: 71,
          confidenceTo: 52,
          decision: 'Revert. Test $199-249 range.',
          evidence: ['22 pricing pages viewed', '6 objections logged'],
        },
        {
          id: 'o4',
          page: 'Product',
          state: 'mixed',
          title: 'Prototype test',
          hypothesis:
            'A clickable prototype would produce the same feedback as a live demo.',
          expected: [{ label: 'Feedback quality', value: 'High' }],
          actual: [{ label: 'Feedback quality', value: 'Moderate' }],
          confidenceFrom: 55,
          confidenceTo: 60,
          decision: 'Continue with prototype; supplement with live demos.',
          evidence: ['12 prototype sessions', '4 demo sessions'],
        },
      ],
    },
    {
      type: 'decision-impact',
      id: 'outcomes-decision-impact',
      label: 'Decision impact',
      icon: 'bar-chart',
      rows: [
        { id: 'd1', decision: 'Target small law firms', expected: '5 demos', actual: '3 demos', impact: 'mixed' },
        { id: 'd2', decision: 'Email variant B', expected: '+15% CTR', actual: '+21% CTR', impact: 'positive' },
        { id: 'd3', decision: '$299 pricing', expected: 'Stable conv.', actual: '-18% conv.', impact: 'negative' },
        { id: 'd4', decision: 'Onboarding checklist', expected: '+10% activation', actual: '+14% activation', impact: 'positive' },
      ],
    },
    {
      type: 'learning-timeline',
      id: 'outcomes-timeline',
      label: 'Learning history',
      icon: 'library',
      events: [
        { id: 'e1', when: 'Oct 02', title: 'Pricing assumption weakened', body: 'The $299 test dropped conversion by 18%.', confidenceFrom: 71, confidenceTo: 52 },
        { id: 'e2', when: 'Sep 28', title: 'ICP validated', body: 'Eight of ten interviews reported strong urgency.', confidenceFrom: 62, confidenceTo: 84 },
        { id: 'e3', when: 'Sep 23', title: 'Positioning test completed', body: '7 of 10 positive responses.' },
        { id: 'e4', when: 'Sep 18', title: 'Wedge framed', body: 'Contract review under 2 minutes chosen as entry.' },
      ],
    },
  ],
};
