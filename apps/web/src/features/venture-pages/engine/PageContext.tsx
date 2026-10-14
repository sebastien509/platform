import { createContext, useContext, type ReactNode } from 'react';

interface PageContextValue {
  pageId: string;
  ventureId?: string;
}

const PageContext = createContext<PageContextValue | null>(null);

export function PageProvider({
  pageId,
  ventureId,
  children,
}: PageContextValue & { children: ReactNode }) {
  return (
    <PageContext.Provider value={{ pageId, ventureId }}>
      {children}
    </PageContext.Provider>
  );
}

export function useCurrentPage(): PageContextValue {
  const ctx = useContext(PageContext);
  return ctx ?? { pageId: 'unknown', ventureId: undefined };
}
