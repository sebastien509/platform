import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Lightbulb, 
  TrendingUp, 
  AlertCircle, 
  FileText,
  ChevronDown,
  ChevronUp,
  Link,
  User,
  Bot,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export type KnowledgeType = 'pattern' | 'playbook' | 'template' | 'evidence' | 'decision' | 'lesson' | 'insight' | 'outcome_takeaway';

export interface KnowledgeItem {
  id: string;
  type: KnowledgeType;
  title: string;
  content: string;
  confidence?: number;
  source: string;
  sourceType: 'research' | 'interview' | 'experiment' | 'outcome' | 'founder' | 'agent';
  createdAt: string;
  tags: string[];
  evidence?: string[];
  relatedItems?: string[];
}

interface EmbeddedKnowledgeProps {
  items: KnowledgeItem[];
  title?: string;
  className?: string;
  maxItems?: number;
  showSource?: boolean;
  onUse?: (item: KnowledgeItem) => void;
  onViewAll?: () => void;
}

const typeConfigs: Record<KnowledgeType, { icon: React.ReactNode; color: string; label: string }> = {
  pattern: { 
    icon: <Lightbulb className="h-3.5 w-3.5" />, 
    color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    label: 'Pattern'
  },
  playbook: { 
    icon: <BookOpen className="h-3.5 w-3.5" />, 
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    label: 'Playbook'
  },
  template: { 
    icon: <FileText className="h-3.5 w-3.5" />, 
    color: 'text-green-500 bg-green-50 dark:bg-green-900/20',
    label: 'Template'
  },
  evidence: { 
    icon: <CheckCircle2 className="h-3.5 w-3.5" />, 
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
    label: 'Evidence'
  },
  decision: { 
    icon: <TrendingUp className="h-3.5 w-3.5" />, 
    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
    label: 'Decision'
  },
  lesson: { 
    icon: <AlertCircle className="h-3.5 w-3.5" />, 
    color: 'text-red-500 bg-red-50 dark:bg-red-900/20',
    label: 'Lesson'
  },
  insight: { 
    icon: <Lightbulb className="h-3.5 w-3.5" />, 
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    label: 'Insight'
  },
  outcome_takeaway: { 
    icon: <TrendingUp className="h-3.5 w-3.5" />, 
    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
    label: 'Takeaway'
  },
};

const sourceTypeIcons = {
  research: <FileText className="h-3 w-3" />,
  interview: <User className="h-3 w-3" />,
  experiment: <TrendingUp className="h-3 w-3" />,
  outcome: <CheckCircle2 className="h-3 w-3" />,
  founder: <User className="h-3 w-3" />,
  agent: <Bot className="h-3 w-3" />,
};

export function EmbeddedKnowledge({
  items,
  title = "What We Know",
  className,
  maxItems = 3,
  showSource = true,
  onUse,
  onViewAll,
}: EmbeddedKnowledgeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);

  const displayItems = showAll ? items : items.slice(0, maxItems);

  const toggleExpanded = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (items.length === 0) {
    return (
      <div className={cn('rounded-lg border border-border bg-card p-6 text-center', className)}>
        <Lightbulb className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No knowledge available yet.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          {title}
        </h4>
        {items.length > maxItems && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-primary hover:underline"
          >
            {showAll ? 'Show less' : `Show all (${items.length})`}
          </button>
        )}
      </div>

      {/* Items */}
      <div className="space-y-2">
        {displayItems.map((item) => {
          const config = typeConfigs[item.type] || typeConfigs.insight;
          const Icon = config.icon;
          const isExpanded = expanded[item.id] || false;

          return (
            <div
              key={item.id}
              className="rounded-lg border border-border bg-card p-3 transition-all hover:shadow-sm"
            >
              <div 
                className="flex items-start gap-3 cursor-pointer"
                onClick={() => toggleExpanded(item.id)}
              >
                <div className={cn('mt-0.5 rounded-lg p-1', config.color)}>
                  {Icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{item.title}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.content}
                  </p>

                  {/* Tags */}
                  {item.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="mt-3 space-y-3 border-t border-border pt-3">
                  {/* Full Content */}
                  <div>
                    <p className="text-sm text-muted-foreground">{item.content}</p>
                  </div>

                  {/* Evidence */}
                  {item.evidence && item.evidence.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Evidence</p>
                      <ul className="mt-1 space-y-1">
                        {item.evidence.map((ev, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="h-1 w-1 rounded-full bg-primary/50" />
                            {ev}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Source */}
                  {showSource && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {sourceTypeIcons[item.sourceType] || <FileText className="h-3 w-3" />}
                        {item.source}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {item.createdAt}
                      </span>
                      {item.confidence !== undefined && (
                        <>
                          <span>·</span>
                          <span className={cn(
                            'font-medium',
                            item.confidence >= 80 ? 'text-green-600' :
                            item.confidence >= 50 ? 'text-amber-600' :
                            'text-red-600'
                          )}>
                            {item.confidence}% confidence
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {onUse && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUse(item);
                        }}
                      >
                        <Link className="h-3 w-3" />
                        Use in context
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Navigate to knowledge detail
                      }}
                    >
                      <FileText className="h-3 w-3" />
                      View details
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* View All */}
      {onViewAll && items.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={onViewAll}
        >
          View all knowledge
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      )}
    </div>
  );
}
