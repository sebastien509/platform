import { useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from '@/lib/supabase';

type Status = 'checking' | 'connected' | 'error' | 'not-configured';

export default function HealthPage() {
  const [status, setStatus] = useState<Status>('checking');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    if (!supabaseConfigured) {
      setStatus('not-configured');
      return;
    }
    (async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) {
          setStatus('error');
          setDetail(error.message);
          return;
        }
        const host = new URL(import.meta.env.VITE_SUPABASE_URL).host;
        setStatus('connected');
        setDetail(host);
      } catch (e) {
        setStatus('error');
        setDetail(e instanceof Error ? e.message : 'Unknown error');
      }
    })();
  }, []);

  const color =
    status === 'connected' ? 'var(--success)' :
    status === 'error' ? 'var(--error)' :
    status === 'not-configured' ? 'var(--warning)' :
    'var(--text-muted)';

  const label =
    status === 'checking' ? 'Checking…' :
    status === 'connected' ? 'Connected' :
    status === 'not-configured' ? 'Not configured' :
    'Connection failed';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface-0)',
      padding: 24,
    }}>
      <div style={{
        maxWidth: 480,
        width: '100%',
        padding: 32,
        borderRadius: 20,
        border: '1px solid var(--border-subtle)',
        background: 'var(--surface-1)',
      }}>
        <p style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>Supabase · 6a.1</p>
        <h1 style={{
          margin: '8px 0 0',
          fontSize: 22,
          fontWeight: 700,
          color,
        }}>{label}</h1>
        {detail && (
          <pre style={{
            marginTop: 16,
            padding: '10px 12px',
            borderRadius: 10,
            background: 'var(--surface-2)',
            fontSize: 11.5,
            color: 'var(--text-secondary)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>{detail}</pre>
        )}
      </div>
    </div>
  );
}
