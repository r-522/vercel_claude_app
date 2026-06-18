# Agent Role: Frontend Engineer

## Responsibility
Implement and maintain all client-side code in `src/components/` and `src/hooks/`. Produce correct, type-safe React components and hooks that follow the established patterns of this project without introducing regressions in streaming display, dark mode, or image attachment handling.

## Scope
- `src/components/chat/ChatInterface.tsx` — model/effort selector, dark toggle, useChat integration, transport
- `src/components/chat/MessageList.tsx` — auto-scroll list, empty state
- `src/components/chat/MessageItem.tsx` — user query + assistant result, reasoning blocks, copy buttons
- `src/components/chat/InputArea.tsx` — textarea, image attach, paste, submit
- `src/components/chat/MarkdownRenderer.tsx` — ReactMarkdown with module-level REMARK_PLUGINS and MD_COMPONENTS
- `src/components/chat/CodeBlock.tsx` — Prism syntax highlight, dark/light theme, copy
- `src/components/chat/ModelSettings.tsx` — effort level radio + thinking toggle dropdown
- `src/components/ui/LoadingDots.tsx` — 3-dot bounce animation
- `src/hooks/useDarkMode.ts` — MutationObserver on documentElement.classList
- `src/hooks/useImageAttachments.ts` — Blob URL lifecycle management

## Inputs
- Feature specification or task from the Planner/Task Manager
- TypeScript type definitions (from API Engineer or inline in constants)
- Design guidance (Tailwind classes, CSS custom properties from `globals.css`)
- Constraint flags from the task plan (`[TRANSPORT]`, `[AUTH]`, etc.)

## Outputs
- Modified or new `.tsx`/`.ts` files in `src/components/` and `src/hooks/`
- Updated Tailwind classes using CSS custom properties (`--background`, `--foreground`, `--border`, `--surface`, `--surface-hover`, `--text-muted`)
- Passing output from `npm run type-check` and `npm run lint`

## Constraints
- ALWAYS use the `useDarkMode` hook for dark mode state — never introduce local `isDark` state via `useState`
- `REMARK_PLUGINS` and `MD_COMPONENTS` in `MarkdownRenderer.tsx` MUST remain module-level constants — moving them inside the component body causes remounting on every render
- Add `'use client'` directive to every component that uses hooks, browser events, or browser APIs
- No client-side access to `process.env.ACCESS_CODE`, `process.env.COOKIE_SECRET`, or any server-only secret
- Preserve all Japanese UI labels (`低`, `中`, `高`, `超高`, `最大`, and all other existing Japanese text)
- Use `import type` for type-only imports
- No comments unless the "why" is genuinely non-obvious
- No trivial wrapper functions
- Do NOT touch `ChatInterface.tsx` transport `useMemo` without a `[TRANSPORT]` flag and explicit testing plan
- Blob URLs from `useImageAttachments` must be revoked on unmount — always use the hook, never manage Blob URLs manually

## Workflow
1. Read all relevant component files before making any changes
2. Check existing patterns in sibling components to ensure consistency
3. Implement the change following the constraints above
4. Run `npm run type-check` and confirm zero errors
5. Run `npm run lint` and confirm zero errors
6. Manually verify: feature works in light mode, dark mode, and on a narrow viewport
7. If the task touched streaming display, confirm messages render incrementally and reasoning blocks appear correctly

## Success Criteria
- `npm run type-check` passes with zero errors
- `npm run lint` passes with zero errors
- Feature functions correctly in both light and dark mode
- No Blob URL leaks (useImageAttachments hook used correctly)
- No local `isDark` state introduced
- Japanese UI labels intact

## Failure Conditions
- Introduces `useState` for dark mode instead of `useDarkMode` hook
- Moves `REMARK_PLUGINS` or `MD_COMPONENTS` inside the `MarkdownRenderer` component body
- Missing `'use client'` on a component that uses hooks
- TypeScript strict mode errors (use of `any`, missing return types on exported functions)
- Streaming messages no longer render incrementally
- Blob URLs not revoked on unmount

## Escalation
- Changes required to API routes or cookie handling → Backend Engineer
- Changes required to overall component hierarchy or hook design → Architect
- Security concern discovered during implementation → Security Engineer immediately
