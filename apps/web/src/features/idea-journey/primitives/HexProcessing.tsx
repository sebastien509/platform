/**
 * HexProcessing — the IV hex network, sized by props.
 *
 * The network is a fixed 200×200 grid of 40 pulsing nodes.
 * We scale the whole thing to `size`, keep the animation, and
 * let the shadow glow overflow without being clipped by ancestors.
 *
 * The container is intentionally larger than `size` so the outer
 * nodes' glow has room — the visual center is the network.
 */

interface Node {
  c: number;
  r: 1 | 2 | 3;
}

const HEX_NODES: Node[] = [
  { c: 1, r: 1 }, { c: 2, r: 1 }, { c: 3, r: 1 }, { c: 4, r: 1 }, { c: 5, r: 1 }, { c: 6, r: 1 },
  { c: 7, r: 2 }, { c: 8, r: 2 }, { c: 9, r: 2 }, { c: 10, r: 2 }, { c: 11, r: 2 }, { c: 12, r: 2 },
  { c: 13, r: 2 }, { c: 14, r: 2 }, { c: 15, r: 2 }, { c: 16, r: 2 }, { c: 17, r: 2 }, { c: 18, r: 2 },
  { c: 19, r: 3 }, { c: 20, r: 3 }, { c: 21, r: 3 }, { c: 22, r: 3 }, { c: 23, r: 3 }, { c: 24, r: 3 },
  { c: 25, r: 3 }, { c: 26, r: 3 }, { c: 28, r: 3 }, { c: 29, r: 3 }, { c: 30, r: 3 }, { c: 31, r: 3 },
  { c: 32, r: 3 }, { c: 33, r: 3 }, { c: 34, r: 3 }, { c: 35, r: 3 }, { c: 36, r: 3 }, { c: 37, r: 3 },
];

interface HexProcessingProps {
  /** Edge length in px. The network's outer glow may exceed this. */
  size?: number;
  /** Brick fill. */
  color?: string;
  /** Optional halo color for the bricks. */
  glow?: string;
  /** Brick width in px. */
  thickness?: number;
  /** Disable the pulse animation. */
  quiet?: boolean;
}

export function HexProcessing({
  size = 140,
  color = '#8a8a8a',
  glow,
  thickness = 2,
  quiet = false,
}: HexProcessingProps) {
  /* The network source is 200×200. We scale = size / 200. */
  const scale = size / 200;
  /* Reserve a box slightly larger than the visual size so the
   * glow + outer nodes never clip. */
  const boxSize = Math.round(size * 1.15);

  return (
    <div
      className={`iv-hex-mark ${quiet ? 'is-quiet' : ''}`}
      style={{
        '--iv-mark-size': `${boxSize}px`,
        '--iv-mark-scale': scale,
        '--hex-color': color,
        '--hex-thickness': `${thickness}px`,
        '--hex-glow': glow ?? 'none',
        position: 'relative',
        width: boxSize,
        height: boxSize,
        flex: `0 0 ${boxSize}px`,
        overflow: 'visible',
      } as React.CSSProperties}
      aria-live="polite"
      aria-label="Agent is thinking"
      role="status"
    >
      <div className="iv-hex-net">
        <div className="iv-hex-node iv-hex-node--center">
          <HexBricks />
        </div>
        {HEX_NODES.map(({ c, r }) => (
          <div
            key={`c${c}r${r}`}
            className={`iv-hex-node iv-hex-node--c${c} iv-hex-node--r${r}`}
          >
            <HexBricks />
          </div>
        ))}
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
