import { VenturePage } from '@/features/venture-pages/engine';
import { strategyConfig } from '@/features/venture-pages/configs';

export default function StrategyPage() {
  return <VenturePage config={strategyConfig} />;
}
