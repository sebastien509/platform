import { ReactNode, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

interface ConfidenceTooltipProps {
  pct: number;
  basis: string;
  sources?: Array<{ id: string; label: string; onClick: () => void }>;
  children: ReactNode;
  className?: string;
}

export function ConfidenceTooltip({
  pct,
  basis,
  sources,
  children,
  className,
}: ConfidenceTooltipProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <span
      ref={wrapperRef}
      className={cn('confidence-tooltip', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && (
        <span role="tooltip" className="confidence-tooltip__panel">
          <span className="confidence-tooltip__title">{pct}% confidence</span>
          <span className="confidence-tooltip__body">{basis}</span>
          {sources && sources.length > 0 && (
            <span className="confidence-tooltip__sources">
              {sources.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="confidence-tooltip__source"
                  onClick={s.onClick}
                >
                  {s.label}
                </button>
              ))}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
