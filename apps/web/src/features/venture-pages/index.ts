/* ============================================================
   Venture Pages — public barrel
   Only exports the live engine surface. Old SectorWorkspace /
   SectorTabs / specs / EmbeddedAgentCard have been removed.
   ============================================================ */

export { VenturePage } from './engine/VenturePage';
export { SectionRenderer } from './engine/SectionRenderer';
export { ArchetypeRenderer } from './engine/ArchetypeRenderer';
export { ActivityBar } from './engine/ActivityBar';
export { PageProvider, useCurrentPage } from './engine/PageContext';

export { DependencyBanner } from './DependencyBanner';
export { DeliverablesSection } from './DeliverablesSection';
export { DeliverableHistoryView } from './DeliverableHistoryView';
export { ShareFeedbackTab } from './ShareFeedbackTab';

export { getIcon } from './iconMap';
export {
  strategyConfig,
  productConfig,
  engineeringConfig,
  gtmConfig,
  campaignsConfig,
  salesConfig,
  growthConfig,
  analyticsConfig,
  knowledgeConfig,
  outcomesConfig,
  overviewConfig,
} from './configs';

export type {
  VenturePageConfig,
  TabConfig,
  VentureSection,
  CardSpec,
  CardArchetype,
  CardStatus,
  CardMetric,
  AgentSpec,
  PageState,
} from './engine/types';
