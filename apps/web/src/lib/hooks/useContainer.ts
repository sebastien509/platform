import { useContext } from 'react';
import { ContainerContext } from '@/components/containers/ContainerProvider';

export function useContainer() {
  const ctx = useContext(ContainerContext);
  if (!ctx) {
    throw new Error('useContainer must be used within a ContainerProvider');
  }
  return ctx;
}
