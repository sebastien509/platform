import { VenturePage } from '@/features/venture-pages/engine';
import { productConfig } from '@/features/venture-pages/configs';

export default function ProductPage() {
  return <VenturePage config={productConfig} />;
}
