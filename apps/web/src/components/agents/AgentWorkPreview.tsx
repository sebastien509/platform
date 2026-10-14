import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Bot,
  Calendar,
  AlertCircle
} from 'lucide-react';

export interface AgentWorkPreviewData {
  id: string;
  agentId: string;
  agentName: string;
  title: string;
  description: string;
  content: string;
  type: 'research' | 'copy' | 'code' | 'design' | 'analysis' | 'plan';
  status: 'pending' | 'approved' | 'rejected' | 'needs_work';
  createdAt: string;
  evidence?: Array<{ title: string; confidence: number }>;
}

interface AgentWorkPreviewProps {
  work: AgentWorkPreviewData;
  onApprove?: () => void;
  onReject?: () => void;
  onRequestChanges?: () => void;
  className?: string;
}

const typeConfig = {
  research: { label: 'Research', icon: FileText, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  copy: { label: 'Copy', icon: FileText, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  code: { label: 'Code', icon: FileText, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  design: { label: 'Design', icon: FileText, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  analysis: { label: 'Analysis', icon: FileText, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  plan: { label: 'Plan', icon: FileText, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' }
};

const statusConfig = {
  pending: { label: 'Pending Review', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  needs_work: { label: 'Needs Work', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
};

export function AgentWorkPreview({ work, onApprove, onReject, onRequestChanges, className }: AgentWorkPreviewProps) {
  const [showFull, setShowFull] = useState(false);
  const config = typeConfig[work.type] || typeConfig.research;
  const Icon = config.icon;
  const status = statusConfig[work.status] || statusConfig.pending;
  const isPending = work.status === 'pending';

  return (
    <div className={cn('rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={cn('rounded-lg p-2', config.color)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold">{work.title}</h4>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Bot className="h-3 w-3" />
                {work.agentName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(work.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <Badge className={status.className}>{status.label}</Badge>
      </div>

      {/* Description */}
      <p className="mt-2 text-sm text-muted-foreground">{work.description}</p>

      {/* Content Preview */}
      <div className="mt-3 rounded-lg bg-muted/30 p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Content Preview</p>
          <button
            onClick={() => setShowFull(!showFull)}
            className="text-sm text-primary hover:underline"
          >
            {showFull ? 'Show less' : 'Show more'}
          </button>
        </div>
        <div className={cn(
          'mt-1 text-sm whitespace-pre-wrap transition-all',
          showFull ? 'max-h-96 overflow-auto' : 'max-h-20 overflow-hidden'
        )}>
          {work.content}
        </div>
      </div>

      {/* Evidence */}
      {work.evidence && work.evidence.length > 0 && (
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium">Evidence:</span>
          {work.evidence.map((ev, i) => (
            <Badge key={i} variant="outline" className="gap-1">
              {ev.title}
              <span className="text-muted-foreground">{ev.confidence}%</span>
            </Badge>
          ))}
        </div>
      )}

      {/* Actions */}
      {isPending && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={onApprove} className="gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Approve
          </Button>
          <Button variant="outline" onClick={onRequestChanges} className="gap-1">
            <AlertCircle className="h-4 w-4" />
            Request Changes
          </Button>
          <Button variant="outline" onClick={onReject} className="gap-1 text-destructive hover:text-destructive">
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
        </div>
      )}

      {work.status === 'approved' && (
        <div className="mt-3 rounded-lg bg-green-50 dark:bg-green-900/20 p-2 text-sm text-green-700 dark:text-green-400">
          ✅ Approved — This work has been reviewed and accepted.
        </div>
      )}

      {work.status === 'rejected' && (
        <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-900/20 p-2 text-sm text-red-700 dark:text-red-400">
          ❌ Rejected — This work needs to be redone or replaced.
        </div>
      )}
    </div>
  );
}
