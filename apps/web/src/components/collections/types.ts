import { type ReactNode } from 'react';
import { type StatusTone } from '../objects';

export type CollectionMode =
  | 'list'
  | 'table'
  | 'kanban'
  | 'timeline'
  | 'checklist'
  | 'comparison'
  | 'cards';

export interface CollectionItem {
  id: string;
  title: string;
  body?: string;
  status?: string;
  statusTone?: StatusTone;
  meta?: string;
  icon?: ReactNode;
  /** Table-specific: cell content keyed by column id. */
  cells?: Record<string, ReactNode>;
  /** Timeline-specific: when label ("Day 1", "2h ago"). */
  when?: string;
  /** Timeline-specific: visually emphasized. */
  featured?: boolean;
  /** Kanban-specific: which column this item belongs to. */
  columnId?: string;
  /** Checklist-specific: state of the item. */
  checklistStatus?: 'todo' | 'doing' | 'done' | 'blocked';
  /** Checklist-specific: who owns it. */
  owner?: string;
  /** Comparison-specific: winning variant. */
  winning?: boolean;
  /** Comparison-specific: variant metrics. */
  variantMetrics?: Array<{ label: string; value: string }>;
  /** Optional inline action IDs. */
  actions?: string[];
  /** Optional click handler for the whole card/row. When present,
   *  the item becomes interactive (cursor + hover affordance). */
  onClick?: () => void;
}

export interface CollectionColumn {
  id: string;
  title: string;
  meta?: string;
}

export interface CollectionTableColumn {
  key: string;
  label: string;
  width?: string;
}
