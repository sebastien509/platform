import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  className?: string;
}

export function MetricCard({ title, value, icon: Icon, className }: MetricCardProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4 shadow-sm", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
