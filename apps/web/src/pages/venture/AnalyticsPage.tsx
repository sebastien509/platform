import { PageContainer } from '@/components/primary';
import { BarChart3 } from 'lucide-react';

/**
 * Analytics — locked for MVP.
 *
 * The page will unlock when the venture has enough signal to make
 * the surface meaningful — inbound traffic, reply rates, outcome
 * deltas, conversion data from connected sources. Until then, this
 * is a placeholder so the sidebar entry doesn't lead to a mock.
 */
export default function AnalyticsPage() {
  return (
    <PageContainer>
      <header className="marketplace-hero">
        <h1 className="marketplace-hero__title">Analytics</h1>
        <p className="marketplace-hero__lede">
          Once the venture is generating real signal — traffic, replies,
          conversions, and outcome deltas — this page becomes the read on
          what's working and what isn't.
        </p>
      </header>

      <div className="analytics-locked">
        <span className="analytics-locked__icon">
          <BarChart3 className="h-5 w-5" />
        </span>
        <div className="analytics-locked__body">
          <p className="analytics-locked__label">Locked for MVP</p>
          <p className="analytics-locked__copy">
            Analytics needs data the platform doesn't yet collect. It
            unlocks once connected sources and outcome tracking begin
            producing trends. Nothing to configure — it turns on
            automatically when there's something to measure.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
