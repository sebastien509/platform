import type { ProviderConfig } from './types';

/* ============================================================
   PROVIDER REGISTRY — static config per connector.

   Adding a provider = one entry here + one adapter on the
   edge function. Everything else (UI, DB, tokens) is shared.
   ============================================================ */

export const PROVIDERS: Record<string, ProviderConfig> = {
  gmail: {
    id: 'gmail',
    name: 'Gmail',
    category: 'email',
    icon: 'mail',
    permissions: [
      'Send emails on your behalf',
      'Read replies to your sent messages',
    ],
    usedBy: ['Strategy', 'Sales', 'Campaigns', 'Funding'],
    available: true,
  },
  calendar: {
    id: 'calendar',
    name: 'Google Calendar',
    category: 'calendar',
    icon: 'calendar',
    permissions: ['Read your calendar', 'Create events'],
    usedBy: ['Strategy', 'Sales'],
    available: true,
  },
  github: {
    id: 'github',
    name: 'GitHub',
    category: 'code',
    icon: 'github',
    permissions: ['Read repositories', 'Create repos + branches', 'Open issues'],
    usedBy: ['Engineering'],
    available: true,
  },
  vercel: {
    id: 'vercel',
    name: 'Vercel',
    category: 'deploy',
    icon: 'rocket',
    permissions: ['Create deployments', 'Manage env vars', 'Register domains'],
    usedBy: ['Engineering'],
    available: true,
  },
  supabase: {
    id: 'supabase',
    name: 'Supabase',
    category: 'storage',
    icon: 'database',
    permissions: ['Provision databases', 'Run migrations'],
    usedBy: ['Engineering'],
    available: false,
  },
  linear: {
    id: 'linear',
    name: 'Linear',
    category: 'code',
    icon: 'layers',
    permissions: ['Create issues', 'Update boards', 'Read projects'],
    usedBy: ['Product'],
    available: false,
  },
  hubspot: {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'crm',
    icon: 'users',
    permissions: ['Read contacts', 'Create deals', 'Update pipeline'],
    usedBy: ['Sales'],
    available: false,
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    category: 'payments',
    icon: 'wallet',
    permissions: ['Read payments', 'Read subscriptions', 'Create invoices'],
    usedBy: ['GTM', 'Sales'],
    available: true,
  },
  slack: {
    id: 'slack',
    name: 'Slack',
    category: 'comms',
    icon: 'message-square',
    permissions: ['Send messages', 'Read channels'],
    usedBy: [],
    available: true,
  },
  notion: {
    id: 'notion',
    name: 'Notion',
    category: 'docs',
    icon: 'file-text',
    permissions: ['Read pages', 'Write pages', 'Read databases'],
    usedBy: ['Knowledge'],
    available: true,
  },
  posthog: {
    id: 'posthog',
    name: 'PostHog',
    category: 'analytics',
    icon: 'bar-chart',
    permissions: ['Read events', 'Read funnels'],
    usedBy: ['Analytics', 'Growth'],
    available: false,
  },
};

export function providerList(): ProviderConfig[] {
  return Object.values(PROVIDERS);
}
