import { useState, useMemo } from 'react';
import {
  Mail,
  Users,
  Download,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  FlaskConical,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import { useDeliverablesStore } from '@/lib/deliverables';
import { useShareStore } from '@/lib/share';
import { useConnectors } from '@/lib/hooks/useConnectors';
import { getActionDef } from '@/features/venture-actions/page-actions';
import {
  sendGmail,
  parseRecipients,
  renderTemplate,
  type ParsedRecipient,
} from '@/lib/connectors/execute';
import type { OutputBlock } from '@/lib/types';
import type { EmailBatch } from '@/features/venture-actions/page-actions';

const SAMPLE_RECIPIENT: ParsedRecipient = {
  email: 'alex@hartllp.com',
  firstName: 'Alex',
  firmName: 'Hart LLP',
};

function batchToSnapshot(block: any, batch: EmailBatch, totalRecipients: number): any {
  return {
    title: block.title,
    kicker: `${totalRecipients} recipients · ${batch.segments.length} segment${
      batch.segments.length === 1 ? '' : 's'
    }`,
    sections: [
      {
        type: 'callout',
        id: 'summary',
        tone: 'ready',
        body: `Outbound batch prepared. ${totalRecipients} recipients across ${batch.segments.length} segment${batch.segments.length === 1 ? '' : 's'}.`,
      },
      {
        type: 'paragraph',
        id: 'subject',
        label: 'Subject template',
        body: batch.subjectTemplate,
      },
      {
        type: 'code',
        id: 'body-template',
        label: 'Body template',
        language: 'text',
        code: batch.bodyTemplate,
      },
      {
        type: 'list',
        id: 'segments',
        label: 'Segments',
        items: batch.segments.map((s) => ({
          title: s.name,
          body: `${s.size ?? '?'} recipients · ${s.filter ?? ''}`.trim(),
          meta: s.personalizationHint ?? null,
        })),
      },
    ],
  };
}

export function EmailBatchBlockView({ block }: { block: OutputBlock }) {
  const endRun = useAgentDrawerStore((s) => s.endRun);
  const closeDrawer = useAgentDrawerStore((s) => s.closeDrawer);
  const addDeliverable = useDeliverablesStore((s) => s.addDeliverable);

  const { connectors } = useConnectors();
  const gmail = connectors.find((c) => c.provider === 'gmail');
  const gmailConnected = gmail?.status === 'connected';

  const [openSegments, setOpenSegments] = useState<Record<string, boolean>>({});
  const [recipientsRaw, setRecipientsRaw] = useState('');
  const [recipientsOpen, setRecipientsOpen] = useState(false);
  const [mode, setMode] = useState<'review' | 'sending' | 'done' | 'error'>('review');
  const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0, failed: 0 });
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const rawBatch: EmailBatch | undefined = (block.payload as any)?.batch;
  if (!rawBatch) {
    return (
      <li className="agent-output-card agent-output-card--batch is-error">
        <AlertCircle className="h-3.5 w-3.5" />
        <p>Batch payload missing.</p>
      </li>
    );
  }
  const batch: EmailBatch = rawBatch;

  const recipients = useMemo(
    () => parseRecipients(recipientsRaw),
    [recipientsRaw]
  );

  const estimatedRecipients =
    batch.estimatedRecipients ??
    batch.segments.reduce((sum, s) => sum + (s.size ?? 0), 0);

  function toggleSegment(name: string) {
    setOpenSegments((v) => ({ ...v, [name]: !v[name] }));
  }

  function handleDownloadCsv() {
    const rows: string[][] = [
      ['segment', 'firstName', 'firmName', 'subject', 'body'],
    ];
    for (const seg of batch.segments) {
      const s: Record<string, string> = {
        firstName: 'Alex',
        firmName: 'Hart LLP',
        painPhrase: seg.personalizationHint ?? '',
      };
      const subj = batch.subjectTemplate.replace(
        /\{\{(\w+)\}\}/g,
        (_m, k) => s[k] ?? ''
      );
      const bod = batch.bodyTemplate.replace(
        /\{\{(\w+)\}\}/g,
        (_m, k) => s[k] ?? ''
      );
      rows.push([seg.name, 'Alex', 'Hart LLP', subj, bod]);
    }
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outbound-batch-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function sendOne(
    recipient: ParsedRecipient,
    opts: { subject: string; body: string }
  ) {
    const run = useAgentDrawerStore.getState().runs[block.runId];
    return sendGmail({
      to: recipient.email,
      subject: opts.subject,
      body: opts.body,
      opId: (run as any)?.opId,
      threadId: block.runId,
    });
  }

  async function handleSendTest() {
    if (!gmailConnected) {
      setResultMsg('Connect Gmail first.');
      setMode('error');
      return;
    }
    setMode('sending');
    setSendProgress({ sent: 0, total: 1, failed: 0 });
    setResultMsg(null);

    const subject = renderTemplate(
      batch.subjectTemplate,
      SAMPLE_RECIPIENT
    );
    const body = renderTemplate(batch.bodyTemplate, SAMPLE_RECIPIENT);

    /* Send test to the founder's own connected address — that's
       what `connectors.account_label` holds. */
    const to = gmail?.accountLabel ?? '';
    if (!to) {
      setMode('error');
      setResultMsg('Your Gmail account label is missing.');
      return;
    }

    const res = await sendOne(
      { email: to, firstName: 'You', firmName: 'Test' },
      { subject: `[TEST] ${subject}`, body }
    );

    if (res.ok) {
      setSendProgress({ sent: 1, total: 1, failed: 0 });
      setMode('done');
      setResultMsg(`Test sent to ${to}. Check your inbox.`);
    } else {
      setSendProgress({ sent: 0, total: 1, failed: 1 });
      setMode('error');
      setResultMsg(res.error ?? 'Send failed');
    }
  }

  async function handleSendBatch() {
    if (!gmailConnected) {
      setResultMsg('Connect Gmail first.');
      setMode('error');
      return;
    }
    if (recipients.length === 0) {
      setResultMsg('Add at least one recipient.');
      setMode('error');
      return;
    }

    setMode('sending');
    setSendProgress({ sent: 0, total: recipients.length, failed: 0 });
    setResultMsg(null);

    let sent = 0;
    let failed = 0;

    for (const r of recipients) {
      const subject = renderTemplate(batch.subjectTemplate, r);
      const body = renderTemplate(batch.bodyTemplate, r);
      const res = await sendOne(r, { subject, body });
      if (res.ok) sent += 1;
      else failed += 1;
      setSendProgress({ sent, total: recipients.length, failed });

      /* Small spacing — Gmail API is fine with bursts but a 300ms
         gap keeps us well under the per-second quota. */
      await new Promise((r) => setTimeout(r, 300));
    }

    /* Persist the deliverable. Same shape as before. */
    persistDeliverable();

    setMode(failed === 0 ? 'done' : sent > 0 ? 'done' : 'error');
    setResultMsg(
      failed === 0
        ? `Sent ${sent} of ${sent}.`
        : `Sent ${sent} of ${sent + failed} · ${failed} failed.`
    );

    /* Auto-close the drawer after a clean run. */
    if (sent > 0) {
      setTimeout(() => {
        endRun(block.runId, 'done');
        closeDrawer();
      }, 1800);
    }
  }

  function persistDeliverable() {
    const run = useAgentDrawerStore.getState().runs[block.runId];
    const opId = (run as any)?.opId ?? block.title;
    const pageId = run?.page ?? 'strategy';
    const ventureId = run?.ventureId ?? '';
    const def = getActionDef(opId);
    const renderType = def?.renderType ?? 'operational';
    const tier = def?.tier ?? 'secondary';

    const snapshot = batchToSnapshot(
      block,
      batch,
      recipients.length || estimatedRecipients
    );

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

  /* ─── SENDING / DONE state ─── */
  if (mode === 'sending' || mode === 'done' || mode === 'error') {
    return (
      <li className="agent-output-card agent-output-card--batch">
        <div className="agent-output-card__top">
          <span className="agent-output-card__kind">
            <Send className="h-2.5 w-2.5" />
            {mode === 'sending' ? 'Sending' : mode === 'done' ? 'Sent' : 'Failed'}
          </span>
        </div>

        <p className="agent-output-card__title">{block.title}</p>

        <div className="agent-batch__progress">
          <div className="agent-batch__progress-bar">
            <div
              className="agent-batch__progress-fill"
              style={{
                width:
                  sendProgress.total > 0
                    ? `${(sendProgress.sent / sendProgress.total) * 100}%`
                    : '0%',
              }}
            />
          </div>
          <span className="agent-batch__progress-count">
            {sendProgress.sent} / {sendProgress.total}
            {sendProgress.failed > 0 && (
              <span className="agent-batch__progress-failed">
                · {sendProgress.failed} failed
              </span>
            )}
          </span>
        </div>

        {mode === 'sending' && (
          <p className="agent-batch__status-line">
            <Loader2 className="h-3 w-3 animate-spin" />
            Sending through Gmail…
          </p>
        )}

        {resultMsg && (
          <p
            className={cn(
              'agent-batch__status-line',
              mode === 'done' && 'is-success',
              mode === 'error' && 'is-error'
            )}
          >
            {mode === 'done' && <CheckCircle2 className="h-3 w-3" />}
            {mode === 'error' && <AlertCircle className="h-3 w-3" />}
            {resultMsg}
          </p>
        )}

        {mode !== 'sending' && (
          <div className="agent-batch__actions">
            <button
              type="button"
              className="agent-batch__btn is-secondary"
              onClick={() => {
                setMode('review');
                setResultMsg(null);
                setSendProgress({ sent: 0, total: 0, failed: 0 });
              }}
            >
              Back
            </button>
            <button
              type="button"
              className="agent-batch__btn is-primary"
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

  /* ─── REVIEW state ─── */
  return (
    <li className="agent-output-card agent-output-card--batch">
      <div className="agent-output-card__top">
        <span className="agent-output-card__kind">
          <Mail className="h-2.5 w-2.5" />
          Outbound
        </span>
        <span
          className={cn(
            'agent-output-card__status',
            `agent-output-card__status--${block.status}`
          )}
        >
          {block.status.replace('_', ' ')}
        </span>
      </div>

      <p className="agent-output-card__title">{block.title}</p>
      <span className="agent-output-card__destination">
        {block.destination}
      </span>

      {/* Connection status */}
      {!gmailConnected && (
        <div className="agent-batch__connect-note">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>
            Connect Gmail on <strong>Connectors</strong> to send.
          </span>
        </div>
      )}

      {/* Recipients input */}
      <div className="agent-batch__recipients">
        <button
          type="button"
          className="agent-batch__recipients-toggle"
          onClick={() => setRecipientsOpen((v) => !v)}
        >
          {recipientsOpen ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <Users className="h-3.5 w-3.5" />
          <span className="agent-batch__recipients-label">
            Recipients
          </span>
          <span className="agent-batch__recipients-count">
            {recipients.length > 0
              ? `${recipients.length} ready`
              : `${estimatedRecipients} estimated`}
          </span>
        </button>

        {recipientsOpen && (
          <div className="agent-batch__recipients-body">
            <textarea
              className="agent-batch__recipients-input"
              placeholder={`One per line:\nemail@firm.com\nor: email@firm.com, Alex, Hart LLP`}
              rows={5}
              value={recipientsRaw}
              onChange={(e) => setRecipientsRaw(e.target.value)}
            />
            <p className="agent-batch__recipients-hint">
              Format: <code>email</code>, or <code>email, firstName, firmName</code>. Duplicates removed.
            </p>
          </div>
        )}
      </div>

      {/* Template + segments */}
      <div className="agent-batch__template">
        <span className="agent-batch__template-label">Template</span>
        <p className="agent-batch__subject">{batch.subjectTemplate}</p>
        <p className="agent-batch__body-preview">
          {batch.bodyTemplate.slice(0, 160)}
          {batch.bodyTemplate.length > 160 ? '…' : ''}
        </p>
      </div>

      <div className="agent-batch__segments">
        <span className="agent-batch__segments-label">Segments</span>
        {batch.segments.map((seg) => {
          const isOpen = openSegments[seg.name];
          const vars: Record<string, string> = {
            firstName: 'Alex',
            firmName: 'Hart LLP',
            painPhrase: seg.personalizationHint ?? '',
          };
          const subj = batch.subjectTemplate.replace(
            /\{\{(\w+)\}\}/g,
            (_m, k) => vars[k] ?? ''
          );
          const bod = batch.bodyTemplate.replace(
            /\{\{(\w+)\}\}/g,
            (_m, k) => vars[k] ?? ''
          );
          return (
            <div key={seg.name} className="agent-batch__segment">
              <button
                type="button"
                className="agent-batch__segment-head"
                onClick={() => toggleSegment(seg.name)}
              >
                {isOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                <span className="agent-batch__segment-name">{seg.name}</span>
                {seg.size != null && (
                  <span className="agent-batch__segment-size">{seg.size}</span>
                )}
                {seg.filter && (
                  <span className="agent-batch__segment-filter">
                    {seg.filter}
                  </span>
                )}
              </button>
              {isOpen && (
                <div className="agent-batch__segment-preview">
                  <p className="agent-batch__segment-subject">
                    Subject: {subj}
                  </p>
                  <pre className="agent-batch__segment-body">{bod}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="agent-batch__actions agent-batch__actions--three">
        <button
          type="button"
          className="agent-batch__btn is-secondary"
          onClick={handleDownloadCsv}
        >
          <Download className="h-3 w-3" />
          CSV
        </button>
        <button
          type="button"
          className="agent-batch__btn is-secondary"
          onClick={handleSendTest}
          disabled={!gmailConnected}
          title="Send one test email to your own inbox"
        >
          <FlaskConical className="h-3 w-3" />
          Send test
        </button>
        <button
          type="button"
          className="agent-batch__btn is-primary"
          onClick={handleSendBatch}
          disabled={!gmailConnected || recipients.length === 0}
        >
          <CheckCircle2 className="h-3 w-3" />
          Send {recipients.length > 0 ? recipients.length : ''}
        </button>
      </div>
    </li>
  );
}
