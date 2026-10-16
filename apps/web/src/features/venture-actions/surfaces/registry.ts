import type { ComponentType } from 'react';
import type { SurfaceId } from '@/lib/share';
import { BriefSurface } from './BriefSurface';
import { DocsSurface } from './DocsSurface';
import { PlanSurface } from './PlanSurface';
import { LandingSurface } from './LandingSurface';
import { ProposalSurface } from './ProposalSurface';
import { PrototypeSurface } from './PrototypeSurface';

export interface SurfaceProps {
  linkId: string;
}

/**
 * SURFACE_REGISTRY — every surface ID maps to a component.
 *
 * Containers we've built:
 *   BriefSurface   — Strategy docs (editorial brief)
 *   DocsSurface    — Product / Engineering / Funding docs
 *   PlanSurface    — GTM / Growth docs
 *   ProposalSurface — Sales docs + shareable proposals
 *   LandingSurface — HTML artifacts (landing, UI spec, email)
 *
 * Containers we haven't built yet — they fall back to DocsSurface
 * so nothing breaks while the real container ships:
 *   Deck (strategy.deck, funding.deck) → DocsSurface
 *   Code (engineering.code)           → DocsSurface
 *   Sheet (funding.sheet)             → DocsSurface
 */
export const SURFACE_REGISTRY: Partial<Record<SurfaceId, ComponentType<SurfaceProps>>> = {
  /* ── Documents — real renderers ── */
  'strategy.brief':    BriefSurface,
  'product.docs':      DocsSurface,
  'engineering.docs':  DocsSurface,
  'gtm.plan':          PlanSurface,
  'campaigns.docs':    PlanSurface,
  'sales.docs':        ProposalSurface,
  'sales.proposal':    ProposalSurface,
  'growth.plan':       PlanSurface,
  'funding.docs':      DocsSurface,

  /* ── HTML artifacts — real (iframe) renderers ── */
  'product.landing':     LandingSurface,
  'engineering.ui-spec': LandingSurface,
  'campaigns.email':     LandingSurface,

  /* ── Legacy — kept so existing outputs still resolve ── */
  'gtm.landing':         LandingSurface,
  'campaigns.landing':   LandingSurface,
  'product.prototype':   PrototypeSurface,

  /* ── Containers coming soon — fall back to DocsSurface ── */
  'strategy.deck':     DocsSurface,
  'funding.deck':      DocsSurface,
  'engineering.code':  DocsSurface,
  'funding.sheet':     DocsSurface,
  'action.confirm':    DocsSurface,
};

export function getSurfaceRenderer(
  id: SurfaceId
): ComponentType<SurfaceProps> | undefined {
  return SURFACE_REGISTRY[id];
}

export function hasSurface(id: SurfaceId): boolean {
  return Boolean(SURFACE_REGISTRY[id]);
}
