import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useMotionPreset } from '@/lib/motion';
import { cn } from '@/lib/utils/cn';

interface PrimarySurfaceProps {
  header?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PrimarySurface({
  header,
  children,
  actions,
  className,
}: PrimarySurfaceProps) {
  const preset = useMotionPreset('fadeIn');

  return (
    <motion.section
      variants={preset}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn('primary-surface', className)}
    >
      {header}
      <div className="primary-surface__content">{children}</div>
      {actions && <div className="primary-surface__actions">{actions}</div>}
    </motion.section>
  );
}
