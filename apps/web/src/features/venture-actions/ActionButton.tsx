import { useState } from 'react';
import {
  Share2, Download, Send, Calendar, Sparkles, ArrowUpRight,
  Users, Github, Rocket, Database, Play, Mail, Plus,
  Phone, Pause, XCircle, Check, Loader2, Search,
  MessageCircle, FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import { runAction } from './runAction';
import type { ActionDef } from './page-actions';

const ICONS: Record<string, any> = {
  share: Share2,
  download: Download,
  send: Send,
  calendar: Calendar,
  sparkles: Sparkles,
  'arrow-up-right': ArrowUpRight,
  users: Users,
  github: Github,
  rocket: Rocket,
  database: Database,
  play: Play,
  mail: Mail,
  plus: Plus,
  phone: Phone,
  pause: Pause,
  'x-circle': XCircle,
  check: Check,
  search: Search,
  'message-circle': MessageCircle,
  'file-text': FileText,
};

interface ActionButtonProps {
  def: ActionDef;
  ventureId?: string;
  pageId: string;
}

/**
 * ActionButton — the trigger for an op.
 * Clicking it starts the agent run and opens the drawer.
 * The founder never sees the outcome modal from this button.
 */
export function ActionButton({ def, ventureId, pageId }: ActionButtonProps) {
  const [busy, setBusy] = useState(false);
  const Icon = def.icon ? ICONS[def.icon] : null;

  /* If the op has already produced an artifact, clicking reopens the drawer */
  const existingAction = useAgentDrawerStore((s) => {
    const found = Object.values(s.actions).find(
      (a) => (a.payload as any)?.__defId === def.id
    );
    return found ?? null;
  });
  const openDrawer = useAgentDrawerStore((s) => s.openDrawer);
  const runs = useAgentDrawerStore((s) => s.runs);

  const handleClick = () => {
    if (existingAction) {
      /* Look for a run on this page and open it */
      const pageRun = Object.values(runs).find((r) => r.page === pageId);
      if (pageRun) openDrawer(pageRun.id);
      else openDrawer();
      return;
    }

    setBusy(true);
    try {
      runAction(def, { ventureId, pageId });
    } finally {
      /* busy resets on next render anyway */
      setTimeout(() => setBusy(false), 200);
    }
  };

  const state = existingAction?.state;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy || state === 'live' || state === 'proven'}
      className={cn(
        'action-btn',
        state === 'prepared' && 'action-btn--prepared',
        state === 'confirmed' && 'action-btn--confirmed',
        state === 'live' && 'action-btn--live',
        state === 'proven' && 'action-btn--proven',
        def.mode === 'connected' && 'action-btn--connected'
      )}
    >
      {busy ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : Icon ? (
        <Icon className="h-3 w-3" />
      ) : null}
      {def.verb}
    </button>
  );
}
