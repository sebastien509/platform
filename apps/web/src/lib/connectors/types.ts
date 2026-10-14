/* ============================================================
   Connector types — client-side.

   The DB row (public.connectors) carries the stateful bits:
   status, account_label, connected_at. Everything else is
   static per-provider and lives here.
   ============================================================ */

export type ConnectorProvider =
  | 'gmail'
  | 'calendar'
  | 'github'
  | 'vercel'
  | 'supabase'
  | 'linear'
  | 'hubspot'
  | 'stripe'
  | 'notion'
  | 'slack'
  | 'posthog';

export type ConnectorStatus =
  | 'connected'
  | 'needs_reauth'
  | 'error'
  | 'revoked'
  | 'available';   // not yet connected

export type ConnectorCategory =
  | 'code'
  | 'deploy'
  | 'crm'
  | 'email'
  | 'calendar'
  | 'payments'
  | 'analytics'
  | 'storage'
  | 'comms'
  | 'docs';

export interface ProviderConfig {
  /** Provider slug — matches the DB `provider` column. */
  id: ConnectorProvider;
  /** Display name. */
  name: string;
  category: ConnectorCategory;
  /** Lucide icon key — mapped in ConnectorsList. */
  icon: string;
  /** What the founder grants when they connect. */
  permissions: string[];
  /** Which venture pages consume this connector. */
  usedBy: string[];
  /** True when the provider is 'native' — no OAuth, always on. */
  native?: boolean;
  /** True when Batch 1.x will wire this. Others show "coming soon". */
  available?: boolean;
}

export interface ConnectorState {
  /** Provider slug. */
  provider: ConnectorProvider;
  status: ConnectorStatus;
  accountLabel?: string;
  connectedAt?: string;
  lastUsedAt?: string;
}
