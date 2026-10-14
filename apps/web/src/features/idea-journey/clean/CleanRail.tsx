import { cn } from '@/lib/utils/cn';
import type { CleanFieldState, CleanFieldKey } from '@/lib/types';

interface CleanRailProps {
  fields: CleanFieldState[];
  activeKey: CleanFieldKey | null;
  onSelect: (key: CleanFieldKey) => void;
}

export function CleanRail({ fields, activeKey, onSelect }: CleanRailProps) {
  return (
    <div className="clean-rail">
      {fields.map((field, i) => {
        const isActive = field.key === activeKey;
        const isLocked = field.status === 'locked';
        const isPending = field.status === 'pending';

        return (
          <button
            key={field.key}
            type="button"
            onClick={() => !isPending && onSelect(field.key)}
            disabled={isPending}
            className={cn(
              'clean-rail__step',
              isLocked && 'is-locked',
              isActive && 'is-active',
              isPending && 'is-pending'
            )}
          >
            <span
              className={cn(
                'clean-rail__node',
                isLocked && 'is-locked',
                isActive && 'is-active',
                isPending && 'is-pending'
              )}
            />
            {i < fields.length - 1 && (
              <span className="clean-rail__line" aria-hidden="true" />
            )}
            <span className="clean-rail__label">{field.label}</span>
          </button>
        );
      })}
    </div>
  );
}
