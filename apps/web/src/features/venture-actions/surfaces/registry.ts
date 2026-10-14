import type { ComponentType } from 'react';
import type { SurfaceId } from '@/lib/share';
import { BriefSurface } from './BriefSurface';
import { PrototypeSurface } from './PrototypeSurface';
import { DocsSurface } from './DocsSurface';
import { PlanSurface } from './PlanSurface';
import { LandingSurface } from './LandingSurface';
import { ProposalSurface } from './ProposalSurface';

export interface SurfaceProps {
  linkId: string;
}

export const SURFACE_REGISTRY: Partial<Record<SurfaceId, ComponentType<SurfaceProps>>> = {
  'strategy.brief': BriefSurface,
  'product.prototype': PrototypeSurface,
  'engineering.docs': DocsSurface,
  'gtm.plan': PlanSurface,
  'gtm.landing': LandingSurface,
  'campaigns.landing': LandingSurface,
  'sales.proposal': ProposalSurface,
};

export function getSurfaceRenderer(
  id: SurfaceId
): ComponentType<SurfaceProps> | undefined {
  return SURFACE_REGISTRY[id];
}

export function hasSurface(id: SurfaceId): boolean {
  return Boolean(SURFACE_REGISTRY[id]);
}
