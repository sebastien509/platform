import { useState } from 'react';
import {
  Github,
  Rocket,
  Database,
  Mail,
  Calendar,
  Wallet,
  BarChart3,
  HardDrive,
  MessageSquare,
  Users,
  Layers,
  Check,
  AlertCircle,
  ArrowRight,
  Loader2,
  X,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  useConnectors,
  type UnifiedConnector,
} from '@/lib/hooks/useConnectors';
import {
  startConnect,
  disconnectConnector,
} from '@/lib/connectors/oauth';
import type { VentureSection } from './engine/types';

const ICONS: Record<string, any> = {
  github: Github,
  rocket: Rocket,
  database: Database,
  mail: Mail,
  calendar: Calendar,
  wallet: Wallet,
  'bar-chart': BarChart3,
  drive: HardDrive,
  'message-square': MessageSquare,
  users: Users,
  layers: Layers,
  'file-text': FileText,
};

export function ConnectorsList(_props: {
  section: Extract<VentureSection, { type: 'connectors' }>;
}) {
  const { connectors, isLoading } = useConnectors();

  const connected = connectors.filter(
    (c) =>
      c.status === 'connected' ||
      c.status === 'needs_reauth' ||
      c.status === 'error'
  );
  const available = connectors.filter((c) => c.status === 'available');

  if (isLoading) {
    return (
      <div className="connectors-list">
        <div className="connectors-group__loading">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading connectors…
        </div>
      </div>
    );
  }

  return (
    <div className="connectors-list">
      {connected.length > 0 && (
        <section className="connectors-group">
          <span className="connectors-group__label">Connected</span>
          <ul className="connectors-rows">
            {connected.map((c) => (
              <ConnectorRow key={c.provider} connector={c} />
            ))}
          </ul>
        </section>
      )}

      {available.length > 0 && (
        <section className="connectors-group">
          <span className="connectors-group__label">Available</span>
          <ul className="connectors-rows">
            {available.map((c) => (
              <ConnectorRow key={c.provider} connector={c} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ConnectorRow({ connector }: { connector: UnifiedConnector }) {
  const Icon = connector.icon ? ICONS[connector.icon] ?? Layers : Layers;

  const [state, setState] = useState<
    'idle' | 'connecting' | 'disconnecting' | 'error'
  >('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const statusMeta = {
    connected: { tone: 'success' as const, label: 'Connected' },
    available: { tone: 'neutral' as const, label: 'Not connected' },
    needs_reauth: { tone: 'warning' as const, label: 'Needs reauth' },
    error: { tone: 'danger' as const, label: 'Error' },
    revoked: { tone: 'neutral' as const, label: 'Revoked' },
  }[connector.status];

  const StatusIcon =
    connector.status === 'connected'
      ? Check
      : connector.status === 'available'
      ? ArrowRight
      : AlertCircle;

  async function handleConnect() {
    setState('connecting');
    setErrorMsg(null);

    const res = await startConnect(connector.provider, {
      returnTo: window.location.pathname,
    });

    if ('error' in res) {
      setState('error');
      setErrorMsg(res.error);
      return;
    }

    /* Full-page redirect to the provider's consent screen. The
       callback returns the browser to /connectors/callback. */
    window.location.href = res.consentUrl;
  }

  async function handleDisconnect() {
    setState('disconnecting');
    setErrorMsg(null);
    const res = await disconnectConnector(connector.provider);
    if (!res.ok) {
      setState('error');
      setErrorMsg(res.error ?? 'Disconnect failed');
      return;
    }
    setState('idle');
    window.location.reload();
  }

  const isConnecting = state === 'connecting';
  const isDisconnecting = state === 'disconnecting';
  const isBusy = isConnecting || isDisconnecting;
  const canConnect = connector.available;

  return (
    <li className="connector-row">
      <span className="connector-row__icon">
        <Icon className="h-4 w-4" />
      </span>

      <div className="connector-row__main">
        <span className="connector-row__name">{connector.name}</span>
        {connector.usedBy && connector.usedBy.length > 0 && (
          <span className="connector-row__used">
            Used by {connector.usedBy.join(' · ')}
          </span>
        )}
        {connector.accountLabel && (
          <span className="connector-row__account">
            {connector.accountLabel}
          </span>
        )}
        {errorMsg && (
          <span className="connector-row__error">{errorMsg}</span>
        )}
      </div>

      <span className={cn('connector-row__status', `is-${statusMeta.tone}`)}>
        <StatusIcon className="h-3 w-3" />
        {statusMeta.label}
      </span>

      {connector.status === 'connected' ? (
        <button
          type="button"
          className="connector-row__action is-secondary"
          onClick={handleDisconnect}
          disabled={isBusy}
        >
          {isDisconnecting ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Disconnecting
            </>
          ) : (
            <>
              <X className="h-3 w-3" />
              Disconnect
            </>
          )}
        </button>
      ) : canConnect ? (
        <button
          type="button"
          className="connector-row__action"
          onClick={handleConnect}
          disabled={isBusy}
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Connecting
            </>
          ) : (
            <>
              Connect
              <ArrowRight className="h-3 w-3" />
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          className="connector-row__action is-disabled"
          disabled
          title="Coming soon"
        >
          Coming soon
        </button>
      )}
    </li>
  );
}
