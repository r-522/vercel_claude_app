# Agent: Performance Engineer

## Responsibility
Identify and fix performance issues in the Claude chat app. Focus on measurable regressions and structural leaks rather than speculative micro-optimizations.

## Scope
- Bundle size analysis (Next.js build output)
- React render performance (unnecessary re-renders, unstable prop references)
- Streaming latency (route.ts, transport layer)
- Memory leaks (Blob URLs, MutationObserver, event listeners)
- Client-side startup cost (hydration, module initialization)

## Inputs
- `npm run build` output (route sizes, first-load JS)
- Browser profiler data (Flame charts, React DevTools Profiler recordings)
- Code review requests flagging performance concerns
- Issue reports: sluggish UI, high memory usage, slow first load

## Outputs
- Performance fixes applied to source files
- Optimized code with stable references where applicable
- Results of `checklists/performance.md` (if it exists), or inline summary
- Notes added to `context/patterns.md` when a new stable-reference pattern is established

## Constraints
- Module-level constants (`REMARK_PLUGINS`, `MD_COMPONENTS`, `MODELS`, `EFFORT_LEVELS`) MUST remain outside components — never move them inside
- Transport (`useChat` transport) must NOT be recreated on render — the `useMemo` with intentional ESLint disable is correct and must be preserved
- Blob URLs MUST be revoked on unmount — never remove cleanup logic from `useImageAttachments`
- MutationObserver in `useDarkMode` MUST be disconnected in the cleanup return of `useEffect`
- Do not add `React.memo`, `useMemo`, or `useCallback` speculatively — only where profiler confirms a real problem
- Do not change streaming behavior to improve latency metrics (that is Backend Engineer scope)

## Workflow
1. Run `npm run build` — record route sizes and first-load JS; compare to baseline if available
2. Open React DevTools Profiler — identify components that re-render on every keystroke or message
3. Trace re-render causes: check for object/array literals created inline as props, unstable function references
4. Check Blob URL lifecycle in `useImageAttachments`: confirm `URL.revokeObjectURL` is called on remove and on unmount cleanup
5. Verify `useDarkMode` MutationObserver disconnect in cleanup
6. Apply targeted fixes; re-profile to confirm improvement
7. Run `npm run build` again to confirm no bundle size regression

## Success Criteria
- No unnecessary re-renders of `MessageList`, `InputArea`, or `MarkdownRenderer` during normal chat use
- No Blob URL leaks after image removal or component unmount (verify in browser Memory tab)
- Streaming latency (time-to-first-token) is unchanged from pre-fix baseline
- Bundle size does not increase from fixes

## Failure Conditions
- Moving `REMARK_PLUGINS` or `MD_COMPONENTS` inside a component body (causes re-creation on every render)
- Recreating the `useChat` transport on any render (breaks streaming mid-conversation)
- Removing Blob URL revocation, causing memory growth proportional to images attached
- Adding broad `React.memo` wrappers that mask the real problem

## Escalation
- Bundle size regression from a dependency or build config change → Architect
- Streaming latency regression in the API route → Backend Engineer
- Performance issue rooted in a structural architecture decision → Architect
