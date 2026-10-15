
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';

import { motion, useReducedMotion } from 'framer-motion';

import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Rocket,
  Sparkles,
  Target,
} from 'lucide-react';

import './transition-stage.css';

interface TransitionStageProps {
  structured?: unknown;
  researchEntries?: readonly unknown[];
  defaultVentureName?: string;
  createdVentureId?: string | null;

  onCreateVenture: (name: string) => Promise<string>;
  onEnterVenture: (ventureId: string) => void;

  onCreateError?: (message: string) => void;
  externalError?: string | null;
}

const MAX_NAME_LENGTH = 80;

function getDefaultName(value?: string): string {
  const name = value?.trim() ?? '';
  return name.length > 0 ? name.slice(0, MAX_NAME_LENGTH) : '';
}

export function TransitionStage({
  structured,
  researchEntries = [],
  defaultVentureName,
  createdVentureId,
  onCreateVenture,
  onEnterVenture,
  onCreateError,
  externalError,
}: TransitionStageProps) {
  const reduceMotion = useReducedMotion();

  const [name, setName] = useState(
    getDefaultName(defaultVentureName)
  );

  const [createdId, setCreatedId] = useState<string | null>(
    createdVentureId ?? null
  );

  const [creating, setCreating] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const submittingRef = useRef(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const isCreated = Boolean(createdId);
  const researchCount = researchEntries.length;
  const hasStructuredIdea = structured != null;

  useEffect(() => {
    if (createdVentureId) {
      setCreatedId(createdVentureId);
    }
  }, [createdVentureId]);

  useEffect(() => {
    if (!createdId && !creating) {
      nameInputRef.current?.focus({
        preventScroll: true,
      });
    }
  }, [createdId]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (
      !trimmedName ||
      isCreated ||
      creating ||
      submittingRef.current
    ) {
      return;
    }

    submittingRef.current = true;
    setCreating(true);
    setLocalError(null);
    onCreateError?.('');

    try {
      /*
       * The parent owns:
       * - Venture-limit check
       * - Backend mutation
       * - Local store update
       * - Journey persistence
       * - Validation/transition completion
       */
      const ventureId = await onCreateVenture(trimmedName);

      if (!ventureId) {
        throw new Error('Venture creation returned no ID.');
      }

      setCreatedId(ventureId);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong while creating your venture.';

      /*
       * The parent uses this sentinel when it has already
       * opened VentureCountGate. No duplicate error banner.
       */
      if (message !== 'venture_gate_open') {
        setLocalError(message);
        onCreateError?.(message);
      }
    } finally {
      submittingRef.current = false;
      setCreating(false);
    }
  }

  function handleEnter() {
    if (!createdId) return;
    onEnterVenture(createdId);
  }

  const errorMessage = localError || externalError;

  return (
    <motion.section
      className="iv-transition"
      aria-labelledby="iv-transition-title"
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 14 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.35,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <div className="iv-transition__shell">
        {/* LEFT — MAIN TRANSITION */}
        <div className="iv-transition__main">
          <div
            className={`iv-transition__symbol ${
              isCreated ? 'is-created' : ''
            }`}
            aria-hidden="true"
          >
            {isCreated ? (
              <Check size={25} strokeWidth={2.2} />
            ) : creating ? (
              <Loader2
                size={25}
                className="iv-transition__spin"
              />
            ) : (
              <Rocket size={25} strokeWidth={1.8} />
            )}
          </div>

          <div className="iv-transition__eyebrow">
            {isCreated ? (
              <>
                <CheckCircle2 size={14} />
                Venture created
              </>
            ) : creating ? (
              <>
                <Loader2
                  size={14}
                  className="iv-transition__spin"
                />
                Setting up workspace
              </>
            ) : (
              <>
                <Sparkles size={14} />
                From idea to venture
              </>
            )}
          </div>

          <h1
            className="iv-transition__title"
            id="iv-transition-title"
          >
            {isCreated
              ? 'Your venture is ready.'
              : creating
                ? 'Building your workspace.'
                : 'Give your venture a name.'}
          </h1>

          <p className="iv-transition__description">
            {isCreated
              ? 'Your idea is now a venture. Your research and decisions are ready to guide the next steps.'
              : creating
                ? 'We’re carrying your existing idea context into your new venture.'
                : 'You have done the thinking. Now give it a home and start turning your research into action.'}
          </p>

          {!isCreated ? (
            <form
              className="iv-transition__form"
              onSubmit={handleCreate}
            >
              <label
                className="iv-transition__label"
                htmlFor="iv-venture-name"
              >
                Venture name
              </label>

              <div className="iv-transition__input-wrap">
                <input
                  ref={nameInputRef}
                  id="iv-venture-name"
                  type="text"
                  autoComplete="off"
                  autoCapitalize="words"
                  maxLength={MAX_NAME_LENGTH}
                  placeholder="Enter your venture name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setLocalError(null);
                  }}
                  disabled={creating}
                  aria-invalid={Boolean(errorMessage)}
                  aria-describedby={
                    errorMessage
                      ? 'iv-transition-error'
                      : 'iv-transition-hint'
                  }
                />

                <span className="iv-transition__count">
                  {name.length}/{MAX_NAME_LENGTH}
                </span>
              </div>

              <p
                className="iv-transition__hint"
                id="iv-transition-hint"
              >
                You can refine the name later.
              </p>

              {errorMessage && !creating && (
                <p
                  id="iv-transition-error"
                  className="iv-transition__error"
                  role="alert"
                >
                  {errorMessage}
                </p>
              )}

              <button
                className="iv-transition__primary"
                type="submit"
                disabled={!name.trim() || creating}
              >
                {creating ? (
                  <>
                    <Loader2
                      size={17}
                      className="iv-transition__spin"
                    />
                    Creating venture…
                  </>
                ) : (
                  <>
                    Create venture
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="iv-transition__success">
              <div className="iv-transition__created-venture">
                <div className="iv-transition__created-icon">
                  <Rocket size={21} />
                </div>

                <div className="iv-transition__created-copy">
                  <span>YOUR NEW VENTURE</span>
                  <strong>
                    {name.trim() ||
                      defaultVentureName ||
                      'New venture'}
                  </strong>
                </div>

                <CheckCircle2
                  size={19}
                  className="iv-transition__created-check"
                  aria-label="Created"
                />
              </div>

              <button
                type="button"
                className="iv-transition__primary"
                onClick={handleEnter}
              >
                Enter your workspace
                <ArrowRight size={17} />
              </button>
            </div>
          )}

          <p
            className="iv-transition__footnote"
            role={creating ? 'status' : undefined}
            aria-live={creating ? 'polite' : undefined}
          >
            {isCreated
              ? 'Your venture is saved. You can continue from here anytime.'
              : creating
                ? 'Please wait while your venture is saved.'
                : 'Your existing idea and research stay connected.'}
          </p>
        </div>

        {/* RIGHT — CONTEXT / CONTINUITY */}
        <aside className="iv-transition__context">
          <div className="iv-transition__context-top">
            <span className="iv-transition__context-kicker">
              YOUR FOUNDATION
            </span>

            <h2>
              Nothing to
              <br />
              start over.
            </h2>

            <p>
              The work you have already completed moves forward
              with your venture.
            </p>
          </div>

          <div className="iv-transition__assets">
            <div className="iv-transition__asset">
              <div className="iv-transition__asset-icon is-blue">
                <FileText size={17} />
              </div>

              <div className="iv-transition__asset-copy">
                <strong>Idea context</strong>
                <span>
                  {hasStructuredIdea
                    ? 'Structured idea carried forward'
                    : 'Your original idea preserved'}
                </span>
              </div>

              <Check size={15} className="iv-transition__asset-check" />
            </div>

            <div className="iv-transition__asset">
              <div className="iv-transition__asset-icon is-purple">
                <BookOpen size={17} />
              </div>

              <div className="iv-transition__asset-copy">
                <strong>Research library</strong>
                <span>
                  {researchCount === 0
                    ? 'Ready for new research'
                    : `${researchCount} ${
                        researchCount === 1
                          ? 'research entry'
                          : 'research entries'
                      } available`}
                </span>
              </div>

              <Check size={15} className="iv-transition__asset-check" />
            </div>

            <div className="iv-transition__asset">
              <div className="iv-transition__asset-icon is-mint">
                <Target size={17} />
              </div>

              <div className="iv-transition__asset-copy">
                <strong>Next strategic move</strong>
                <span>Continue in your venture workspace</span>
              </div>

              <ArrowRight
                size={15}
                className="iv-transition__asset-arrow"
              />
            </div>
          </div>

          <div className="iv-transition__context-footer">
            <Sparkles size={14} />
            Idea → Venture → Outcomes
          </div>
        </aside>
      </div>
    </motion.section>
  );
}

export default TransitionStage;
