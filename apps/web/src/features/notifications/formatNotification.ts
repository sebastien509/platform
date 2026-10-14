import { pageFromOp } from '@/lib/notifications/opPageMap';

/**
 * formatNotification — turns a structured event payload into
 * the user-facing sentence, href, and icon.
 *
 * Routing priority:
 *   1. meta.page_id (captured at write time)
 *   2. Derive from meta.op_id via OP_TO_PAGE
 *   3. Fall back to /ventures/{id} (Overview)
 */

export type NotificationIconType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'decision';

export interface NotificationMeta {
  action?: string;
  target_title?: string | null;
  target_type?: string;
  target_id?: string;
  version?: number;
  new_version?: number;
  body_preview?: string;
  page_id?: string | null;
  op_id?: string | null;
  email?: string;
  role?: string;
  icon_type?: NotificationIconType;
}

export interface FormatInput {
  meta: NotificationMeta | null | undefined;
  title: string;
  description: string | null;
  actor_name: string | null;
  icon_type: NotificationIconType;
  venture_id?: string | null;
  href?: string | null;
}

export interface FormattedNotification {
  title: string;
  description?: string;
  href: string | null;
  icon_type: NotificationIconType;
}

export function formatNotification(
  input: FormatInput,
): FormattedNotification {
  const m = input.meta ?? {};
  const actor = input.actor_name ?? 'Someone';

  let title = input.title || 'New activity';
  let description: string | undefined = input.description ?? undefined;

  switch (m.action) {
    case 'validated':
      title = `${actor} validated ${m.target_title ?? 'an output'}`;
      description = m.version ? `v${m.version} is now live` : undefined;
      break;
    case 'superseded':
      title = `${m.target_title ?? 'An output'} v${m.version ?? '?'} was superseded`;
      description =
        m.new_version != null
          ? `v${m.new_version} is now the active version`
          : 'A newer version is now active';
      break;
    case 'commented':
      title = `${actor} commented on ${m.target_title ?? 'a deliverable'}`;
      description = m.body_preview || undefined;
      break;
    case 'resolved':
      title = `${actor} resolved a comment`;
      description = m.body_preview || undefined;
      break;
    case 'joined':
      title = `${actor} joined your team`;
      description = m.email || undefined;
      break;
    case 'role_changed':
      title = `Your role changed to ${m.role ?? 'a new role'}`;
      break;
  }

  /* ── Routing ──
   * Pages are URL segments: /ventures/{id}/{page}
   *   - /ventures/{id}           → overview
   *   - /ventures/{id}/strategy  → strategy
   *   - /ventures/{id}/product   → product
   * Deep-link hints (deliverable, tab) ride as query params.
   */
  let href: string | null = input.href ?? null;
  const ventureId = input.venture_id;

  if (ventureId) {
    /* Priority:
     *   1. meta.page_id  — captured at write time
     *   2. op_id prefix  — `strategy.define-icp` → `strategy`
     *   3. null          — venture home
     */
    const explicitPage = m.page_id?.trim() || null;
    const derivedPage = explicitPage ?? pageFromOp(m.op_id);
    const page =
      derivedPage && derivedPage !== 'overview' ? derivedPage : null;

    href = page
      ? `/ventures/${ventureId}/${page}`
      : `/ventures/${ventureId}`;

    const params = new URLSearchParams();
    if (m.target_id) params.set('deliverable', m.target_id);
    if (m.action === 'commented' || m.action === 'resolved') {
      params.set('tab', 'comments');
    }
    const qs = params.toString();
    if (qs) href += `?${qs}`;
  }

  return {
    title,
    description,
    href,
    icon_type: m.icon_type ?? input.icon_type,
  };
}
