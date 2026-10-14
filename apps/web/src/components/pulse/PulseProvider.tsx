import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { PulseItemData} from './PulseItem';

interface PulseContextType {
  items: PulseItemData[];
  addPulse: (item: Omit<PulseItemData, 'id'>) => void;
  dismissPulse: (id: string) => void;
  clearPulses: () => void;
  hasUnread: boolean;
}

const PulseContext = createContext<PulseContextType | undefined>(undefined);

let idCounter = 0;

export function PulseProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PulseItemData[]>([]);

  const addPulse = useCallback((item: Omit<PulseItemData, 'id'>) => {
    const newItem = {
      ...item,
      id: `pulse_${++idCounter}`,
      dismissible: item.dismissible ?? true,
    };
    setItems(prev => [newItem, ...prev]);
  }, []);

  const dismissPulse = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearPulses = useCallback(() => {
    setItems([]);
  }, []);

  const hasUnread = items.some(item => item.type === 'decision');

  return (
    <PulseContext.Provider
      value={{
        items,
        addPulse,
        dismissPulse,
        clearPulses,
        hasUnread,
      }}
    >
      {children}
    </PulseContext.Provider>
  );
}

export function usePulseContext() {
  const context = useContext(PulseContext);
  if (!context) {
    throw new Error('usePulseContext must be used within a PulseProvider');
  }
  return context;
}
