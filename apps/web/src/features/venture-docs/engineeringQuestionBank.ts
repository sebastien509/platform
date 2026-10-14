import type {
  ArtifactProposal,
  IdeaJourney,
  VentureDocument,
  VentureDocCitation,
} from '@/lib/types';

export const ENGINEERING_THREADS = [
  {
    id: 'thread_architecture',
    kind: 'architecture',
    label: 'Architecture approach for MVP scope',
  },
  {
    id: 'thread_api',
    kind: 'api',
    label: 'API surface and integration points',
  },
  {
    id: 'thread_ui',
    kind: 'ui',
    label: 'Frontend and UI component needs',
  },
] as const;

export function buildEngineeringProposals(
  _journey: IdeaJourney,
  ventureName: string,
  sourceDocs: VentureDocument[]
): ArtifactProposal[] {
  const now = Date.now();
  const sourceCitations: VentureDocCitation[] = sourceDocs
    .filter((d) => d.isHeadline)
    .map((d) => ({
      docId: d.id,
      title: d.title,
      status: d.status,
      sourcePage: d.producedBy,
    }));

  const proposals: ArtifactProposal[] = [];

  /* ---- Architecture ---- */
  proposals.push({
    id: `prop_arch_${now}`,
    kind: 'architecture',
    title: 'Architecture Document',
    rationale: `Monolith-first. The MVP scope is narrow enough that a service split would cost more in coordination than it saves in scaling. Revisit only when a real bottleneck exists.`,
    proposedContent: `## Architecture — ${ventureName}

### Guiding constraint

Ship fast, keep optionality, avoid premature splits. The MVP has one user workflow — do not build for scenarios that assume a second one.

### Stack

- **Frontend:** single-page app, no SSR. Ship as static bundle.
- **Backend:** single service. One repo, one deploy.
- **Database:** single Postgres instance. No read replicas until measured need.
- **Queue:** none. Async work runs inline until it can't.

### What we're deliberately not building

- Microservices — no boundary is stable enough yet.
- Event bus — zero consumers today.
- Multi-tenant isolation — single-tenant is fine for the first 20 customers.
- Admin console — support by hand until volume justifies tooling.

### Revisit when

The first real bottleneck shows up — measured, not imagined.`,
    proposedSummary: 'Monolith-first: single service, single DB, no queue. Split only on measured pain.',
    citations: sourceCitations,
    status: 'pending',
  });

  /* ---- API Spec ---- */
  proposals.push({
    id: `prop_api_${now}`,
    kind: 'api_spec',
    title: 'API Specification',
    rationale: `REST over a small set of resources. Nothing exotic — the surface is small enough that a schema-first approach would cost more than it pays back.`,
    proposedContent: `## API Surface

### Resources

**Users** — \`GET /me\`, \`PATCH /me\`
**Core objects** — \`POST /objects\`, \`GET /objects/:id\`, \`LIST /objects\`
**Workflow** — \`POST /objects/:id/action\`, \`GET /objects/:id/status\`

### Auth

Bearer tokens. Issued on login, no refresh for MVP — 30-day expiry. Rework only if session length becomes a complaint.

### Error shape

\`{ error: { code, message, details } }\`. No exceptions.

### Pagination

Cursor-based. \`LIST\` returns \`{ items, nextCursor }\`. Skip offset pagination — it breaks at scale and has no benefit here.`,
    proposedSummary: 'REST, bearer auth, cursor pagination. Small surface, no schema-first overhead.',
    citations: sourceCitations,
    status: 'pending',
  });

  /* ---- UI Spec ---- */
  proposals.push({
    id: `prop_ui_${now}`,
    kind: 'ui_spec',
    title: 'UI and Frontend Spec',
    rationale: `Component list mapped to the P0 features. Every component traces to a named user action — none are decorative.`,
    proposedContent: `## Frontend Spec

### Routes

- \`/\` — the core workflow. Single page, no routing.
- \`/settings\` — account, integrations.
- \`/onboarding\` — first-run only.

### Components

| Component | Purpose |
|---|---|
| PrimaryAction | One dominant interaction per screen — no competing CTAs |
| InputRow | Bare underline, no bordered boxes |
| StatusBadge | State at a glance, never decorative |
| EmptyState | Warm orientation, never "No content yet" |
| FailureState | Calm recovery, never a red alarm |

### Style source

Reuse the platform design system. Do not invent new component shapes.

### Out of scope for MVP

- Dark mode toggle (auto by route only)
- Rich text editing
- Collaborative features
- Notifications panel`,
    proposedSummary: '5 core components, 3 routes. Reuses platform design system.',
    citations: sourceCitations,
    status: 'pending',
  });

  return proposals;
}
