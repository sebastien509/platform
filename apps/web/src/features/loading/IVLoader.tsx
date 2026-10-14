interface IVLoaderProps {
    label?: string;
    size?: 'sm' | 'lg';
    className?: string;
  }
  
  export function IVLoader({ label, size = 'sm', className }: IVLoaderProps) {
    return (
      <span
        className={`iv-loader${size === 'lg' ? ' iv-loader--lg' : ''}${className ? ' ' + className : ''}`}
        aria-label={label ?? 'Loading'}
      >
        <span className="iv-loader__dots" aria-hidden="true">
          <span className="iv-loader__dot" />
          <span className="iv-loader__dot" />
          <span className="iv-loader__dot" />
        </span>
        {label && <span>{label}</span>}
      </span>
    );
  }