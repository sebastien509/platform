/**
 * useItemLocked — for MVP, every item in Library and Apps
 * is locked. This hook exists so the lock logic is centralized
 * and easy to evolve per-item later.
 */
export type PreviewableCatalog = 'library' | 'apps';

export function useItemLocked(
  _catalog: PreviewableCatalog,
  _itemId: string,
): boolean {
  /* Every item is locked for MVP. Preview is still allowed. */
  return true;
}
