# [PR Title]

## Summary
<!-- 1–3 sentences describing what this PR does and why.
     Focus on the "why", not line-by-line "what". -->

## Type
- [ ] feat     — new user-visible feature
- [ ] fix      — bug fix
- [ ] refactor — no behavior change, code quality improvement
- [ ] docs     — documentation / comment only
- [ ] chore    — build, deps, config, tooling

## Affected Files
<!-- List every file changed. Group by layer if more than ~5 files. -->

**Components (`src/components/`)**
-

**Hooks (`src/hooks/`)**
-

**API routes (`src/app/api/`)**
-

**Library / constants (`src/lib/`)**
-

**Other**
-

## Breaking Changes
- [ ] Yes — describe what breaks and how consumers must adapt: ___
- [ ] No

## Security Review
- [ ] Completed — no issues found
- [ ] Completed — issues found and addressed (describe below)
- [ ] Not needed — change does not touch auth, cookies, env vars, API routes, or user input

<!-- If security issues were found and addressed, describe them here -->

## Auth Changes
- [ ] Yes — describe what changed:
  - Cookie handling: ___
  - JWT logic (src/lib/auth/cookies.ts): ___
  - Rate limiter (src/lib/auth/rate-limiter.ts): ___
  - Middleware (src/proxy.ts): ___
  - Auth page (src/app/auth/page.tsx): ___
- [ ] No

## Test Plan
<!-- Manual steps to verify correctness. Be specific: which model, which effort level,
     what exact action, what you observe. -->
1.
2.
3.

## Screenshots
<!-- For any visible UI change, attach before/after screenshots.
     Include dark mode and light mode if the change affects styling.
     Delete this section if the change has no UI impact. -->

**Before:**

**After:**

## Checklist
<!-- See .claude/checklists/pr.md for the full checklist -->
- [ ] `pnpm run typecheck` passes (no TypeScript errors)
- [ ] `pnpm run lint` passes (no ESLint errors)
- [ ] `pnpm run build` succeeds
- [ ] No `process.env.ACCESS_CODE` or secrets exposed to client bundles
- [ ] `REMARK_PLUGINS` and `MD_COMPONENTS` remain module-level (not inside MarkdownRenderer)
- [ ] transport `useMemo` empty-dep ESLint disable is preserved if ChatInterface was modified
- [ ] Japanese UI labels preserved
- [ ] Dark mode tested (if UI change)
- [ ] New server-side inputs validated against ALLOWED_MODEL_IDS or equivalent
