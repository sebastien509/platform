import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface VenturePageHeroProps {
  /** Small label at top-left of the hero. */
  stageLabel: string;
  /**
   * Grid span override. Defaults to span-8 via the base class.
   * Set to 12 for a full-width hero (Overview, reading pages),
   * 6 for a two-up column, etc.
   */
  span?: 6 | 8 | 12;
  /** Right-aligned meta (e.g. confidence %, artifact status). */
  meta?: ReactNode;
  /** Headline content — proposal text or final artifact summary. */
  children: ReactNode;
  /** Footer slot — action buttons, approval gate, etc. */
  footer?: ReactNode;
  className?: string;
}

export function VenturePageHero({
  stageLabel,
  span,
  meta,
  children,
  footer,
  className,
}: VenturePageHeroProps) {
  return (
    <motion.div
      layoutId="venture-page-hero"
      className={cn(
        'venture-bento__card',
        'venture-bento__hero',
        span && `venture-bento__hero--span-${span}`,
        className
      )}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="venture-bento__hero-header">
        <span className="venture-bento__label">{stageLabel}</span>
        {meta}
      </div>
      <div className="venture-bento__hero-body">{children}</div>
      {footer && <div className="venture-bento__hero-footer">{footer}</div>}
    </motion.div>
  );
}
