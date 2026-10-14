/** Shadcn-compatible compound wrapper around DrawerShell; legacy direct SheetContent props supported. */
import { createContext,useContext,type ReactNode } from 'react';import { DrawerShell,type DrawerSize } from '@/components/containers/DrawerShell';
import { DrawerHeader as LegacyDrawerHeader } from '@/components/containers/DrawerHeader';import { DrawerFooter as LegacyDrawerFooter } from '@/components/containers/DrawerFooter';
interface SheetContextValue{open:boolean;onOpenChange:(open:boolean)=>void}const SheetContext=createContext<SheetContextValue|null>(null);
export function Sheet({open,onOpenChange,children}:{open:boolean;onOpenChange:(open:boolean)=>void;children:ReactNode}){return <SheetContext.Provider value={{open,onOpenChange}}>{children}</SheetContext.Provider>}
interface SheetContentProps{children:ReactNode;className?:string;open?:boolean;onClose?:()=>void;onOpenChange?:(open:boolean)=>void;size?:DrawerSize;side?:'right'|'left'|'bottom';width?:number;title?:string;description?:string;header?:ReactNode;footer?:ReactNode}
export function SheetContent({children,className,open,onClose,onOpenChange,...rest}:SheetContentProps){const ctx=useContext(SheetContext);const resolvedOpen=open??ctx?.open??false;const close=onClose??(()=>{onOpenChange?.(false);ctx?.onOpenChange(false)});return <DrawerShell open={resolvedOpen} onClose={close} className={className} {...rest}>{children}</DrawerShell>}
export const SheetHeader=LegacyDrawerHeader;export const SheetFooter=LegacyDrawerFooter;
export function SheetTitle({children}:{children:ReactNode}){return <h2 style={{fontFamily:'var(--font-display)',fontSize:'var(--text-h3)'}}>{children}</h2>}
export function SheetDescription({children}:{children:ReactNode}){return <p className="text-sm" style={{color:'var(--text-muted)'}}>{children}</p>}
