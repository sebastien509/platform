import type { CleanFieldKey } from '@/lib/types';

/**
 * Which downstream fields depend on each field.
 *
 *   problem  → persona, value, sector  (all downstream fields reference the problem)
 *   persona  → value, sector
 *   value    → sector
 *   sector   → none (last in the sequence)
 *
 * Used when a founder edits a locked field: we surface the downstream
 * fields that were built on top of the old value, so the founder
 * chooses whether to re-confirm them.
 */
export const FIELD_DEPENDENTS: Record<CleanFieldKey, CleanFieldKey[]> = {
  problem: ['persona', 'value', 'sector'],
  persona: ['value', 'sector'],
  value: ['sector'],
  sector: [],
};

/**
 * Returns the locked downstream fields affected by an edit to `editedKey`.
 */
export function affectedDownstreamFields(
  editedKey: CleanFieldKey,
  fields: Record<CleanFieldKey, { status: string }>,
  order: CleanFieldKey[]
): CleanFieldKey[] {
  const downstream = FIELD_DEPENDENTS[editedKey];
  const editorIndex = order.indexOf(editedKey);
  return downstream.filter((key) => {
    const idx = order.indexOf(key);
    /* Only fields that come after the edited field in the sequence */
    if (idx <= editorIndex) return false;
    /* Only fields that are currently locked — the ones built on top */
    return fields[key]?.status === 'locked';
  });
}
