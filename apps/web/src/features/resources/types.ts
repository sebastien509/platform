export type ResourceCategory =
  | 'playbook'
  | 'template'
  | 'video'
  | 'data'
  | 'link';

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  /** Format label — "PDF", "Notion", "MP4", "XLSX", "Link" */
  format: string;
  /** Optional duration for videos — "12 min" */
  duration?: string;
  /** Author or originating org */
  source: string;
  /** External URL, opens in new tab */
  url?: string;
  featured?: boolean;
}
