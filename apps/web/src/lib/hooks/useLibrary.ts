/**
 * @deprecated Use useKnowledge from './useKnowledge' instead.
 * Library.tsx was renamed to Knowledge.tsx in Step 3. This shim keeps
 * old imports compiling until they're migrated.
 */
import { useKnowledge } from './useKnowledge';

export function useLibrary() {
  return useKnowledge();
}
