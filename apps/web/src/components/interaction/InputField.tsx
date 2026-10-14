import { ReactNode, ChangeEvent } from 'react';
import { cn } from '@/lib/utils/cn';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface InputFieldProps {
  type?: 'text' | 'textarea' | 'select' | 'file';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  options?: Array<{ label: string; value: string }>;
  label?: string;
  icon?: ReactNode;
}

export function InputField({
  type = 'text',
  placeholder,
  value,
  onChange,
  onSubmit,
  className,
  disabled = false,
  autoFocus = false,
  options,
  label,
  icon
}: InputFieldProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChange?.(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSubmit && type !== 'textarea') {
      e.preventDefault();
      onSubmit();
    }
  };

  if (type === 'textarea') {
    return (
      <div className={cn('space-y-1', className)}>
        {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
        <div className="relative">
          {icon && <div className="absolute left-3 top-3 text-muted-foreground">{icon}</div>}
          <Textarea
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            autoFocus={autoFocus}
            className={cn(icon && 'pl-9', 'min-h-[60px] resize-none')}
          />
        </div>
      </div>
    );
  }

  if (type === 'select' && options) {
    return (
      <div className={cn('space-y-1', className)}>
        {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
        <select
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>}
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoFocus={autoFocus}
          className={cn(icon && 'pl-9')}
        />
        {onSubmit && value && value.trim() && (
          <Button
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-3"
            onClick={onSubmit}
          >
            Send
          </Button>
        )}
      </div>
    </div>
  );
}
