import { ReactNode } from 'react';
import { InlineExpand } from '@/components/containers';
import { ToolCallIO } from './ToolCallIO';
import { ToolCallTiming, ToolCallStatus } from './ToolCallTiming';
import { cn } from '@/lib/utils/cn';

interface ToolCallBlockProps {
  icon?: ReactNode;
  name: string;
  status: ToolCallStatus;
  duration?: number;
  input?: unknown;
  output?: unknown;
  sources?: Array<{ label: string; onClick: () => void }>;
  className?: string;
}

export function ToolCallBlock({
  icon,
  name,
  status,
  duration,
  input,
  output,
  sources,
  className,
}: ToolCallBlockProps) {
  return (
    <div className={cn('tool-call', className)}>
      <InlineExpand
        trigger={
          <span className="tool-call__trigger">
            {icon && <span className="tool-call__icon">{icon}</span>}
            <span className="tool-call__name">{name}</span>
            <ToolCallTiming status={status} duration={duration} />
          </span>
        }
      >
        <ToolCallIO input={input} output={output} sources={sources} />
      </InlineExpand>
    </div>
  );
}
