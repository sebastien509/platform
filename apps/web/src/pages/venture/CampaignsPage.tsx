import { VenturePage } from '@/features/venture-pages/engine';
import { campaignsConfig } from '@/features/venture-pages/configs';

export default function CampaignsPage() {
  return <VenturePage config={campaignsConfig} />;
}
