import { cn } from '@/lib/utils/cn';

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
  sublabel?: string;
  color?: string;
}

export function ProgressRing({
  value,
  max = 100,
  size = 64,
  strokeWidth = 4,
  className,
  label,
  sublabel,
  color
}: ProgressRingProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (color) return color;
    if (percentage >= 80) return 'stroke-green-500';
    if (percentage >= 60) return 'stroke-amber-500';
    if (percentage >= 40) return 'stroke-orange-500';
    return 'stroke-red-500';
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            className="stroke-muted/20 fill-none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <circle
            className={cn('fill-none transition-all duration-500 ease-in-out', getColor())}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{Math.round(percentage)}%</span>
        </div>
      </div>
      {label && <span className="mt-1 text-sm font-medium">{label}</span>}
      {sublabel && <span className="text-xs text-muted-foreground">{sublabel}</span>}
    </div>
  );
}
