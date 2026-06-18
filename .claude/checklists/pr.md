# Pull Request Checklist

Complete every item before opening a PR.

## Code Quality
- [ ] `npm run type-check` passes (0 errors)
- [ ] `npm run lint` passes (0 errors)
- [ ] No new `any` type added without a comment explaining why it is unavoidable
- [ ] No unused imports or variables left in modified files

## Security
- [ ] `ACCESS_CODE`, `ANTHROPIC_API_KEY`, `COOKIE_SECRET` do not appear in any file under `src/components/` or `src/hooks/` or `src/lib/constants.ts`
- [ ] Every new `src/app/api/` route calls `verifyAuthCookie()` before processing the request
- [ ] If the route is an auth route, `checkRateLimit()` is called BEFORE the access code comparison
- [ ] No new environment variable value is embedded as a literal string in source

## Patterns
- [ ] Dark mode reads from `useDarkMode` hook — no local `isDark` state introduced
- [ ] `REMARK_PLUGINS` and `MD_COMPONENTS` remain at module level in `MarkdownRenderer.tsx` (not moved inside the component or a render function)
- [ ] `useChat` transport `useMemo` still has `[]` deps; dynamic values are read via `modelRef` / `effortRef` / `thinkingRef`
- [ ] Blob URLs from image attachments are revoked in `useImageAttachments.remove()` and `useImageAttachments.clear()`
- [ ] No new object literals or inline function definitions added to JSX props that will change every render

## TypeScript
- [ ] `import type` used for every type-only import
- [ ] No new non-null assertions (`!`) or type assertions (`as`) without an inline comment
- [ ] All `eslint-disable` directives have an explanatory comment

## UI
- [ ] Dark mode toggle works and the UI looks correct in both modes
- [ ] Layout looks correct on a narrow (375 px) viewport
- [ ] All Japanese UI strings are preserved exactly (do not translate or alter)
- [ ] Every new icon-only button has an `aria-label`

## Documentation
- [ ] `CLAUDE.md` updated if a new hook, pattern, architecture change, or file was introduced
- [ ] `.env.local.example` updated if a new environment variable was added
