import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  TrendingUp,
  Minus,
  Award
} from 'lucide-react';

export type RecommendationDecision = 'scale' | 'keep_testing' | 'reject' | 'pause' | 'graduate';

export interface RecommendationEvidence {
  title: string;
  description: string;
  confidence: number;
}

interface OutcomeRecommendationProps {
  title: string;
  description: string;
  decision: RecommendationDecision;
  reasoning: string;
  evidence: RecommendationEvidence[];
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  onAccept?: () => void;
  onReject?: () => void;
  onModify?: () => void;
  className?: string;
  sourceAgent?: string;
}

const decisionConfigs: Record<RecommendationDecision, { label: string; icon: React.ReactNode; className: string }> = {
  scale: { 
    label: 'Scale', 
    icon: <TrendingUp className="h-4 w-4" />, 
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
  },
  keep_testing: { 
    label: 'Keep Testing', 
    icon: <Minus className="h-4 w-4" />, 
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
  },
  reject: { 
    label: 'Reject', 
    icon: <XCircle className="h-4 w-4" />, 
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
  },
  pause: { 
    label: 'Pause', 
    icon: <AlertCircle className="h-4 w-4" />, 
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400' 
  },
  graduate: { 
    label: 'Graduate', 
    icon: <Award className="h-4 w-4" />, 
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' 
  },
};

const statusConfigs = {
  pending: {
    label: 'Pending Review',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  accepted: {
    label: 'Accepted',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  modified: {
    label: 'Modified',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
};

export function OutcomeRecommendation({
  title,
  description,
  decision,
  reasoning,
  evidence,
  status,
  onAccept,
  onReject,
  onModify,
  className,
  sourceAgent = 'System',
}: OutcomeRecommendationProps) {
  const [expanded, setExpanded] = useState(false);
  const decisionConfig = decisionConfigs[decision] || decisionConfigs.scale;
  const statusConfig = statusConfigs[status] || statusConfigs.pending;
  const isPending = status === 'pending';

  return (
    <div className={cn(
      'rounded-lg border border-primary/30 bg-primary/5 p-4 transition-all hover:shadow-md',
      status === 'accepted' && 'border-green-200 dark:border-green-800',
      status === 'rejected' && 'border-red-200 dark:border-red-800',
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-primary/10 p-1.5 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold">{title}</p>
            <Badge className={decisionConfig.className}>
              <span className="flex items-center gap-1">
                {decisionConfig.icon}
                {decisionConfig.label}
              </span>
            </Badge>
            <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>

        {sourceAgent && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Sparkles className="h-3 w-3" />
            {sourceAgent}
          </div>
        )}
      </div>

      <div className="mt-3 rounded-lg bg-muted/30 p-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reasoning</p>
        <p className="mt-1 text-sm">{reasoning}</p>
      </div>

      {evidence.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? 'Hide evidence' : `Show ${evidence.length} evidence items`}
          </button>

          {expanded && (
            <div className="mt-2 space-y-1.5">
              {evidence.map((item, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/30 p-2 text-sm">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                  <span className="text-xs font-medium text-primary">{item.confidence}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isPending && (onAccept || onReject || onModify) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {onAccept && (
            <Button size="sm" onClick={onAccept} className="gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Accept
            </Button>
          )}
          {onModify && (
            <Button size="sm" variant="outline" onClick={onModify} className="gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Modify
            </Button>
          )}
          {onReject && (
            <Button size="sm" variant="outline" onClick={onReject} className="gap-1 text-destructive hover:text-destructive">
              <XCircle className="h-3.5 w-3.5" />
              Reject
            </Button>
          )}
        </div>
      )}

      {status === 'accepted' && (
        <div className="mt-3 rounded-lg bg-green-50 dark:bg-green-900/20 p-2 text-sm text-green-700 dark:text-green-400">
          ✅ Recommendation accepted. Taking action...
        </div>
      )}

      {status === 'rejected' && (
        <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-900/20 p-2 text-sm text-red-700 dark:text-red-400">
          ❌ Recommendation rejected. No action taken.
        </div>
      )}
    </div>
  );
}
