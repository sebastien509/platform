import { createContext,useContext,type ReactNode } from 'react';import { ModalShell } from '@/components/containers/ModalShell';import { cn } from '@/lib/utils/cn';
interface DialogContextValue{open:boolean;onOpenChange:(open:boolean)=>void}
const DialogContext=createContext<DialogContextValue|null>(null);
export function Dialog({open,onOpenChange,children}:{open:boolean;onOpenChange:(open:boolean)=>void;children:ReactNode}){return <DialogContext.Provider value={{open,onOpenChange}}>{children}</DialogContext.Provider>}
export function DialogContent({children,className}:{children:ReactNode;className?:string}){const ctx=useContext(DialogContext);if(!ctx)throw new Error('DialogContent must be used inside <Dialog>');return <ModalShell open={ctx.open} onClose={()=>ctx.onOpenChange(false)} className={className}>{children}</ModalShell>}
export function DialogHeader({children,className}:{children:ReactNode;className?:string}){return <div className={cn('flex flex-col gap-1.5 pb-4',className)}>{children}</div>}
export function DialogFooter({children,className}:{children:ReactNode;className?:string}){return <div className={cn('flex justify-end gap-3 pt-4',className)}>{children}</div>}
export function DialogTitle({children,className}:{children:ReactNode;className?:string}){return <h2 className={cn('text-base font-semibold text-[var(--text-primary)]',className)}>{children}</h2>}
export function DialogDescription({children,className}:{children:ReactNode;className?:string}){return <p className={cn('text-sm text-[var(--text-muted)] mt-1',className)}>{children}</p>}
