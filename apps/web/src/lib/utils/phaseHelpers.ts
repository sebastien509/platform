import { Phase } from '@/lib/types';

export const PHASE_ORDER: Phase[] = ['validate', 'build', 'launch', 'measure'];

export const PHASE_LABELS: Record<Phase, string> = {
  validate: 'Validate',
  build: 'Build',
  launch: 'Launch',
  measure: 'Measure'
};

export const PHASE_ICONS: Record<Phase, string> = {
  validate: '🔬',
  build: '🔧',
  launch: '🚀',
  measure: '📊'
};

export const PHASE_COLORS: Record<Phase, string> = {
  validate: 'bg-blue-100 text-blue-700',
  build: 'bg-amber-100 text-amber-700',
  launch: 'bg-green-100 text-green-700',
  measure: 'bg-purple-100 text-purple-700'
};

export const PHASE_PROGRESS: Record<Phase, number> = {
  validate: 25,
  build: 50,
  launch: 75,
  measure: 100
};

export function getPhaseIndex(phase: Phase): number {
  return PHASE_ORDER.indexOf(phase);
}

export function getNextPhase(phase: Phase): Phase | null {
  const index = PHASE_ORDER.indexOf(phase);
  return index < PHASE_ORDER.length - 1 ? PHASE_ORDER[index + 1] : null;
}

export function getProgressForPhase(phase: Phase): number {
  return PHASE_PROGRESS[phase];
}

export function getPhaseFromProgress(progress: number): Phase {
  if (progress < 25) return 'validate';
  if (progress < 50) return 'build';
  if (progress < 75) return 'launch';
  return 'measure';
}
