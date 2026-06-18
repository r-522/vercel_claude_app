# Skill: Code Review

Use this checklist when reviewing any change to the Claude AI Chat App.

## Security Checklist

- [ ] No `process.env.ACCESS_CODE` or `process.env.COOKIE_SECRET` referenced in any file under `src/components/`, `src/hooks/`, or client-side `src/lib/` (only allowed in `src/app/api/` and `src/lib/auth/`)
- [ ] No API key or secret hardcoded as a string literal anywhere
- [ ] Auth verification in every protected API route — check for the JWT cookie verification block before any logic runs
- [ ] Rate limit called BEFORE access code comparison in `src/app/api/auth/verify/route.ts` — prevents timing attacks
- [ ] User-supplied `modelId` validated against `ALLOWED_MODEL_IDS` on the server before being passed to the Anthropic SDK
- [ ] No user input passed directly to system prompt or model instructions without sanitization

## Pattern Checklist

**Transport pattern (`src/components/chat/ChatInterface.tsx`)**
- [ ] `transport` created inside `useMemo` exactly once — no re-creation on state change
- [ ] ESLint disable on transport `useMemo` deps is intentional — do not remove
- [ ] Model, effort, thinking state accessed via refs (`modelRef.current`, `effortRef.current`, `thinkingRef.current`) inside the fetch closure — never direct state
- [ ] Refs updated in `useEffect` or event handlers whenever the corresponding state changes

**Dark mode**
- [ ] New components use `useDarkMode()` from `@/hooks/useDarkMode` — not local state, not `document.documentElement.classList`
- [ ] `layout.tsx` inline script untouched unless intentionally changing dark mode initialization

**Blob URLs / image attachments**
- [ ] `URL.createObjectURL` always paired with `URL.revokeObjectURL`
- [ ] `useImageAttachments` hook used for image state — not custom local state
- [ ] `clear()` called on submit or unmount to revoke all URLs

**MarkdownRenderer**
- [ ] `REMARK_PLUGINS` and `MD_COMPONENTS` are module-level constants — not inside the component function

## TypeScript Checklist

- [ ] No `any` types (explicit or implicit via missing annotation)
- [ ] No unsafe `as Type` casts — should be type narrowing instead
- [ ] `import type` used for type-only imports
- [ ] No `@ts-ignore` without explanation
- [ ] Return types on exported functions

## Performance Checklist

- [ ] No object/array literals created inside JSX attributes (use module-level or `useMemo`)
- [ ] No function created in JSX without `useCallback` (if passed as prop to memoized child)
- [ ] `useCallback` used for callbacks passed to child components
- [ ] No expensive computation inside render without `useMemo`
- [ ] Module-level constants used for stable values (regex, plugin arrays, component maps)

## Coding Convention Checklist

- [ ] `'use client'` present on all components that use hooks or browser APIs
- [ ] No comments added for obvious code — only non-obvious WHY
- [ ] Japanese UI labels preserved (`低`, `中`, `高`, `超高`, `最大`)
- [ ] No error handling added for scenarios that cannot occur
- [ ] No trivial wrapper functions (single-use, no added logic)

## How to Give Feedback

- State the specific file and line/pattern
- Reference the rule from the checklist or `src/lib/constants.ts` / existing code
- Suggest the concrete fix, not just the problem
- Distinguish blocking issues (security, correctness) from suggestions (style, performance)

Example:
> `src/components/chat/NewFeature.tsx` line 12: `isDark` local state should be replaced with `const { isDark } = useDarkMode()` from `@/hooks/useDarkMode`. Local state will not react to system dark mode changes.
