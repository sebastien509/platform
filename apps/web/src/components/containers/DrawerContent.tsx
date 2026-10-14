import type { ReactNode } from 'react';import { cn } from '@/lib/utils/cn';
export function DrawerContent({children,className}:{children:ReactNode;className?:string}){return <div className={cn('drawer-content',className)}>{children}</div>}
