import type { ShareSnapshot } from '@/lib/share';
import { useState } from 'react';
import {
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Github,
  Rocket,
  FileText,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import { useDeliverablesStore } from '@/lib/deliverables';
import { useShareStore } from '@/lib/share';
import { useConnectors } from '@/lib/hooks/useConnectors';
import { getActionDef } from '@/features/venture-actions/page-actions';
import {
  executeConnectorAction,
  parseActionParams,
} from '@/lib/connectors/execute';
import type { OutputBlock } from '@/lib/types';

const PROVIDER_ICON: Record<string, any> = {
  github: Github,
  vercel: Rocket,
  notion: FileText,
  slack: MessageSquare,
  calendar: Calendar,
};

const PROVIDER_LABEL: Record<string, string> = {
  github: 'GitHub',
  vercel: 'Vercel',
  notion: 'Notion',
  slack: 'Slack',
  calendar: 'Google Calendar',
};

interface ActionPayload {
  provider: string;
  verb: string;
  summary: string;
  params: string;
}

export function ActionExecuteBlockView({ block }: { block: OutputBlock }) {
  const endRun = useAgentDrawerStore((s) => s.endRun);
  const closeDrawer = useAgentDrawerStore((s) => s.closeDrawer);
  const addDeliverable = useDeliverablesStore((s) => s.addDeliverable);
  const { connectors } = useConnectors();

  const action: ActionPayload | undefined = (block.payload as any)?.action;
  if (!action) {
    return (
      <li className="agent-output-card is-error">
        <AlertCircle className="h-3.5 w-3.5" />
        <p>Action payload missing.</p>
      </li>
    );
  }

  const [state, setState] = useState<
    'idle' | 'running' | 'done' | 'error'
  >('idle');
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const connector = connectors.find((c) => c.provider === action.provider);
  const connected = connector?.status === 'connected';
  const Icon = PROVIDER_ICON[action.provider] ?? Rocket;
  const providerLabel = PROVIDER_LABEL[action.provider] ?? action.provider;

  const parsed = parseActionParams<Record<string, any>>(action.params);

  async function handleExecute() {
    if (!connected || !parsed) return;
    setState('running');
    setErrorMsg(null);

    const run = useAgentDrawerStore.getState().runs[block.runId];

    const res = await executeConnectorAction({
      provider: action!.provider,
      action: action!.verb,
      opId: (run as any)?.opId,
      threadId: block.runId,
      payload: parsed,
    });

    if (res.ok) {
      console.log('[vercel-block] raw result', res);
      setResult(res);
      setState('done');
      persistDeliverable(res);
      setTimeout(() => {
        endRun(block.runId, 'done');
      }, 1500);
    } else {
      setState('error');
      setErrorMsg(res.error ?? 'Action failed');
    }
  }

  function persistDeliverable(res: Record<string, any>) {
    const run = useAgentDrawerStore.getState().runs[block.runId];
    const opId = (run as any)?.opId ?? block.title;
    const pageId = run?.page ?? 'strategy';
    const ventureId = run?.ventureId ?? '';
    const def = getActionDef(opId);
    const renderType = def?.renderType ?? 'operational';
    const tier = def?.tier ?? 'secondary';

    const externalUrl =
      res.repoUrl ?? res.pageUrl ?? res.eventUrl ?? undefined;

    const sections: ShareSnapshot['sections'] = [
      {
        type: 'callout',
        id: 'summary',
        label: undefined,
        tone: 'ready',
        body: `${providerLabel} action completed. ${action!.summary}`,
      },
    ];

    if (externalUrl) {
      sections.push({
        type: 'paragraph',
        id: 'url',
        label: 'Result URL',
        body: externalUrl,
      });
    }

    sections.push({
      type: 'code',
      id: 'params',
      label: 'Executed params',
      language: 'json',
      code: JSON.stringify(parsed, null, 2),
    });

    const snapshot: ShareSnapshot = {
      title: block.title,
      kicker: action!.summary,
      sections,
    };

    const linkId = useShareStore.getState().createLink({
      surfaceId: 'strategy.brief' as any,
      ventureId,
      snapshot,
      createdBy: 'Founder',
      commentsEnabled: false,
      expiresAt: null,
    });

    addDeliverable({
      opId,
      pageId,
      ventureId,
      title: block.title,
      kind: 'record' as any,
      surfaceId: 'strategy.brief' as any,
      snapshot,
      shareLinkId: linkId,
      runId: block.runId,
      agentId: block.agentId,
      renderType: renderType as any,
      tier: tier as any,
    });
  }


  const resultUrl =
    result?.repoUrl ??
    result?.pageUrl ??
    result?.eventUrl ??
    result?.deployUrl ??
    undefined;

  return (
    <li className="agent-output-card agent-output-card--action">
      <div className="agent-output-card__top">
        <span className="agent-output-card__kind">
          <Icon className="h-2.5 w-2.5" />
          {providerLabel}
        </span>
        <span
          className={cn(
            'agent-output-card__status',
            state === 'done' && 'is-success',
            state === 'error' && 'is-error',
          )}
        >
          {state === 'idle' && block.status.replace('_', ' ')}
          {state === 'running' && 'Executing…'}
          {state === 'done' && 'Done'}
          {state === 'error' && 'Failed'}
        </span>
      </div>

      <p className="agent-output-card__title">{block.title}</p>
      <p className="agent-action__summary">{action.summary}</p>

      {!connected && (
        <div className="agent-batch__connect-note">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>
            Connect {providerLabel} on <strong>Connectors</strong> first.
          </span>
        </div>
      )}

      {state === 'idle' && connected && (
        <div className="agent-action__actions">
          <button
            type="button"
            className="agent-batch__btn is-primary"
            onClick={handleExecute}
          >
            <Play className="h-3 w-3" />
            Execute
          </button>
        </div>
      )}

      {state === 'running' && (
        <p className="agent-batch__status-line">
          <Loader2 className="h-3 w-3 animate-spin" />
          Running on {providerLabel}…
        </p>
      )}

      {state === 'done' && (
        <>
          <p className="agent-batch__status-line is-success">
            <CheckCircle2 className="h-3 w-3" />
            {resultUrl ? 'Created.' : 'Completed.'}
          </p>
          {resultUrl && (
            <a
              href={resultUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="agent-action__url"
            >
              <ExternalLink className="h-3 w-3" />
              {resultUrl}
            </a>
          )}
        </>
      )}

      {state === 'error' && errorMsg && (
        <>
          <p className="agent-batch__status-line is-error">
            <AlertCircle className="h-3 w-3" />
            {errorMsg}
          </p>
          <div className="agent-action__actions">
            <button
              type="button"
              className="agent-batch__btn is-secondary"
              onClick={() => setState('idle')}
            >
              Retry
            </button>
          </div>
        </>
      )}

      {state === 'done' && (
        <div className="agent-action__actions">
          <button
            type="button"
            className="agent-batch__btn is-secondary"
            onClick={() => {
              endRun(block.runId, 'done');
              closeDrawer();
            }}
          >
            Close
          </button>
        </div>
      )}
    </li>
  );
}
