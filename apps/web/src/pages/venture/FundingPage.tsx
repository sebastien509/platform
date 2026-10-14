import { VenturePage } from '@/features/venture-pages/engine';
import { fundingConfig } from '@/features/venture-pages/configs';

export default function FundingPage() {
  return <VenturePage config={fundingConfig} />;
}
