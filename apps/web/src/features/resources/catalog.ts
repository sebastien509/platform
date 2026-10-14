import type { ResourceItem } from './types';

/* ============================================================
   RESOURCES — CATALOG
   Playbooks, templates, videos, and market data for founders.
   Placeholder entries. URLs point to real assets in production.
   ============================================================ */

export const RESOURCE_ITEMS: ResourceItem[] = [
  {
    id: 'venture-playbook',
    title: 'From Idea to Series A',
    description:
      'The end-to-end founder playbook — capture, validate, build, launch, and raise.',
    category: 'playbook',
    format: 'Notion',
    source: 'IV Editorial',
    featured: true,
  },
  {
    id: 'pitch-deck-template',
    title: 'Pitch Deck Template',
    description:
      '11-slide structure used by 300+ funded founders. Figma + Keynote versions.',
    category: 'template',
    format: 'Figma',
    source: 'IV Editorial',
  },
  {
    id: 'financial-model',
    title: 'Pre-Seed Financial Model',
    description:
      'Three-scenario burn, runway, and hiring plan in one spreadsheet.',
    category: 'template',
    format: 'XLSX',
    source: 'Linear Finance',
  },
  {
    id: 'icp-interviews',
    title: 'Running ICP Interviews',
    description:
      'How to structure customer conversations that produce real signal, not polite noise.',
    category: 'video',
    format: 'MP4',
    duration: '12 min',
    source: 'Fable Labs',
  },
  {
    id: 'positioning-workshop',
    title: 'Positioning Workshop',
    description:
      'Walkthrough of the framework from Obviously Awesome, applied to SaaS.',
    category: 'video',
    format: 'MP4',
    duration: '18 min',
    source: 'Radar Co',
  },
  {
    id: 'saas-benchmarks',
    title: '2026 B2B SaaS Benchmarks',
    description:
      'Conversion, retention, and pricing benchmarks across stages and segments.',
    category: 'data',
    format: 'Notion',
    source: 'OpenView',
  },
  {
    id: 'founder-led-sales',
    title: 'Founder-Led Sales Playbook',
    description:
      'How to close the first 10 customers without a sales team. Scripts included.',
    category: 'playbook',
    format: 'PDF',
    source: 'IV Editorial',
  },
  {
    id: 'cap-table-template',
    title: 'Cap Table + Vesting Template',
    description:
      'Clean cap table with vesting schedules and a simple dilution calculator.',
    category: 'template',
    format: 'Google Sheets',
    source: 'Assembly Legal',
  },
  {
    id: 'writing-prds',
    title: 'How to Write a PRD',
    description:
      'The 5-section PRD structure that keeps engineering and founders aligned.',
    category: 'video',
    format: 'MP4',
    duration: '15 min',
    source: 'IV Editorial',
  },
  {
    id: 'founder-stories',
    title: 'Founder Stories',
    description:
      'Long-form interviews with founders on what they got right and wrong.',
    category: 'link',
    format: 'Link',
    source: 'First Round Review',
    url: 'https://review.firstround.com/',
  },
  {
    id: 'legal-pack',
    title: 'Legal Templates Library',
    description:
      'Founder agreements, SAFEs, NDAs, and IP assignment — ready to sign.',
    category: 'template',
    format: 'PDF pack',
    source: 'Assembly Legal',
  },
  {
    id: 'market-sizing',
    title: 'Market Sizing Framework',
    description:
      'TAM/SAM/SOM modelled properly — bottom-up, not top-down hand-waving.',
    category: 'playbook',
    format: 'Notion',
    source: 'IV Editorial',
  },
];
