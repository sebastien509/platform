import { VenturePage } from '@/features/venture-pages/engine';
import { connectorsConfig } from '@/features/venture-pages/configs';

export default function ConnectorsPage() {
  return <VenturePage config={connectorsConfig} />;
}
