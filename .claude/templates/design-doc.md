# Design Doc: [Title]

**Author:**
**Date:** YYYY-MM-DD
**Status:** draft | review | accepted | superseded

---

## Problem Statement
<!-- What problem is being solved? Include relevant user pain points and technical
     constraints. Describe the current state clearly. -->

## Goals
<!-- Numbered list of things this design must achieve. Keep to 3–6 items. -->
1.
2.
3.

## Non-Goals
<!-- Explicit list of things this design does NOT address, to prevent scope creep. -->
-

---

## Proposed Solution
<!-- High-level description of the approach. Explain the key insight or trade-off
     that makes this solution the right one. -->

## Architecture Diagram (ASCII)

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                    │
│                                                             │
│  ChatInterface                                              │
│  ├── ModelSettings (model/effort/thinking)                  │
│  ├── MessageList → MessageItem → MarkdownRenderer           │
│  │                               └── CodeBlock              │
│  └── InputArea (textarea + image attach)                    │
│                                                             │
│  Hooks: useDarkMode, useImageAttachments, useChat (ai SDK)  │
└────────────────────────┬────────────────────────────────────┘
                         │ POST /api/chat (JWT cookie)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Next.js / Vercel (Node.js runtime)                         │
│                                                             │
│  proxy.ts (Middleware) — verifies JWT, redirects /auth      │
│  api/chat/route.ts — streamText → Anthropic API             │
│  api/auth/verify/route.ts — rate-limit → code → JWT cookie  │
│  api/auth/logout/route.ts — clear cookie                    │
└─────────────────────────────────────────────────────────────┘
```

<!-- Replace or extend the diagram above to show your feature's additions.
     Use box-drawing characters: ┌ ┐ └ ┘ ─ │ ├ ┤ ┬ ┴ ┼ → ▼ -->

---

## Component Changes

| Component | Change Type | Description |
|-----------|-------------|-------------|
| | new / modified / deleted | |

## API Changes

| Endpoint | Change | Notes |
|----------|--------|-------|
| | new / modified / deleted | |

*If a new endpoint is added, write a full spec in `.claude/templates/api-spec.md`.*

---

## Security Considerations
<!-- Evaluate each of the following. Write "N/A" only with justification. -->

- **Auth / JWT:** Does this change touch cookie issuance, verification, or the middleware?
- **Secret exposure:** Any risk of `ACCESS_CODE`, `ANTHROPIC_API_KEY`, or `COOKIE_SECRET` reaching client bundles?
- **Input validation:** All server-side inputs validated? Model IDs checked against `ALLOWED_MODEL_IDS`?
- **Rate limiting:** Does a new unauthenticated endpoint need rate limiting?
- **XSS / injection:** Does this render any user-controlled HTML? Is `ReactMarkdown` the renderer?

## Performance Considerations
<!-- Evaluate each of the following. Write "N/A" only with justification. -->

- **Bundle size:** Does this add a new client-side dependency? Check bundle impact.
- **Streaming:** Does this affect the `streamText` pipeline or introduce blocking awaits?
- **Vercel cold starts:** Any new module-level side effects that slow cold start?
- **Re-render cost:** Any new state or props that could cause unnecessary re-renders in `MessageList`?

---

## Migration Plan
<!-- Steps to deploy this change safely.
     If no migration is needed (new feature, no data/config changes), write "None." -->

1.
2.

---

## Open Questions
<!-- Unresolved design questions. Each should eventually be answered and moved to Decision Log. -->
1.
2.

## Decision Log
<!-- Record decisions made during the design review. Date each entry. -->

| Date | Decision | Rationale |
|------|----------|-----------|
| | | |
