import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface IdeaInputProps {
  id: string;
  label: string;
  placeholder?: string;
  agentColorVar?: string;
  disabled?: boolean;
  /** Seed value — used when the founder jumps back to edit a prior answer. */
  initialValue?: string;
  onSubmit: (value: string) => void;
}

export function IdeaInput({
  id,
  label,
  placeholder,
  agentColorVar,
  disabled,
  initialValue = '',
  onSubmit,
}: IdeaInputProps) {
  const [value, setValue] = useState(initialValue);
  const [rippling, setRippling] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  function handleSubmit() {
    if (!value.trim() || disabled) return;
    setRippling(true);
    onSubmit(value.trim());
    setValue('');
    setTimeout(() => setRippling(false), 520);
  }

  return (
    <div
      className="idea-input-row"
      style={
        agentColorVar
          ? ({ '--agent-color': agentColorVar } as React.CSSProperties)
          : undefined
      }
    >
      <div className="idea-input-wrap">
        <label htmlFor={id} className="idea-input-label">
          {label}
        </label>
        <textarea
          ref={ref}
          id={id}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="idea-input"
        />
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!value.trim() || disabled}
        aria-label="Submit answer"
        title="Submit answer"
        className="idea-submit"
      >
        {rippling && <span className="idea-submit__ripple" aria-hidden="true" />}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}