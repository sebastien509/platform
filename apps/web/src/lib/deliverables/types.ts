import type { ShareSnapshot, SurfaceId } from '@/lib/share';

export type DeliverableStatus = 'draft' | 'review' | 'validated' | 'superseded';

export interface Deliverable {
  id: string;
  /** Which op produced it. e.g. 'strategy.share-brief'. */
  opId: string;
  /** Which shape the artifact takes. Drives viewer routing. */
  renderType?: import('@/features/venture-actions/page-actions').RenderType;
  /** Primary deliverable vs a revision from a secondary op. */
  tier?: import('@/features/venture-actions/page-actions').OpTier;
  /** Which page owns it. e.g. 'strategy'. */
  pageId: string;
  /** Which venture it belongs to. */
  ventureId: string;
  /** Version number within (pageId, opId). Starts at 1. */
  version: number;
  /** Lifecycle state. */
  status: DeliverableStatus;
  /** Display title. */
  title: string;
  /** What kind of thing it is. */
  kind: 'document' | 'prototype' | 'dataset' | 'record' | 'plan' | 'proposal' | 'landing';
  /** The share surface it renders through. */
  surfaceId: SurfaceId;
  /** Snapshot content — rendered by the surface. */
  snapshot: ShareSnapshot;
  /** Share link id if one was created. */
  shareLinkId?: string;
  /** Which run produced it. */
  runId?: string;
  /** Which agent ran it. */
  agentId?: string;
  createdAt: string;
  validatedAt?: string;
  supersededAt?: string;
  /** Id of the newer deliverable that replaced this one. */
  supersededBy?: string;
}
