import { useState, useCallback } from 'react';
import { usePulseContext } from '@/components/pulse/PulseProvider';

export type InteractionStep = {
  id: string;
  prompt: string;
  type: 'input' | 'decision' | 'result' | 'next';
  completed: boolean;
  data?: Record<string, unknown>;
};

export type InteractionState = {
  currentStep: number;
  steps: InteractionStep[];
  isProcessing: boolean;
  result?: unknown;
  error?: string;
};

interface UseInteractionOptions {
  initialSteps?: InteractionStep[];
  onComplete?: (data: Record<string, unknown>) => void;
  onError?: (error: string) => void;
}

export function useInteraction(options: UseInteractionOptions = {}) {
  const { addPulse } = usePulseContext();
  const [state, setState] = useState<InteractionState>({
    currentStep: 0,
    steps: options.initialSteps || [],
    isProcessing: false,
  });

  const addStep = useCallback((step: Omit<InteractionStep, 'id'>) => {
    setState(prev => ({
      ...prev,
      steps: [
        ...prev.steps,
        { ...step, id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }
      ]
    }));
  }, []);

  const goToNext = useCallback(() => {
    setState(prev => {
      const newIndex = prev.currentStep + 1;
      return {
        ...prev,
        currentStep: newIndex < prev.steps.length ? newIndex : prev.currentStep,
      };
    });
  }, []);

  const completeStep = useCallback((data?: Record<string, unknown>) => {
    setState(prev => {
      const updatedSteps = [...prev.steps];
      if (updatedSteps[prev.currentStep]) {
        updatedSteps[prev.currentStep] = {
          ...updatedSteps[prev.currentStep],
          completed: true,
          data: data || updatedSteps[prev.currentStep].data,
        };
      }
      return {
        ...prev,
        steps: updatedSteps,
      };
    });
  }, []);

  const setProcessing = useCallback((isProcessing: boolean) => {
    setState(prev => ({ ...prev, isProcessing }));
  }, []);

  const setResult = useCallback((result: unknown) => {
    setState(prev => ({ ...prev, result }));
    // Add to pulse if it's a meaningful milestone
    if (result && typeof result === 'object' && 'title' in result) {
      addPulse({
        type: 'success',
        title: (result as any).title || 'Step completed',
        description: (result as any).description || '',
        source: 'Interaction',
        timestamp: new Date().toLocaleString(),
      });
    }
  }, [addPulse]);

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error }));
    options.onError?.(error);
  }, [options]);

  const reset = useCallback(() => {
    setState({
      currentStep: 0,
      steps: options.initialSteps || [],
      isProcessing: false,
    });
  }, [options.initialSteps]);

  const getCurrentStep = useCallback(() => {
    return state.steps[state.currentStep] || null;
  }, [state.steps, state.currentStep]);

  const getProgress = useCallback(() => {
    const total = state.steps.length;
    const completed = state.steps.filter(s => s.completed).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [state.steps]);

  const isComplete = useCallback(() => {
    return state.steps.every(s => s.completed) && state.steps.length > 0;
  }, [state.steps]);

  return {
    state,
    currentStep: getCurrentStep(),
    progress: getProgress(),
    isComplete: isComplete(),
    isProcessing: state.isProcessing,
    result: state.result,
    error: state.error,
    addStep,
    goToNext,
    completeStep,
    setProcessing,
    setResult,
    setError,
    reset,
  };
}
