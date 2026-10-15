
import './iv-hex-mark.css';

const POSITIONS = [
  'c1 r1',
  'c2 r1',
  'c3 r1',
  'c4 r1',
  'c5 r1',
  'c6 r1',
  'c7 r2',
  'c8 r2',
  'c9 r2',
  'c10 r2',
  'c11 r2',
  'c12 r2',
  'c13 r2',
  'c14 r2',
  'c15 r2',
  'c16 r2',
  'c17 r2',
  'c18 r2',
  'c19 r3',
  'c20 r3',
  'c21 r3',
  'c22 r3',
  'c23 r3',
  'c24 r3',
  'c25 r3',
  'c26 r3',
  'c28 r3',
  'c29 r3',
  'c30 r3',
  'c31 r3',
  'c32 r3',
  'c33 r3',
  'c34 r3',
  'c35 r3',
  'c36 r3',
  'c37 r3',
];

export type IVHexMarkSize = 'xs' | 'sm' | 'md' | 'lg';

interface IVHexMarkProps {
  size?: IVHexMarkSize;
  animated?: boolean;
  className?: string;
  label?: string;
}

function HexBricks() {
  return (
    <>
      <span className="iv-hex-brick" />
      <span className="iv-hex-brick iv-hex-brick--b" />
      <span className="iv-hex-brick iv-hex-brick--c" />
    </>
  );
}

export function IVHexMark({
  size = 'sm',
  animated = true,
  className = '',
  label,
}: IVHexMarkProps) {
  return (
    <span
      className={[
        'iv-hex-mark',
        `iv-hex-mark--${size}`,
        animated ? 'is-animated' : 'is-static',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <span className="iv-hex-net">
        <span className="iv-hex-node iv-hex-node--center">
          <HexBricks />
        </span>

        {POSITIONS.map((classes, index) => (
          <span
            key={index}
            className={[
              'iv-hex-node',
              ...classes
                .split(' ')
                .map((item) => `iv-hex-node--${item}`),
            ].join(' ')}
          >
            <HexBricks />
          </span>
        ))}
      </span>
    </span>
  );
}

export default IVHexMark;
