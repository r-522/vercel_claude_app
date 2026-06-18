# Code Review: [PR / Change Title]

**Reviewer:**
**Date:** YYYY-MM-DD
**PR / Commit:**

---

## Overall Verdict
- [ ] Approve — ready to merge
- [ ] Request changes — must address required items before merge
- [ ] Block — critical issue; do not merge until resolved

---

## Security Findings

| Severity | File | Line | Description | Recommendation |
|----------|------|------|-------------|----------------|
| | | | | |

*Severity: critical / high / medium / low / info*

**Key things to check:**
- `process.env.ACCESS_CODE` or other secrets referenced in client components or `constants.ts`
- JWT signing/verification logic in `src/lib/auth/cookies.ts`
- Rate limit checked before code comparison in `src/app/api/auth/verify/route.ts`
- New `process.env` variables that must not reach client bundles
- Model ID validated against `ALLOWED_MODEL_IDS` on every chat request
- HTTP-only, SameSite=Lax, Secure-in-production cookie attributes preserved

---

## Pattern Violations

<!-- Flag deviations from established project patterns (see .claude/rules/). -->

| File | Issue | Rule Reference |
|------|-------|---------------|
| | | |

**Common violations to check:**
- `REMARK_PLUGINS` or `MD_COMPONENTS` defined inside `MarkdownRenderer` component body
- `useDarkMode` pattern bypassed; local `isDark` state used instead
- `useImageAttachments` pattern bypassed; manual Blob URL management
- Transport `useMemo` empty-dep ESLint disable removed or "fixed"
- New per-request state added to component state rather than `useRef`
- `'use client'` directive missing on a client component
- Type-only import written as value import (missing `import type`)
- Comments added explaining obvious code (project convention: only comment non-obvious WHY)

---

## TypeScript Issues

| File | Line | Issue |
|------|------|-------|
| | | |

---

## Performance Issues

| File | Description | Impact |
|------|-------------|--------|
| | | |

**Things to check:**
- New React components that should be memoised but are not
- Large modules imported in client bundles that should be server-only
- Inline object/array literals passed as stable-identity props to memoised children

---

## Positive Observations
<!-- Highlight good decisions, clean abstractions, or nice patterns worth calling out. -->
-

---

## Required Changes
<!-- Must be addressed before this PR can merge. -->
1.
2.

## Optional Suggestions
<!-- Nice-to-have improvements; reviewer preference, not blockers. -->
1.
2.
