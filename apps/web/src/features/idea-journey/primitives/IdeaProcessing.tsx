/**
 * IdeaProcessing — the "agent is thinking" placeholder.
 *
 * Reuses the IV hex network from the loading screen, scaled to a
 * visible size and rendered in the current text color. No text,
 * no bubbles. Renders in place of the stage's input when the
 * agent is working.
 */

const HEX_NODES: string[] = [
  'c1 r1', 'c2 r1', 'c3 r1', 'c4 r1', 'c5 r1', 'c6 r1',
  'c7 r2', 'c8 r2', 'c9 r2', 'c10 r2', 'c11 r2', 'c12 r2',
  'c13 r2', 'c14 r2', 'c15 r2', 'c16 r2', 'c17 r2', 'c18 r2',
  'c19 r3', 'c20 r3', 'c21 r3', 'c22 r3', 'c23 r3', 'c24 r3',
  'c25 r3', 'c26 r3', 'c28 r3', 'c29 r3', 'c30 r3', 'c31 r3',
  'c32 r3', 'c33 r3', 'c34 r3', 'c35 r3', 'c36 r3', 'c37 r3',
];

export function IdeaProcessing() {
  return (
    <div
      className="idea-processing"
      aria-live="polite"
      aria-label="Agent is thinking"
      role="status"
    >
      <div className="idea-processing__hex-clip">
        <div className="idea-processing__hex">
          <div className="iv-hex-node iv-hex-node--center">
            <HexBricks />
          </div>
          {HEX_NODES.map((classes, i) => (
            <div
              key={i}
              className={`iv-hex-node ${classes
                .split(' ')
                .map((c) => `iv-hex-node--${c}`)
                .join(' ')}`}
            >
              <HexBricks />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HexBricks() {
  return (
    <>
      <div className="iv-hex-brick" />
      <div className="iv-hex-brick iv-hex-brick--b" />
      <div className="iv-hex-brick iv-hex-brick--c" />
    </>
  );
}