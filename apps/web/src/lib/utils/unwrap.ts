/* ============================================================
   Shape-tolerant hook data extractors.

   The hook layer in this codebase has three shapes in circulation:

     raw useQuery:      { data: T }
     wrapped:           { data: { data: T } }
     doubly wrapped:    { data: { data: { data: T } } }

   These helpers safely resolve any of them. Use them any time
   you're about to iterate, spread, or `.find()` on hook data.
   ============================================================ */

/** Extract an array from any hook shape. Returns [] on any miss. */
export function unwrapList<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === 'object' && 'data' in value) {
    const inner = (value as { data: unknown }).data;
    if (Array.isArray(inner)) return inner as T[];

    if (inner && typeof inner === 'object' && 'data' in inner) {
      const innerInner = (inner as { data: unknown }).data;
      if (Array.isArray(innerInner)) return innerInner as T[];
    }
  }

  return [];
}

/** Extract a single object from any hook shape. Returns undefined on miss. */
export function unwrapData<T = unknown>(value: unknown): T | undefined {
  if (value === null || value === undefined) return undefined;

  // If it looks like a plain T (not a wrapper), return as-is.
  if (typeof value !== 'object') return value as T;

  // Try one level of unwrap
  if ('data' in value) {
    const inner = (value as { data: unknown }).data;
    if (inner === null || inner === undefined) return undefined;

    // If inner looks like an object with just { data: T }, unwrap again.
    if (
      typeof inner === 'object' &&
      inner !== null &&
      'data' in inner &&
      Object.keys(inner).length <= 3
    ) {
      const innerInner = (inner as { data: unknown }).data;
      if (innerInner !== null && innerInner !== undefined) {
        return innerInner as T;
      }
    }

    return inner as T;
  }

  return value as T;
}
