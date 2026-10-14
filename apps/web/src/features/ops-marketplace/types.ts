/* ============================================================
   APPS & AGENTS — MARKETPLACE TYPES
   Not connectors. These are installable app packages that
   produce real venture documents on install + use.
   ============================================================ */

export type AppCategory =
  | 'fundraising'
  | 'finance'
  | 'legal'
  | 'design'
  | 'research'
  | 'content'
  | 'hiring'
  | 'analytics'
  | 'compliance'
  | 'customer';

export type AppStatus =
  | 'installed'
  | 'available'
  | 'update_available';

export type AppPricing = 'free' | 'paid' | 'usage';

export interface MarketplaceApp {
  id: string;
  name: string;
  developer: string;
  tagline: string;
  category: AppCategory;
  status: AppStatus;
  pricing: AppPricing;
  pricingLabel?: string;
  icon: string;
  capabilities: string[];
  /** Venture pages where this app writes its outputs. */
  producesOn: string[];
  version: string;
  installs: string;
}
