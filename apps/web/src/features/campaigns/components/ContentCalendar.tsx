import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  Video,
  Link,
} from 'lucide-react';

export interface ContentItem {
  id: string;
  title: string;
  type: 'blog' | 'social' | 'video' | 'case_study' | 'whitepaper' | 'email';
  status: 'planned' | 'draft' | 'in_review' | 'approved' | 'published';
  date: string;
  description?: string;
  onAction?: (action: string) => void;
}

interface ContentCalendarProps {
  items: ContentItem[];
  className?: string;
  onNewContent?: () => void;
  onItemClick?: (item: ContentItem) => void;
}

const typeConfigs = {
  blog: { icon: <FileText className="h-3.5 w-3.5" />, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30', label: 'Blog' },
  social: { icon: <Link className="h-3.5 w-3.5" />, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30', label: 'Social' },
  video: { icon: <Video className="h-3.5 w-3.5" />, color: 'text-red-500 bg-red-100 dark:bg-red-900/30', label: 'Video' },
  case_study: { icon: <FileText className="h-3.5 w-3.5" />, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30', label: 'Case Study' },
  whitepaper: { icon: <FileText className="h-3.5 w-3.5" />, color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30', label: 'Whitepaper' },
  email: { icon: <Link className="h-3.5 w-3.5" />, color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30', label: 'Email' },
};

const statusColors = {
  planned: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400',
  draft: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export function ContentCalendar({
  items,
  className,
  onNewContent,
  onItemClick,
}: ContentCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(0);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Simple week calculation
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1 + currentWeek * 7);
  
  const weekDates = weekDays.map((_, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);
    return date;
  });

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const getItemsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return items.filter(item => item.date === dateStr);
  };

  if (items.length === 0) {
    return (
      <div className={cn('rounded-lg border border-border bg-card p-6 text-center', className)}>
        <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No content planned.</p>
        {onNewContent && (
          <Button size="sm" className="mt-2 gap-1" onClick={onNewContent}>
            <Plus className="h-3.5 w-3.5" />
            Plan Content
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(currentWeek - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
            {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(currentWeek + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button size="sm" variant="outline" className="gap-1" onClick={onNewContent}>
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
            {day}
          </div>
        ))}
        {weekDates.map((date, index) => {
          const dayItems = getItemsForDate(date);
          const isCurrentDay = isToday(date);

          return (
            <div
              key={index}
              className={cn(
                'min-h-[80px] rounded-lg border p-1',
                isCurrentDay ? 'border-primary/50 bg-primary/5' : 'border-border',
                'transition-colors'
              )}
            >
              <div className={cn(
                'text-right text-xs font-medium',
                isCurrentDay ? 'text-primary' : 'text-muted-foreground'
              )}>
                {date.getDate()}
              </div>
              <div className="mt-0.5 space-y-0.5">
                {dayItems.slice(0, 3).map((item) => {
                  const config = typeConfigs[item.type] || typeConfigs.blog;
                  const status = statusColors[item.status] || statusColors.planned;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onItemClick?.(item)}
                      className={cn(
                        'flex items-center gap-1 rounded px-1 py-0.5 text-[10px] cursor-pointer hover:opacity-80 transition-opacity',
                        config.color
                      )}
                    >
                      {config.icon}
                      <span className="truncate flex-1">{item.title}</span>
                      <span className={cn('rounded-full px-1 text-[8px]', status)}>
                        {item.status.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  );
                })}
                {dayItems.length > 3 && (
                  <div className="text-[9px] text-muted-foreground text-center">
                    +{dayItems.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
