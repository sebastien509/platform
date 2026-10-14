import { ReactNode, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useMotionPreset } from '@/lib/motion';
import { cn } from '@/lib/utils/cn';

interface InlineExpandProps {
  trigger: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  chevronPosition?: 'left' | 'right';
}

export function InlineExpand({
  trigger,
  children,
  defaultOpen = false,
  className,
  chevronPosition = 'left',
}: InlineExpandProps) {
  const [open, setOpen] = useState(defaultOpen);
  const preset = useMotionPreset('fadeIn');

  return (
    <div className={cn('inline-expand', className)}>
      <button
        type="button"
        className="inline-expand__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {chevronPosition === 'left' && (
          <ChevronDown
            className={cn('inline-expand__chevron', open && 'is-open')}
            aria-hidden="true"
          />
        )}
        <span className="inline-expand__trigger-content">{trigger}</span>
        {chevronPosition === 'right' && (
          <ChevronDown
            className={cn('inline-expand__chevron', open && 'is-open')}
            aria-hidden="true"
          />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            variants={preset}
            initial="initial"
            animate="animate"
            exit="exit"
            className="inline-expand__content"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
