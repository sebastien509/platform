import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface PromptProps {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function Prompt({ children, className, icon }: PromptProps) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      {icon && <div className="mt-0.5 text-primary">{icon}</div>}
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{children}</p>
      </div>
    </div>
  );
}
