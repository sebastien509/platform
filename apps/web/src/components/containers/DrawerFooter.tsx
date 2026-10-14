import type { ReactNode } from 'react';import { cn } from '@/lib/utils/cn';
export function DrawerFooter({children,className}:{children:ReactNode;className?:string}){return <footer className={cn('drawer-footer',className)}>{children}</footer>}
