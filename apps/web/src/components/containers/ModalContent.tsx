import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface ModalContentProps {
  children: ReactNode;
  className?: string;
}

export function ModalContent({ children, className }: ModalContentProps) {
  return <div className={cn('modal-content', className)}>{children}</div>;
}
