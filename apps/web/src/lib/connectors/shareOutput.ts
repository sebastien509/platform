import { executeConnectorAction, type ConnectorActionResult } from './execute';
import type { ShareSnapshot } from '@/lib/share';

/* ------------------------------------------------------------
 Slack — mrkdwn summary. Title + first paragraph or callout,
 plus a guest-facing link when one is available.
 ------------------------------------------------------------ */
function snapshotToSlackText(
  snapshot: ShareSnapshot,
  shareUrl?: string
): string {
  const lines: string[] = [`*${snapshot.title}*`];

  const first = snapshot.sections.find(
    (s) => s.type === 'paragraph' || s.type === 'callout'
  );
  if (first && 'body' in first) {
    const body = first.body;
    lines.push(body.length > 300 ? body.slice(0, 297) + '…' : body);
  }

  if (shareUrl) {
    lines.push(`<${shareUrl}|Open in IV>`);
  }

  return lines.join('\n\n');
}

/* ------------------------------------------------------------
 Notion — full markdown. Every section type maps to a
 heading / bullet / code / quote.
 ------------------------------------------------------------ */
function snapshotToNotionMarkdown(snapshot: ShareSnapshot): string {
  const out: string[] = [`# ${snapshot.title}`];
  if (snapshot.kicker) out.push(`_${snapshot.kicker}_`);

  for (const s of snapshot.sections) {
    switch (s.type) {
      case 'paragraph':
        out.push(s.body);
        break;
      case 'callout':
        out.push(`> ${s.body}`);
        break;
      case 'code':
        out.push('```' + (s.language ?? '') + '\n' + s.code + '\n```');
        break;
      case 'list':
        for (const item of s.items) {
          out.push(
            `- **${item.title}**${item.body ? ` — ${item.body}` : ''}`
          );
        }
        break;
      case 'metrics':
        for (const m of s.items) {
          out.push(`- **${m.label}**: ${m.value}`);
        }
        break;
      case 'timeline':
        for (const t of s.items) {
          out.push(
            `- **${t.when}** · ${t.title}${t.body ? ` — ${t.body}` : ''}`
          );
        }
        break;
      case 'feature-grid':
        for (const item of s.items) {
          out.push(`- **${item.title}** — ${item.body}`);
        }
        break;
      case 'hero':
        if (s.subhead) out.push(s.subhead);
        break;
      default:
        break;
    }
  }

  return out.join('\n\n');
}

export interface ShareOutputInput {
  outputId: string;
  provider: 'slack' | 'notion';
  snapshot: ShareSnapshot;
  /** Guest-facing URL for the Slack message. */
  shareUrl?: string;
  /** Slack channel — defaults to '#general'. */
  channel?: string;
}

export async function shareOutput(
  input: ShareOutputInput
): Promise<ConnectorActionResult> {
  if (input.provider === 'slack') {
    const text = snapshotToSlackText(input.snapshot, input.shareUrl);
    return executeConnectorAction({
      provider: 'slack',
      action: 'post-message',
      outputId: input.outputId,
      payload: {
        channel: input.channel ?? '#general',
        text,
      },
    });
  }

  if (input.provider === 'notion') {
    const markdown = snapshotToNotionMarkdown(input.snapshot);
    return executeConnectorAction({
      provider: 'notion',
      action: 'create-page',
      outputId: input.outputId,
      payload: {
        title: input.snapshot.title,
        markdown,
      },
    });
  }

  return { ok: false, error: `Unknown provider: ${input.provider}` };
}
