import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface ModalHeaderProps {
  children: ReactNode;
  className?: string;
}

export function ModalHeader({ children, className }: ModalHeaderProps) {
  return <div className={cn('modal-header', className)}>{children}</div>;
}
