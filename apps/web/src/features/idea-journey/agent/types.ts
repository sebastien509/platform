import type {
  CaptureSignal,
  CaptureExchange,
  CleanFieldKey,
  CleanExchange,
  StructuredIdeaCard,
  ResearchThreadKind,
  ResearchEntry,
} from '@/lib/types';

/* ============================================================
   IdeaAgent — the contract every implementation conforms to.

   Four methods, one per stage of the rail. Each one:
     · takes the accumulated context of its stage
     · returns a single typed output that the stage can apply
     · optionally streams tokens via onToken (chat-style UX)

   Implementations:
     · mockAgent   — wraps the existing question banks + heuristics
     · openaiAgent — GPT-4.1 with structured outputs (6b.10)

   The rail never imports a specific implementation. It calls
   `getIdeaAgent()` and works against this interface.
   ============================================================ */

export interface IdeaAgent {
  captureNext(input: CaptureNextInput): Promise<CaptureNextOutput>;
  cleanNext(input: CleanNextInput): Promise<CleanNextOutput>;
  researchThread(input: ResearchThreadInput): Promise<ResearchThreadOutput>;
  synthesize(input: SynthesizeInput): Promise<SynthesizeOutput>;
  finalize(input: FinalizeInput): Promise<FinalizeOutput>;
}

/* ------------------------------------------------------------
   Common
   ------------------------------------------------------------ */

/** Every call may accept a token callback for streaming UX. */
export interface StreamOpts {
  onToken?: (chunk: string) => void;
  signal?: AbortSignal;
}

/* ------------------------------------------------------------
   Capture
   ------------------------------------------------------------ */

export interface CaptureNextInput extends StreamOpts {
  /** All raw answers so far, concatenated. */
  rawCapture: string;
  /** Structured exchange log — question/answer pairs with targets. */
  exchanges: CaptureExchange[];
  /** Which signals have been covered. */
  covered: CaptureSignal[];
  /** How many follow-ups remain before Capture must complete. */
  followUpsRemaining: number;
  /** Optional seed idea title for context. */
  seedTitle?: string;
}

export interface CaptureNextOutput {
  /** The next question to ask. Omitted when `complete` is true. */
  question?: string;
  /** Which signals this exchange targets. */
  targets: CaptureSignal[];
  /** Short label for the collapsed answer line. */
  confirmedLabel?: string;
  /** True when the agent believes Capture has enough to move on. */
  complete: boolean;
}

/* ------------------------------------------------------------
   Clean
   ------------------------------------------------------------ */

export interface CleanNextInput extends StreamOpts {
  /** Which field is being refined right now. */
  fieldKey: CleanFieldKey;
  /** All prior exchanges for this field. */
  exchanges: CleanExchange[];
  /** Raw capture text — the source material. */
  rawCapture: string;
  /** Value converged on so far, if any. */
  currentValue?: string;
  /** The other three fields, for cross-field consistency. */
  structured: StructuredIdeaCard;
}

export interface CleanNextOutput {
  /** Next move in the reflect → test → sharpen → confirm cycle. */
  move: 'reflect' | 'test' | 'sharpen' | 'confirm';
  /** The question text for this move. */
  question: string;
  /** Set when move === 'confirm' — the locked value. */
  lockedValue?: string;
  /** Optional confidence signal — used for sector override checks. */
  confidence?: number;
}

/* ------------------------------------------------------------
   Research
   ------------------------------------------------------------ */

export interface ResearchThreadInput extends StreamOpts {
  kind: ResearchThreadKind;
  /** Raw capture + structured card — the source material. */
  rawCapture: string;
  structured: StructuredIdeaCard;
  /** Set when the thread is responding to a "research more" gap. */
  targetedGapId?: string;
  targetedGapLabel?: string;
  /** Summaries of entries already produced — so this thread can
   *  build on what came before (sequential threads). */
  priorEntriesSummary?: Array<{ kind: ResearchThreadKind; title: string; summary: string }>;
  /** Free-text interjection from the founder mid-run. Turns the
   *  thread into a targeted follow-up. */
  founderPrompt?: string;
}

export interface ResearchThreadOutput {
  /** The structured research file. 4 sections, exactly. */
  entry: Omit<ResearchEntry, 'id' | 'createdAt'>;
}

/* ------------------------------------------------------------
   Synthesize
   ------------------------------------------------------------ */

export interface SynthesizeInput extends StreamOpts {
  structured: StructuredIdeaCard;
  /** Research knowledge entries produced during Research. */
  research: ResearchEntry[];
  /** Raw capture text for grounding. */
  rawCapture: string;
}

export interface SynthesizeProposal {
  fieldKey: CleanFieldKey;
  fieldLabel: string;
  currentValue: string;
  proposedValue: string;
  rationale: string;
  evidenceKnowledgeIds: string[];
  confidence: number;
}

export interface SynthesizeOutput {
  overview: string;
  proposals: SynthesizeProposal[];
}

/* ── Finalize — the LLM's last pass before DB write ── */

export interface FinalizeInput extends StreamOpts {
  /** The founder's current structured card (post-accept/reject). */
  structured: StructuredIdeaCard;
  /** The synthesis overview drafted during review. */
  synthesisOverview?: string;
  /** All research memos — the grounding. */
  research: ResearchEntry[];
  /** The founder's original capture text. */
  rawCapture: string;
}

export interface FinalizeOutput {
  /** 5-7 words. The idea's durable name. */
  title: string;
  /** 60-120 words. A clean summary of what the idea is. */
  overview: string;
  /** The complete structured card — all 4 fields locked. */
  structured: StructuredIdeaCard;
}

/* ------------------------------------------------------------
   Errors
   ------------------------------------------------------------ */

/** Every implementation must throw this on retryable failure so
 *  the rail can show a "try again" affordance. */
export class IdeaAgentError extends Error {
  readonly retryable: boolean;
  constructor(message: string, retryable = true) {
    super(message);
    this.name = 'IdeaAgentError';
    this.retryable = retryable;
  }
}
