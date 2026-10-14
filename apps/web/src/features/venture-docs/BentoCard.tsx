import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export type BentoRole = 'context' | 'hero' | 'artifact' | 'decision';
export type BentoExpression =
  | 'intelligence'
  | 'validated'
  | 'caution'
  | 'exploration'
  | 'research';
export type BentoOperationalState =
  | 'not-started'
  | 'in-progress'
  | 'draft'
  | 'needs-review'
  | 'approved'
  | 'needs-revision'
  | 'blocked'
  | 'completed';

interface BentoCardProps {
  role?: BentoRole;
  expression?: BentoExpression;
  state?: BentoOperationalState;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

export function BentoCard({
  role = 'context',
  expression,
  state,
  className,
  children,
  onClick,
}: BentoCardProps) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'venture-bento-card',
        role !== 'context' && `venture-bento-card--${role}`,
        expression && `venture-bento-card--${expression}`,
        expression && 'venture-bento-card--tinted',
        state && `is-${state}`,
        onClick && 'text-left cursor-pointer',
        className
      )}
    >
      {children}
    </Component>
  );
}

/* Subparts for consistent inner structure */

export function BentoLabel({
  icon,
  children,
}: {
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="venture-bento-card__label">
      {icon && <span className="venture-bento-card__icon">{icon}</span>}
      {children}
    </span>
  );
}

export function BentoValue({ children }: { children: ReactNode }) {
  return <span className="venture-bento-card__value">{children}</span>;
}

export function BentoMeta({ children }: { children: ReactNode }) {
  return <span className="venture-bento-card__meta">{children}</span>;
}

export function BentoStateChip({ children }: { children: ReactNode }) {
  return (
    <span className="venture-bento-card__state-chip">{children}</span>
  );
}
