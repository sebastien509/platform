import { useMemo } from 'react';
import { Section } from '@/components/layout';
import { DeliverableCard } from '@/features/venture-actions';
import { useDeliverables } from '@/lib/hooks/useDeliverables';
import { useParams } from 'react-router-dom';
import { getIcon } from './iconMap';
import type { VentureSection } from './engine/types';

/**
 * DeliverablesSection — the validated artifacts produced on this page.
 * Only renders when there is at least one validated deliverable.
 * Everything the founder has approved lives here, versioned.
 */
export function DeliverablesSection({
  section,
  pageId,
}: {
  section: Extract<VentureSection, { type: 'deliverables' }>;
  pageId: string;
}) {
  const { ventureId } = useParams<{ ventureId: string }>();

  const { data: allDeliverables } = useDeliverables({ ventureId });

  /* Filter to this page's validated deliverables first, then
     to the section's opIds when scoped. */
  const forPage = useMemo(
    () =>
      allDeliverables.filter(
        (d) => d.pageId === pageId && d.status === 'validated'
      ),
    [allDeliverables, pageId]
  );

  const items =
    section.opIds && section.opIds.length > 0
      ? forPage.filter((d) => section.opIds!.includes(d.opId))
      : forPage;

  if (items.length === 0) return null;

  const Icon = getIcon(section.icon);

  return (
    <Section
      id={section.id}
      title={section.label ?? 'Validated'}
      icon={Icon ? <Icon /> : undefined}
    >
      <div className="deliverables-grid">
        {items.map((d) => (
          <DeliverableCard
            key={d.id}
            deliverable={d}
            variant="full"
            ventureId={ventureId}
          />
        ))}
      </div>
    </Section>
  );
}
