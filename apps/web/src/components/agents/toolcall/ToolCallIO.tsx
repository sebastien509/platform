import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface ToolCallIOProps {
  input?: unknown;
  output?: unknown;
  sources?: Array<{ label: string; onClick: () => void }>;
  className?: string;
}

type Tab = 'input' | 'output' | 'sources';

function stringify(v: unknown): string {
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

export function ToolCallIO({
  input,
  output,
  sources,
  className,
}: ToolCallIOProps) {
  const tabs: Tab[] = [
    ...(input !== undefined ? (['input'] as Tab[]) : []),
    ...(output !== undefined ? (['output'] as Tab[]) : []),
    ...(sources && sources.length > 0 ? (['sources'] as Tab[]) : []),
  ];
  const [active, setActive] = useState<Tab>(tabs[0] ?? 'input');

  if (tabs.length === 0) return null;

  return (
    <div className={cn('tool-call__io', className)}>
      <div className="tool-call__io-tabs">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            className={cn('tool-call__io-tab', active === t && 'is-active')}
            onClick={() => setActive(t)}
          >
            {t === 'input' ? 'Input' : t === 'output' ? 'Output' : 'Sources'}
          </button>
        ))}
      </div>
      <div className="tool-call__io-body">
        {active === 'input' && input !== undefined && (
          <pre className="tool-call__pre">{stringify(input)}</pre>
        )}
        {active === 'output' && output !== undefined && (
          <pre className="tool-call__pre">{stringify(output)}</pre>
        )}
        {active === 'sources' && sources && (
          <ul className="tool-call__sources">
            {sources.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="tool-call__source"
                  onClick={s.onClick}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
