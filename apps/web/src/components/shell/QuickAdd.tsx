import { useState, ChangeEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUIStore } from '@/lib/stores/uiStore';
import { useCreateIdea } from '@/lib/hooks/useIdeas';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';

export function QuickAdd() {
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [audience, setAudience] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { quickAddOpen, closeQuickAdd } = useUIStore();
  const createIdea = useCreateIdea();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      await createIdea.mutateAsync({
        title: title.trim(),
        description: problem.trim(),
        problem: problem.trim(),
        hypothesis: hypothesis.trim(),
        audience: audience.trim(),
        phase: 'validate',
        status: 'captured',
        owner: 'You',
        progress: 0,
        context: { evidence: [], knowledge: [], artifacts: [], checkpoints: [] }
      } as any);
      setTitle('');
      setProblem('');
      setHypothesis('');
      setAudience('');
      closeQuickAdd();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={quickAddOpen} onOpenChange={closeQuickAdd}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Capture a new idea
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="idea-title" className="text-sm font-medium">
              What's your idea? <span className="text-destructive">*</span>
            </Label>
            <Input
              id="idea-title"
              placeholder="e.g., AI contract review for small law firms"
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              className="text-base"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="idea-problem" className="text-sm font-medium">
              What problem does it solve?
            </Label>
            <Textarea
              id="idea-problem"
              placeholder="What pain point or opportunity exists?"
              value={problem}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setProblem(e.target.value)}
              className="min-h-[60px] resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="idea-hypothesis" className="text-sm font-medium">
              What's your hypothesis?
            </Label>
            <Textarea
              id="idea-hypothesis"
              placeholder="e.g., Small law firms will pay $199/mo for AI contract review..."
              value={hypothesis}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setHypothesis(e.target.value)}
              className="min-h-[60px] resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="idea-audience" className="text-sm font-medium">
              Who is this for?
            </Label>
            <Input
              id="idea-audience"
              placeholder="e.g., Small law firms with 1-20 attorneys"
              value={audience}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setAudience(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <Button type="button" variant="outline" onClick={closeQuickAdd}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Capture Idea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
