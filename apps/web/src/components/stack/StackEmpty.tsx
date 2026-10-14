import { CheckCircle2 } from 'lucide-react';
import { ReactNode } from 'react';

interface StackEmptyProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function StackEmpty({
  title = 'All clear',
  description = 'Nothing needs your attention right now. Agents are working.',
  action,
}: StackEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--success-muted)] text-[var(--success)] mb-4">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <h3 className="text-base font-medium text-[var(--text-primary)]">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-[var(--text-secondary)] leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
