import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return <div className={cn('modal-footer', className)}>{children}</div>;
}
