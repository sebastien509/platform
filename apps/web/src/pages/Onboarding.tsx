import { useState, useEffect, type KeyboardEvent  } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  X,
  Plus,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { useJourneyStore } from '@/lib/stores/journeyStore';
import {
  readHandoffFromUrl,
  savePendingHandoff,
  readPendingHandoff,
  clearPendingHandoff,
} from '@/features/onboarding/handoff';
import { claimHandoff } from '@/features/onboarding/claim';
import { pushIdeaToDb } from '@/lib/hooks/pushIdeaToDb';
import { getIdeaAgent } from '@/features/idea-journey/agent';
import { deriveIdeaTitle } from '@/features/ideas/deriveIdeaTitle';

const STEPS = ['You', 'Role', 'Focus', 'Workspace'] as const;
type StepId = (typeof STEPS)[number];

const ROLES = [
  { value: 'technical', label: 'Technical', hint: 'You build the product' },
  { value: 'business', label: 'Business', hint: 'You own the go-to-market' },
  { value: 'design', label: 'Design', hint: 'You shape the experience' },
  { value: 'other', label: 'Other', hint: 'Something else entirely' },
] as const;

const SUGGESTED_TAGS = [
  'B2B SaaS',
  'Legal Tech',
  'Fintech',
  'Healthcare',
  'Marketplace',
  'Consumer',
  'Infrastructure',
  'AI / ML',
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();

  /* ── Capture handoff from URL on mount ──
   * If the founder arrived from the landing page via
   * /onboarding?handoff=hd_xxx, stash it in sessionStorage so it
   * survives the wizard and login, then gets claimed after the
   * workspace is created. */
  useEffect(() => {
    const urlHandoff = readHandoffFromUrl();
    if (urlHandoff) savePendingHandoff(urlHandoff);
  }, []);

  const [step, setStep] = useState<StepId>('You');
  const [name, setName] = useState(me?.profile?.name ?? '');
  const [phone, setPhone] = useState(me?.profile?.phone ?? '');
  const [role, setRole] = useState(me?.profile?.profile_role ?? '');
  const [tags, setTags] = useState<string[]>(
    me?.profile?.expertise_tags ?? []
  );
  const [tagInput, setTagInput] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const stepIndex = STEPS.indexOf(step);

  function next() {
    setError('');
    setStep(STEPS[Math.min(stepIndex + 1, STEPS.length - 1)]);
  }

  function back() {
    setError('');
    setStep(STEPS[Math.max(stepIndex - 1, 0)]);
  }

  async function saveProfileFields(fields: Record<string, unknown>) {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error('not authenticated');

    const { error } = await supabase
      .from('users')
      .update(fields)
      .eq('id', auth.user.id);

    if (error) throw error;
    qc.invalidateQueries({ queryKey: ['me'] });
  }

  async function handleContinue() {
    setError('');

    try {
      if (step === 'You') {
        if (!name.trim()) {
          setError('Please enter your name');
          return;
        }
        setSaving(true);
        await saveProfileFields({
          name: name.trim(),
          phone: phone.trim() || null,
        });
        setSaving(false);
        next();
        return;
      }

      if (step === 'Role') {
        if (!role) {
          setError('Please choose a role');
          return;
        }
        setSaving(true);
        await saveProfileFields({ profile_role: role });
        setSaving(false);
        next();
        return;
      }

      if (step === 'Focus') {
        setSaving(true);
        await saveProfileFields({ expertise_tags: tags });
        setSaving(false);
        next();
        return;
      }

      if (step === 'Workspace') {
        if (!workspaceName.trim()) {
          setError('Please name your workspace');
          return;
        }
        setSaving(true);
        const { error: rpcError } = await supabase.rpc('complete_onboarding', {
          ws_name: workspaceName.trim(),
        });
        if (rpcError) throw rpcError;
        await qc.invalidateQueries({ queryKey: ['me'] });

        /* First-timer check: no ideas yet → drop them into the
         * idea journey. Anyone with ideas goes to /today. */
        const { data: auth } = await supabase.auth.getUser();
        let hasIdeas = false;
        if (auth.user) {
          const { count } = await supabase
            .from('ideas')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', auth.user.id);
          hasIdeas = (count ?? 0) > 0;
        }

        setSaving(false);

        /* ── Handoff claim ──
         * The founder arrived from the landing page with a handoff.
         * The draft journey is sitting in localStorage under the
         * handoff key. Now that we're authenticated and have a
         * workspace, we:
         *   1. Mark the handoff claimed (server)
         *   2. Read the draft journey from localStorage
         *   3. Run finalize (authenticated) to produce the record
         *   4. Persist the idea via pushIdeaToDb (real schema)
         *   5. Migrate the local journey to the new ideaId
         *   6. Navigate to /ideas/:uuid — validate screen */
        const pendingHandoff = readPendingHandoff();
        if (pendingHandoff) {
          try {
            const claimed = await claimHandoff(pendingHandoff);

            const store = useJourneyStore.getState();
            const draftJourney = store.journeys[pendingHandoff];

            if (draftJourney) {
              /* Run finalize authenticated — produces the record */
              let finalizedData: { title?: string; overview?: string; structured?: any } | null = null;
              try {
                finalizedData = await getIdeaAgent().finalize({
                  structured: draftJourney.structured,
                  synthesisOverview: draftJourney.synthesisOverview,
                  research: draftJourney.researchEntries ?? [],
                  rawCapture: draftJourney.rawCapture,
                });
              } catch (finalizeErr) {
                console.warn('[onboarding] finalize failed, using draft state', finalizeErr);
              }

              const derivedTitle =
                finalizedData?.title ??
                deriveIdeaTitle(draftJourney.structured, draftJourney.rawCapture);
              const finalStructured = finalizedData?.structured ?? draftJourney.structured;
              const finalOverview =
                finalizedData?.overview ?? draftJourney.synthesisOverview ?? null;

              const structuredWithResearch = {
                ...(finalStructured as unknown as Record<string, unknown>),
                researchEntries: draftJourney.researchEntries ?? [],
                researchRun: draftJourney.researchRun ?? null,
                synthesisProposals: draftJourney.synthesisProposals ?? [],
                synthesisOverview: draftJourney.synthesisOverview ?? null,
                reviewNotes: draftJourney.reviewNotes ?? {},
                overview: finalOverview,
              };

              const created = await pushIdeaToDb({
                title: derivedTitle,
                structured: structuredWithResearch,
                capture_payload: {
                  exchanges: draftJourney.capture?.exchanges ?? [],
                  rawCapture: draftJourney.rawCapture ?? claimed.content ?? '',
                },
                clean_payload: {
                  fields: draftJourney.clean?.fields ?? {},
                },
                validation: {
                  decision: null,
                  note: null,
                  decidedAt: null,
                  createdVentureId: null,
                },
              });

              /* Migrate the local journey to the new ideaId key */
              store.setJourney(created.id, {
                ...draftJourney,
                ideaId: created.id,
                serverId: created.id,
              } as any);

              console.log('[onboarding] journey migrated', {
                from: pendingHandoff,
                to: created.id,
              });

              clearPendingHandoff();
              navigate(`/ideas/${created.id}`, { replace: true });
              return;
            }

            /* Handoff claimed but no draft journey found in
             * localStorage. Fall back to a fresh idea seed with the
             * raw content — the founder starts at capture. */
            if (claimed.content) {
              const created = await pushIdeaToDb({
                title: claimed.content.slice(0, 80),
                structured: {},
                capture_payload: { exchanges: [], rawCapture: claimed.content },
                clean_payload: { fields: {} },
                validation: { decision: null, note: null, decidedAt: null, createdVentureId: null },
                stage: 'capture',
              });
              clearPendingHandoff();
              navigate(`/ideas/${created.id}`, { replace: true });
              return;
            }

            clearPendingHandoff();
          } catch (e) {
            console.warn('[onboarding] handoff claim failed:', e);
            setSaving(false);
            setError(
              e instanceof Error
                ? `Could not save your idea — ${e.message}`
                : 'Could not save your idea. Try again.',
            );
            return;
          }
        }

        navigate(hasIdeas ? '/today' : '/ideas', { replace: true });
        return;
      }
    } catch (e) {
      setSaving(false);
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }

  function addTag(value: string) {
    const trimmed = value.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    setTags([...tags, trimmed]);
    setTagInput('');
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  function handleTagKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface-0)',
      padding: 24,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 520,
        padding: 36,
        borderRadius: 20,
        border: '1px solid var(--border-subtle)',
        background: 'var(--surface-1)',
      }}>
        {/* Progress */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 24,
        }}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 999,
                background: i <= stepIndex
                  ? 'var(--accent)'
                  : 'var(--border-subtle)',
                transition: 'background 200ms',
              }}
            />
          ))}
        </div>

        <p style={{
          margin: 0,
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          Step {stepIndex + 1} of {STEPS.length}
        </p>

        {/* Step: You */}
        {step === 'You' && (
          <>
            <h1 style={h1Style}>Let's start with you</h1>
            <p style={subStyle}>
              How should we refer to you across the platform?
            </p>

            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Full name</label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Phone (optional)</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 415 555 0100"
                  style={inputStyle}
                />
              </div>
            </div>
          </>
        )}

        {/* Step: Role */}
        {step === 'Role' && (
          <>
            <h1 style={h1Style}>How do you work?</h1>
            <p style={subStyle}>
              This tailors how agents talk to you. It doesn't lock you in.
            </p>

            <div style={{
              marginTop: 24,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}>
              {ROLES.map((r) => {
                const active = role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    style={{
                      textAlign: 'left',
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: active
                        ? '1px solid var(--accent)'
                        : '1px solid var(--border-subtle)',
                      background: active
                        ? 'var(--accent-muted)'
                        : 'var(--surface-2)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 13.5,
                      fontWeight: 650,
                      color: active ? 'var(--accent)' : 'var(--text-primary)',
                    }}>
                      {r.label}
                    </div>
                    <div style={{
                      marginTop: 3,
                      fontFamily: 'var(--font-sans)',
                      fontSize: 11.5,
                      color: 'var(--text-muted)',
                    }}>
                      {r.hint}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Step: Focus */}
        {step === 'Focus' && (
          <>
            <h1 style={h1Style}>What's your focus?</h1>
            <p style={subStyle}>
              Pick a few tags or write your own. Optional.
            </p>

            <div style={{
              marginTop: 20,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}>
              {tags.map((t) => (
                <span
                  key={t}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 10px 5px 12px',
                    borderRadius: 999,
                    background: 'var(--accent-muted)',
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    style={{
                      display: 'inline-flex',
                      border: 0,
                      background: 'transparent',
                      padding: 0,
                      cursor: 'pointer',
                      color: 'inherit',
                    }}
                  >
                    <X style={{ width: 11, height: 11 }} />
                  </button>
                </span>
              ))}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                borderRadius: 999,
                border: '1px dashed var(--border)',
              }}>
                <Plus style={{ width: 11, height: 11, color: 'var(--text-muted)' }} />
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKey}
                  placeholder="Add a tag"
                  style={{
                    border: 0,
                    outline: 0,
                    background: 'transparent',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12,
                    width: 90,
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            <div style={{
              marginTop: 16,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}>
              {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addTag(t)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-2)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 11.5,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  + {t}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step: Workspace */}
        {step === 'Workspace' && (
          <>
            <h1 style={h1Style}>Name your workspace</h1>
            <p style={subStyle}>
              The container for all your ventures. You can rename it later.
            </p>

            <div style={{ marginTop: 24 }}>
              <input
                autoFocus
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="e.g. Acme Ventures"
                style={inputStyle}
              />
            </div>
          </>
        )}

        {error && (
          <div style={{
            marginTop: 16,
            padding: '10px 12px',
            borderRadius: 10,
            background: 'var(--surface-2)',
            color: 'var(--error)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11.5,
          }}>
            {error}
          </div>
        )}

        {/* Nav */}
        <div style={{
          marginTop: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}>
          <button
            type="button"
            onClick={back}
            disabled={stepIndex === 0 || saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              cursor: stepIndex === 0 || saving ? 'not-allowed' : 'pointer',
              opacity: stepIndex === 0 ? 0.4 : 1,
            }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            Back
          </button>

          <button
            type="button"
            onClick={handleContinue}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 20px',
              borderRadius: 10,
              border: 0,
              background: 'var(--accent)',
              color: 'var(--surface-0)',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 650,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? (
              <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
            ) : step === 'Workspace' ? (
              <>
                Finish
                <Check style={{ width: 14, height: 14 }} />
              </>
            ) : (
              <>
                Continue
                <ArrowRight style={{ width: 14, height: 14 }} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const h1Style: React.CSSProperties = {
  margin: '8px 0 0',
  fontFamily: 'var(--font-display)',
  fontSize: 26,
  fontWeight: 700,
  letterSpacing: '-0.025em',
  color: 'var(--text-primary)',
};

const subStyle: React.CSSProperties = {
  margin: '8px 0 0',
  fontFamily: 'var(--font-sans)',
  fontSize: 13.5,
  lineHeight: 1.55,
  color: 'var(--text-secondary)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontFamily: 'var(--font-sans)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'var(--surface-2)',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--text-primary)',
  outline: 'none',
};
