import { ReactNode, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMotionPreset } from '@/lib/motion';
import { cn } from '@/lib/utils/cn';

export interface FocusCardRenderContext {
  index: number;          // 0-indexed
  total: number;
  onResolve: (resolution: string) => void;
  onSkip: () => void;
}

interface FocusCardStackProps<T> {
  items: T[];
  renderItem: (item: T, ctx: FocusCardRenderContext) => ReactNode;
  /** Called when the user resolves the current card. */
  onResolve?: (item: T, resolution: string) => void;
  /** Called when the user skips the current card. */
  onSkip?: (item: T) => void;
  /** Shown when all items are resolved. */
  emptyState?: ReactNode;
  /** Optional key extractor. Defaults to item.id. */
  keyExtractor?: (item: T) => string;
  className?: string;
}

export function FocusCardStack<T extends { id?: string }>({
  items,
  renderItem,
  onResolve,
  onSkip,
  emptyState,
  keyExtractor,
  className,
}: FocusCardStackProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const preset = useMotionPreset('fadeIn');

  const total = items.length;
  const current = items[currentIndex];
  const isFinished = currentIndex >= total;

  function advance() {
    setCurrentIndex((i) => i + 1);
  }

  function handleResolve(resolution: string) {
    if (!current) return;
    onResolve?.(current, resolution);
    advance();
  }

  function handleSkip() {
    if (!current) return;
    onSkip?.(current);
    advance();
  }

  if (isFinished || total === 0) {
    return (
      <div className={cn('w-full', className)}>
        {emptyState}
      </div>
    );
  }

  const key = keyExtractor ? keyExtractor(current) : current.id ?? String(currentIndex);

  return (
    <div className={cn('relative w-full', className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={key}
          variants={preset}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {renderItem(current, {
            index: currentIndex,
            total,
            onResolve: handleResolve,
            onSkip: handleSkip,
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
