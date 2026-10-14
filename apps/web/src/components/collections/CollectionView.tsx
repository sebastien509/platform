import { cn } from '@/lib/utils/cn';
import { ListView } from './views/ListView';
import { TableView } from './views/TableView';
import { KanbanView } from './views/KanbanView';
import { TimelineView } from './views/TimelineView';
import { ChecklistView } from './views/ChecklistView';
import { ComparisonView } from './views/ComparisonView';
import { CardsView } from './views/CardsView';
import type {
  CollectionItem,
  CollectionColumn,
  CollectionTableColumn,
  CollectionMode,
} from './types';

interface CollectionViewProps {
  mode: CollectionMode;
  items: CollectionItem[];
  kanbanColumns?: CollectionColumn[];
  tableColumns?: CollectionTableColumn[];
  className?: string;
}

export function CollectionView({
  mode,
  items,
  kanbanColumns,
  tableColumns,
  className,
}: CollectionViewProps) {
  return (
    <div className={cn('collection-view', `collection-view--${mode}`, className)}>
      {mode === 'list' && <ListView items={items} />}
      {mode === 'table' && (
        <TableView items={items} columns={tableColumns ?? []} />
      )}
      {mode === 'kanban' && (
        <KanbanView items={items} columns={kanbanColumns ?? []} />
      )}
      {mode === 'timeline' && <TimelineView items={items} />}
      {mode === 'checklist' && <ChecklistView items={items} />}
      {mode === 'comparison' && <ComparisonView items={items} />}
      {mode === 'cards' && <CardsView items={items} />}
    </div>
  );
}
