import { AlertCircle } from 'lucide-react';

interface ExitRailModalProps {
  onStay: () => void;
  onDiscard: () => void;
}

/**
 * ExitRailModal — shown when the founder tries to leave a local idea
 * before it graduates. Leaving kills the idea; there's no draft state.
 *
 * Per the closed-rail model: the rail is a workshop, not a list. If
 * the founder walks out mid-sentence, the workshop resets.
 */
export function ExitRailModal({ onStay, onDiscard }: ExitRailModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-rail-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgb(0 0 0 / 0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          padding: 28,
          borderRadius: 18,
          background: 'var(--surface-0)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 24px 64px rgb(0 0 0 / 0.28)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--warning-muted)',
              color: 'var(--warning)',
              flexShrink: 0,
            }}
          >
            <AlertCircle style={{ width: 18, height: 18 }} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              id="exit-rail-title"
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
              }}
            >
              Discard this idea?
            </h2>
            <p
              style={{
                margin: '8px 0 0',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                lineHeight: 1.55,
                color: 'var(--text-secondary)',
              }}
            >
              This idea hasn't been through Synthesize yet. Leaving now
              discards everything — the capture, the clean, the research.
              You'll start fresh next time.
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 24,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={onStay}
            style={{
              padding: '9px 16px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'transparent',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            Stay
          </button>
          <button
            type="button"
            onClick={onDiscard}
            style={{
              padding: '9px 16px',
              borderRadius: 10,
              border: 0,
              background: 'var(--error, #dc2626)',
              color: 'white',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Discard idea
          </button>
        </div>
      </div>
    </div>
  );
}
