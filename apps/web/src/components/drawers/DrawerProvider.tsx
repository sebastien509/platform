/**
 * @deprecated Use ContainerProvider from @/components/containers and
 * useContainer() from @/lib/hooks/useContainer.
 * This wrapper is kept only for backward compatibility with the old
 * useDrawer() API.
 */
import { ReactNode } from 'react';
import {
  ContainerProvider,
  OpenDrawerArgs,
} from '@/components/containers/ContainerProvider';
import { useContainer } from '@/lib/hooks/useContainer';

export function DrawerProvider({ children }: { children: ReactNode }) {
  return <ContainerProvider>{children}</ContainerProvider>;
}

/** @deprecated Use useContainer().openDrawer / closeDrawer */
export function useDrawer() {
  const { openDrawer, closeDrawer } = useContainer();
  return {
    openCustom: (
      content: ReactNode,
      title = 'Details',
      description?: string
    ) => openDrawer({ title, description, content }),
    closeDrawer,
  };
}

export type { OpenDrawerArgs };
