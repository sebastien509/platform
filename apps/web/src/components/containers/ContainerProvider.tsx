import { createContext, ReactNode, useCallback, useState } from 'react';
import { DrawerShell, DrawerSize } from './DrawerShell';
import { DrawerHeader } from './DrawerHeader';
import { ModalShell, ModalSize } from './ModalShell';

export interface OpenDrawerArgs {
  id?: string;
  title: string;
  description?: string;
  content: ReactNode;
  size?: DrawerSize;
  footer?: ReactNode;
  onClose?: () => void;
}

export interface ModalAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
  destructive?: boolean;
}

export interface OpenModalArgs {
  id?: string;
  title: string;
  content: ReactNode;
  size?: ModalSize;
  destructive?: boolean;
  actions?: ModalAction[];
  onClose?: () => void;
}

interface ContainerContextValue {
  openDrawer: (args: OpenDrawerArgs) => void;
  closeDrawer: () => void;
  openModal: (args: OpenModalArgs) => void;
  closeModal: () => void;
  closeAll: () => void;
  isDrawerOpen: boolean;
  isModalOpen: boolean;
}

export const ContainerContext = createContext<ContainerContextValue | null>(
  null
);

interface DrawerState extends OpenDrawerArgs {
  open: boolean;
}

interface ModalState extends OpenModalArgs {
  open: boolean;
}

export function ContainerProvider({ children }: { children: ReactNode }) {
  const [drawerState, setDrawerState] = useState<DrawerState | null>(null);
  const [modalState, setModalState] = useState<ModalState | null>(null);

  const openDrawer = useCallback((args: OpenDrawerArgs) => {
    setDrawerState({ ...args, open: true });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerState((prev) => {
      if (!prev || !prev.open) return prev;
      prev.onClose?.();
      return { ...prev, open: false };
    });
  }, []);

  const openModal = useCallback((args: OpenModalArgs) => {
    setModalState((prev) => {
      if (prev?.open && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(
          '[IV] openModal called while another modal was open — replacing.'
        );
      }
      return { ...args, open: true };
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState((prev) => {
      if (!prev || !prev.open) return prev;
      prev.onClose?.();
      return { ...prev, open: false };
    });
  }, []);

  const closeAll = useCallback(() => {
    closeDrawer();
    closeModal();
  }, [closeDrawer, closeModal]);

  return (
    <ContainerContext.Provider
      value={{
        openDrawer,
        closeDrawer,
        openModal,
        closeModal,
        closeAll,
        isDrawerOpen: !!drawerState?.open,
        isModalOpen: !!modalState?.open,
      }}
    >
      {children}

      {/* Drawer shell is always mounted — visibility is controlled by `open`.
          AnimatePresence inside the shell handles exit animation. */}
      <DrawerShell
        open={!!drawerState?.open}
        onClose={closeDrawer}
        size={drawerState?.size ?? 'md'}
        header={
          drawerState ? (
            <DrawerHeader
              title={drawerState.title}
              description={drawerState.description}
              onClose={closeDrawer}
            />
          ) : null
        }
        footer={drawerState?.footer}
      >
        {drawerState?.content}
      </DrawerShell>

      {/* Modal shell is always mounted for the same reason. */}
      <ModalShell
        open={!!modalState?.open}
        onClose={closeModal}
        size={modalState?.size ?? 'default'}
        destructive={modalState?.destructive}
        header={modalState?.title ?? ''}
        footer={
          modalState?.actions && modalState.actions.length > 0 ? (
            <>
              {modalState.actions.map((action, i) => (
                <button
                  key={i}
                  type="button"
                  className={[
                    'iv-btn',
                    action.primary ? 'iv-btn--primary' : '',
                    action.destructive ? 'iv-btn--destructive' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={action.onClick}
                >
                  {action.label}
                </button>
              ))}
            </>
          ) : undefined
        }
      >
        {modalState?.content}
      </ModalShell>
    </ContainerContext.Provider>
  );
}
