/* ============================================================
   SHARE SYSTEM — TYPES
   ============================================================ */

export type SurfaceId =
  /* ── Documents — editorial briefs in the side drawer ── */
  | 'strategy.brief'
  | 'product.docs'
  | 'engineering.docs'
  | 'gtm.plan'
  | 'campaigns.docs'
  | 'sales.docs'
  | 'sales.proposal'
  | 'growth.plan'
  | 'funding.docs'
  /* ── Decks — full-screen slide viewers ── */
  | 'strategy.deck'
  | 'funding.deck'
  /* ── Code — mono split-view drawer ── */
  | 'engineering.code'
  /* ── HTML artifacts — iframe containers ── */
  | 'product.landing'
  | 'engineering.ui-spec'
  | 'campaigns.email'
  /* ── Sheets — tabular grid ── */
  | 'funding.sheet'
  /* ── Action — connector confirm cards ── */
  | 'action.confirm'
  /* ── Legacy — kept so existing outputs still resolve ── */
  | 'gtm.landing'
  | 'campaigns.landing'
  | 'product.prototype';

export interface ShareLink {
  id: string;
  surfaceId: SurfaceId;
  ventureId: string;
  snapshot: ShareSnapshot;
  createdAt: string;
  createdBy: string;
  label?: string;
  commentsEnabled: boolean;
  expiresAt?: string | null;
}

export interface ShareSnapshot {
  title: string;
  kicker?: string;
  sections: ShareSection[];
}

/* ---------- Sections — every surface composes from these ---------- */

export type ShareSection =
  | { type: 'paragraph'; id: string; label?: string; body: string }
  | { type: 'metrics'; id: string; label?: string; items: Array<{ label: string; value: string; delta?: string; trend?: 'up' | 'down' | 'flat' }> }
  | { type: 'list'; id: string; label?: string; items: Array<{ title: string; body?: string; meta?: string }> }
  | { type: 'callout'; id: string; label?: string; tone: 'default' | 'attention' | 'ready'; body: string }
  | { type: 'code'; id: string; label?: string; language?: string; code: string }
  | { type: 'timeline'; id: string; label?: string; items: Array<{ when: string; title: string; body?: string; status?: string }> }
  | { type: 'hero'; id: string; eyebrow?: string; headline: string; subhead?: string; cta?: { label: string; href?: string }; secondaryCta?: { label: string; href?: string } }
  | { type: 'feature-grid'; id: string; label?: string; items: Array<{ title: string; body: string }> }
  | { type: 'pricing'; id: string; label?: string; tiers: Array<{ name: string; price: string; cadence?: string; features: string[]; highlighted?: boolean }> }
  | { type: 'embed'; id: string; label?: string; html: string; aspect?: 'auto' | 'square' | 'video' }
  | { type: 'terms'; id: string; label?: string; items: Array<{ label: string; body: string }> };

export interface ShareComment {
  id: string;
  /** The share link the comment came through. */
  linkId: string;
  /** The output the comment is anchored to. Comments survive
   *  when the founder shares v2 — they stick to the deliverable. */
  outputId?: string;
  /** Anchor to a section within the output — enables inline
   *  comments on a specific paragraph, metric, or list item. */
  sectionId?: string;
  /** Optional section label for display — "ICP", "Wedge", etc. */
  sectionLabel?: string;
  /** Author display name. 'Guest' when no user is signed in. */
  author: string;
  /** Null for guest authors. Set for authed team members. */
  authorId?: string | null;
  body: string;
  createdAt: string;
  /** ISO timestamp when the founder marked the comment as read. */
  readAt?: string;
  /** True when the founder marked the comment as resolved. */
  resolved?: boolean;
}
