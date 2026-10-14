import { useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { StructuredIdeaCard, KnowledgeEntry } from '@/lib/types';

interface TransitionStageProps {
  structured: StructuredIdeaCard;
  researchEntries: KnowledgeEntry[];
  defaultVentureName: string;
  createdVentureId?: string;
  onCreateVenture: (name: string) => Promise<string> | string;
  onCreateError?: (message: string) => void;
  externalError?: string | null;
  onEnterVenture: (ventureId: string) => void;
}

/**
 * The graduation surface.
 *
 * Shares `layoutId="graduation-surface"` with the Validate hero —
 * the morph happens when Validate completes and Transition opens.
 *
 * The write goes to Postgres (ventures + knowledge_entries + ideas
 * patch). The parent owns the mutation; this component owns the
 * form, the loading state, and the error display.
 */
export function TransitionStage({
  structured,
  researchEntries,
  defaultVentureName,
  createdVentureId,
  onCreateVenture,
  onCreateError,
  externalError,
  onEnterVenture,
}: TransitionStageProps) {
  const [name, setName] = useState(defaultVentureName);
  const [creating, setCreating] = useState(false);
  const [localVentureId, setLocalVentureId] = useState<string | undefined>(
    createdVentureId
  );
  const [error, setError] = useState<string | null>(null);

  const displayError = error ?? externalError ?? null;

  async function handleCreate() {
    if (!name.trim() || creating) return;
    setError(null);
    setCreating(true);
    try {
      const id = await Promise.resolve(onCreateVenture(name.trim()));
      setLocalVentureId(id);
    } catch (e: any) {
      const message =
        e?.message ?? 'Something went wrong creating the venture.';
      setError(message);
      onCreateError?.(message);
    } finally {
      setCreating(false);
    }
  }

  /* -------- Confirmed — venture created, waiting for founder -------- */
  if (localVentureId) {
    return (
      <motion.div
        layoutId="graduation-surface"
        className="grad-morph__confirmed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="grad-morph__confirmed-icon">
          <Check className="h-5 w-5" />
        </div>
        <div className="grad-morph__confirmed-body">
          <p className="grad-morph__confirmed-label">Venture created</p>
          <p className="grad-morph__confirmed-name">{name}</p>
          <p className="grad-morph__confirmed-copy">
            Your Idea Card, Research Library, and validation record are all
            saved. The venture is live in your workspace.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => onEnterVenture(localVentureId)}
          className="gap-1.5 shrink-0"
        >
          Enter venture
        </Button>
      </motion.div>
    );
  }

  /* -------- Ready — naming the venture -------- */
  return (
    <motion.div
      layoutId="graduation-surface"
      className="grad-morph__ready"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="grad-morph__ready-header">
        <span className="grad-morph__ready-icon">
          <Rocket className="h-4 w-4" />
        </span>
        <div>
          <p className="grad-morph__ready-label">Ready to graduate</p>
          <p className="grad-morph__ready-copy">
            {researchEntries.length} research{' '}
            {researchEntries.length === 1 ? 'report' : 'reports'} carry forward,
            with {countConfirmedFields(structured)} confirmed Idea Card fields.
          </p>
        </div>
      </div>

      <div className="grad-morph__ready-form">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name your venture"
          disabled={creating}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <Button
          onClick={handleCreate}
          disabled={!name.trim() || creating}
          className="gap-1.5"
        >
          <Rocket className="h-3.5 w-3.5" />
          {creating ? 'Creating…' : 'Create venture'}
        </Button>
      </div>

      {displayError && (
        <div className="grad-morph__error">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{displayError}</span>
        </div>
      )}
    </motion.div>
  );
}

function countConfirmedFields(structured: StructuredIdeaCard): number {
  return [
    structured.problem,
    structured.persona,
    structured.value,
    structured.sector,
  ].filter((f) => f?.status === 'confirmed').length;
}
