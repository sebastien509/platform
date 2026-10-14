import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Sparkles, Bot, AlertTriangle } from 'lucide-react';
import { useMotionPreset } from '@/lib/motion';
import { cn } from '@/lib/utils/cn';
import type { TodayInProgress, TodayWin, TodayAttention } from '../hooks/useToday';

interface WhatHappenedStripProps { wins: TodayWin[]; inProgress: TodayInProgress[]; attention: TodayAttention[]; className?: string; }
export function WhatHappenedStrip({ wins, inProgress, attention, className }: WhatHappenedStripProps) {
  const [open, setOpen] = useState(false);
  const preset = useMotionPreset('fadeIn');
  const total = wins.length + inProgress.length + attention.length;
  if (total === 0) return null;
  const parts = [wins.length ? `${wins.length} ${wins.length === 1 ? 'win' : 'wins'}` : '', inProgress.length ? `${inProgress.length} running` : '', attention.length ? `${attention.length} need attention` : ''].filter(Boolean);
  return <div className={cn('rounded-xl bg-[var(--surface-1)]', className)}>
    <button type="button" aria-expanded={open} onClick={() => setOpen(v => !v)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--surface-2)] transition-colors rounded-xl">
      <Sparkles className="h-4 w-4 text-[#8B5CF6] shrink-0"/><span className="text-sm text-[var(--text-secondary)] flex-1 min-w-0 truncate">What happened — {parts.join(' · ')}</span><ChevronDown className={cn('h-4 w-4 text-[var(--text-secondary)] transition-transform', open && 'rotate-180')}/>
    </button>
    <AnimatePresence initial={false}>{open && <motion.div variants={preset} initial="initial" animate="animate" exit="exit" className="overflow-hidden">
      <div className="px-4 pb-4 pt-2 space-y-4 border-t border-[#F0F1F4]">
        {inProgress.length > 0 && <div><p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">In progress</p><ul className="space-y-2">{inProgress.slice(0, 4).map(item => <li key={item.id} className="flex gap-2 items-center text-sm text-[var(--text-primary)]"><Bot className="h-4 w-4 text-[#19BCE5]"/><span className="min-w-0 truncate flex-1">{item.title}</span><small className="text-[var(--text-secondary)]">{item.source}</small></li>)}</ul></div>}
        {wins.length > 0 && <div><p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">Wins</p><ul className="space-y-2">{wins.slice(0, 4).map(item => <li key={item.id} className="flex gap-2 items-center text-sm text-[var(--text-primary)]"><Sparkles className="h-4 w-4 text-[#12BFA0]"/><span className="min-w-0 truncate flex-1">{item.title}</span>{item.value && <small className="font-semibold text-[#0A937A]">{item.value}</small>}</li>)}</ul></div>}
        {attention.length > 0 && <div><p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">Needs attention</p><ul className="space-y-2">{attention.slice(0, 4).map(item => <li key={item.id} className="flex gap-2 items-center text-sm text-[var(--text-primary)]"><AlertTriangle className="h-4 w-4 text-[#D99022]"/><span className="min-w-0 truncate flex-1">{item.title}</span></li>)}</ul></div>}
      </div>
    </motion.div>}</AnimatePresence>
  </div>;
}
