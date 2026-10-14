import { useLoadingStore } from '@/lib/stores/loadingStore';

/**
 * Trigger a hard-lock loading state from anywhere.
 *
 *   const { withLoading } = useLoading();
 *   await withLoading('Creating your venture', async () => {
 *     await createVenture();
 *   });
 *
 * Or lock/unlock manually:
 *   const { lock } = useLoading();
 *   const unlock = lock('Producing document');
 *   ...
 *   unlock();
 */
export function useLoading() {
  const lock = useLoadingStore((s) => s.lock);

  async function withLoading<T>(
    message: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const unlock = lock(message);
    try {
      return await fn();
    } finally {
      unlock();
    }
  }

  return { lock, withLoading };
}