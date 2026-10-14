import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';

interface DecisionOption {
  label: string;
  value: string;
  primary?: boolean;
  destructive?: boolean;
  description?: string;
}

interface DecisionButtonsProps {
  options: DecisionOption[];
  onSelect: (value: string) => void;
  className?: string;
  disabled?: boolean;
  selected?: string;
}

export function DecisionButtons({
  options,
  onSelect,
  className,
  disabled = false,
  selected
}: DecisionButtonsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <Button
            key={option.value}
            variant={
              option.destructive ? 'destructive' :
              option.primary ? 'default' :
              isSelected ? 'default' :
              'outline'
            }
            onClick={() => onSelect(option.value)}
            disabled={disabled}
            className={cn(
              option.description && 'h-auto py-2 px-4 flex-col items-start gap-0.5',
              isSelected && !option.primary && !option.destructive && 'border-primary'
            )}
          >
            <span>{option.label}</span>
            {option.description && (
              <span className="text-xs opacity-70">{option.description}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
