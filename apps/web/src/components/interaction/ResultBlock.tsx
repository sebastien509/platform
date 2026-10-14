import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Info, TrendingUp } from 'lucide-react';

type ResultType = 'success' | 'warning' | 'info' | 'neutral';

interface ResultBlockProps {
  title: string;
  content: string;
  type?: ResultType;
  score?: number;
  evidence?: string[];
  className?: string;
  actions?: ReactNode;
}

const configs: Record<ResultType, { icon: React.ReactNode; className: string; borderColor: string; bgColor: string }> = {
  success: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    className: 'text-green-600 dark:text-green-400',
    borderColor: 'border-green-200 dark:border-green-800',
    bgColor: 'bg-green-50 dark:bg-green-950/20'
  },
  warning: {
    icon: <AlertCircle className="h-4 w-4" />,
    className: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-800',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20'
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    className: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20'
  },
  neutral: {
    icon: <TrendingUp className="h-4 w-4" />,
    className: 'text-muted-foreground',
    borderColor: 'border-border',
    bgColor: 'bg-muted/30'
  },
};

export function ResultBlock({
  title,
  content,
  type = 'neutral',
  score,
  evidence,
  className,
  actions
}: ResultBlockProps) {
  const config = configs[type] || configs.neutral;

  return (
    <div className={cn(
      'rounded-lg border p-4',
      config.bgColor,
      config.borderColor,
      className
    )}>
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5', config.className)}>
          {config.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h4 className="font-medium">{title}</h4>
            {score !== undefined && (
              <Badge variant="outline" className={cn(
                score >= 80 ? 'border-green-500 text-green-600' :
                score >= 60 ? 'border-amber-500 text-amber-600' :
                'border-red-500 text-red-600'
              )}>
                {score}% confidence
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{content}</p>

          {evidence && evidence.length > 0 && (
            <div className="mt-2 space-y-1">
              {evidence.map((item, i) => (
                <p key={i} className="text-xs text-muted-foreground">• {item}</p>
              ))}
            </div>
          )}

          {actions && (
            <div className="mt-3 flex flex-wrap gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
