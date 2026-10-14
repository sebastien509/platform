import { useState } from 'react';
import {
  MoreHorizontal,
  CheckCircle2,
  PenLine,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { KnowledgeEntryMenu, type MenuTarget } from './KnowledgeEntryMenu';

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  validated: CheckCircle2,
  approved: CheckCircle2,
  draft: PenLine,
  ready: CheckCircle2,
  done: CheckCircle2,
  working: PenLine,
  failed: AlertCircle,
};

export interface KnowledgeCardItem {
  id: string;
  title: string;
  body?: string;
  meta?: string;
  status?: string;
  statusTone?: 'success' | 'neutral' | 'warning' | 'danger';
  menuTarget: MenuTarget;
}

interface Props {
  item: KnowledgeCardItem;
  onOpen: () => void;
}

export function KnowledgeCard({ item, onOpen }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const StatusIcon = item.status
    ? STATUS_ICONS[item.status.toLowerCase()]
    : undefined;

  return (
    <article className="kb-card">
      <header className="kb-card__head">
        {item.meta && <span className="kb-card__kind">{item.meta}</span>}
        <button
          type="button"
          className="kb-card__menu-trigger"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          aria-label="Card menu"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menuOpen && (
          <KnowledgeEntryMenu
            target={item.menuTarget}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </header>

      <h3 className="kb-card__title">{item.title}</h3>

      {item.body && <p className="kb-card__body">{item.body}</p>}

      <footer className="kb-card__footer">
        {item.status ? (
          <span
            className={cn(
              'kb-card__status',
              `is-${item.statusTone ?? 'neutral'}`
            )}
          >
            {StatusIcon && <StatusIcon className="h-3 w-3" />}
            {item.status}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          className="kb-card__view"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          <Eye className="h-3 w-3" />
          View
        </button>
      </footer>
    </article>
  );
}
