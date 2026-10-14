import { VenturePage } from '@/features/venture-pages/engine';
import { gtmConfig } from '@/features/venture-pages/configs';

export default function GTMPage() {
  return <VenturePage config={gtmConfig} />;
}
