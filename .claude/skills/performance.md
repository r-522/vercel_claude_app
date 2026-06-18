# Skill: Performance Optimization

Use this workflow to identify and fix performance issues in the Claude AI Chat App.

## 1. Identify Unnecessary Re-renders

**Look for object/array creation in JSX or component body:**

Search for patterns where objects are created on every render:
```
// BAD — new object every render, breaks memoization
<Component style={{ color: 'red' }} />
<Markdown remarkPlugins={[remarkGfm]} />

// GOOD — stable reference
const STYLE = { color: 'red' }
const REMARK_PLUGINS = [remarkGfm]
<Component style={STYLE} />
<Markdown remarkPlugins={REMARK_PLUGINS} />
```

Files to audit:
- `src/components/chat/MarkdownRenderer.tsx` — `remarkPlugins` and `components` must be module-level
- `src/components/chat/MessageItem.tsx` — check for inline object props
- `src/components/chat/ChatInterface.tsx` — check callbacks passed to children

**How to check:** Read each component file. Look for `[`, `{`, or `() =>` directly inside JSX attributes or as props.

## 2. Blob URL Audit

Blob URLs hold memory until explicitly revoked. Audit `src/hooks/useImageAttachments.ts`:

- [ ] `URL.createObjectURL()` called only once per file (not on each render)
- [ ] `URL.revokeObjectURL()` called in `remove()` for individual removal
- [ ] `URL.revokeObjectURL()` called for ALL URLs in `clear()`
- [ ] `useEffect` cleanup in any component using `useImageAttachments` calls `clear()` on unmount
- [ ] Blob URLs not stored in multiple places (single source of truth in the hook)

If a URL is created but not revoked, memory grows with every image attached during a session.

## 3. Module-Level Constant Audit

Search all files under `src/components/` for:
- Arrays defined inside a component function (not a hook call result)
- Plain objects defined inside a component function used as props
- Regex defined inside a component function

These should all be at module level. Exceptions:
- Values that depend on props or state (must stay inside the component)
- Values returned from hooks (managed by the hook)

## 4. Bundle Size Check

```
npm run build
```

Check the terminal output for:
- Route sizes (`.js` chunks) — flag any chunk over 100 kB gzipped
- First-load JS shared by all routes
- `react-syntax-highlighter` is the largest dependency — it is already imported in `src/components/chat/CodeBlock.tsx`; verify no duplicate imports

If a new large library was added, check if it can be dynamically imported:
```ts
// In a component, lazy-load heavy libs
const HeavyComponent = dynamic(() => import('./HeavyComponent'), { ssr: false })
```

## 5. Streaming Latency Investigation

If chat responses feel slow to start:

1. Check `src/app/api/chat/route.ts`:
   - `export const runtime = 'nodejs'` must be present — without it, Edge runtime adds latency and may not stream
   - No `await` before `streamText` that adds unnecessary delay

2. Check Anthropic API response headers in Network tab:
   - Time to first byte (TTFB) reflects Anthropic model latency — nothing to optimize here
   - If TTFB > 5s, consider switching to a faster model (Haiku vs Opus)

3. Check `src/components/chat/ChatInterface.tsx` transport:
   - Transport `useMemo` should have no async setup — fetch must start immediately
   - No blocking operations before the POST request is sent

## 6. Dark Mode Initialization Performance

The dark mode script in `src/app/layout.tsx` runs synchronously before React hydration. It must be minimal — a single `localStorage.getItem` and a class toggle. No network requests, no complex logic.

## 7. Verification After Optimization

```
npm run build
npx tsc --noEmit
npx next lint
```

Manual check:
- [ ] Chat streaming still works end-to-end
- [ ] Images still attach and clear correctly
- [ ] Dark mode still works (toggle + reload persistence)
- [ ] No new console warnings about re-renders or effect loops
