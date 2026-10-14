import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActionSurfaceProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  compact?: boolean;
}

export function ActionSurface({
  title,
  description,
  children,
  className,
  compact = false
}: ActionSurfaceProps) {
  return (
    <Card className={cn('border-primary/20 bg-primary/5', className)}>
      <CardHeader className={cn(compact ? 'pb-2' : 'pb-4')}>
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="text-primary">●</span>
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className={cn(compact ? 'pt-0 space-y-3' : 'space-y-4')}>
        {children}
      </CardContent>
    </Card>
  );
}
