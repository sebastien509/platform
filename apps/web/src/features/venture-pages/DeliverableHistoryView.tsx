import { useParams } from 'react-router-dom';
import { Section } from '@/components/layout';
import { DeliverableCard } from '@/features/venture-actions';
import { useSupersededDeliverables } from '@/lib/deliverables';
import { getIcon } from './iconMap';
import type { VentureSection } from './engine/types';

/**
 * DeliverableHistoryView — the Knowledge page's window into
 * superseded deliverables. Every re-run that replaced a validated
 * artifact lands here, dated, with a link back to its surface.
 */
export function DeliverableHistoryView({
  section,
}: {
  section: Extract<VentureSection, { type: 'deliverable-history' }>;
}) {
  const { ventureId } = useParams<{ ventureId: string }>();
  const items = useSupersededDeliverables(ventureId);
  const Icon = getIcon(section.icon);

  if (items.length === 0) {
    return (
      <Section id={section.id} title={section.label} icon={Icon ? <Icon /> : undefined}>
        <div className="deliverable-history-empty">
          <p>
            No superseded deliverables yet. When you replace a validated
            artifact with a newer version, the old one is archived here.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section id={section.id} title={section.label} icon={Icon ? <Icon /> : undefined}>
      <div className="deliverable-history-grid">
        {items.map((d) => (
          <DeliverableCard key={d.id} deliverable={d} variant="full" ventureId={ventureId} />
        ))}
      </div>
    </Section>
  );
}
