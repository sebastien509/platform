import type { CSSProperties } from 'react';

/**
 * Static IV hex network for Ideas surfaces.
 *
 * Uses the same overall node map as IVLoadingScreen,
 * but renders each node as a hollow outlined hex
 * instead of filled animated bricks.
 */

const POSITIONS: ReadonlyArray<readonly [number, number]> = [
  [-47, -15],
  [-31, -43],
  [1, -43],
  [17, -15],
  [-31, 13],
  [1, 13],
  [-63, -43],
  [33, -43],
  [-15, 41],
  [-63, 13],
  [33, 13],
  [-15, -71],
  [-47, -71],
  [17, -71],
  [-47, 41],
  [17, 41],
  [-79, -15],
  [49, -15],
  [-63, -99],
  [33, -99],
  [1, -99],
  [-31, -99],
  [-63, 69],
  [33, 69],
  [1, 69],
  [-31, 69],
  [-95, -43],
  [-95, 13],
  [49, 41],
  [-79, -71],
  [-111, -15],
  [65, -43],
  [65, 13],
  [-79, 41],
  [49, -71],
  [81, -15],
];

interface IdeasHexNetworkProps {
  variant?: 'hero' | 'card';
  className?: string;
}

function HexOutline() {
  return (
    <svg
      viewBox="0 0 28 28"
      className="ideas-hex-outline"
      aria-hidden="true"
    >
      <polygon
        className="ideas-hex-outline__stroke ideas-hex-outline__stroke--outer"
        points="14,1.8 24.6,8 24.6,20 14,26.2 3.4,20 3.4,8"
      />
      <polygon
        className="ideas-hex-outline__stroke ideas-hex-outline__stroke--inner"
        points="14,6.2 20.7,10.1 20.7,17.9 14,21.8 7.3,17.9 7.3,10.1"
      />
    </svg>
  );
}

export function IdeasHexNetwork({
  variant = 'card',
  className = '',
}: IdeasHexNetworkProps) {
  return (
    <div
      className={[
        'ideas-hex-art',
        `ideas-hex-art--${variant}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      <div className="ideas-hex-net">
        <span
          className="ideas-hex-node"
          style={
            {
              '--hex-x': '-15px',
              '--hex-y': '-15px',
            } as CSSProperties
          }
        >
          <HexOutline />
        </span>

        {POSITIONS.map(([x, y], index) => (
          <span
            key={index}
            className="ideas-hex-node"
            style={
              {
                '--hex-x': `${x}px`,
                '--hex-y': `${y}px`,
              } as CSSProperties
            }
          >
            <HexOutline />
          </span>
        ))}
      </div>
    </div>
  );
}