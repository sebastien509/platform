/**
 * Type-only file. The original `<PulseItem>` render component was removed
 * when the pulse system migrated to the notification store. The
 * `PulseItemData` type is retained because `PulseProvider` still uses it
 * for its internal state shape.
 */

export type PulseItemType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'decision';

export interface PulseItemData {
  id: string;
  type: PulseItemType;
  title: string;
  description?: string;
  timestamp?: string;
  source?: string;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}
