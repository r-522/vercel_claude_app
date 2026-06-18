# Anti-Patterns

Patterns that look reasonable but are wrong in this codebase. Do not introduce these.

---

## LOCAL isDark STATE
**Never do this:**
```ts
// WRONG — breaks sync between ChatInterface and CodeBlock
const [isDark, setIsDark] = useState(
  document.documentElement.classList.contains('dark')
);
```
**Why**: Multiple components need dark mode state. Local state in each component diverges after the first toggle. CodeBlock and ChatInterface would show different themes.

**Do this instead**: `const { isDark, toggle } = useDarkMode();` — the hook uses a MutationObserver so all instances stay in sync with the DOM.

---

## TRANSPORT RECREATION
**Never do this:**
```ts
// WRONG — useChat ignores transport changes after mount
const transport = useMemo(() => new DefaultChatTransport({
  url: '/api/chat',
  body: () => ({ modelId: selectedModelId }),
}), [selectedModelId, selectedEffortId, enableThinking]);
```
**Why**: `useChat` from `@ai-sdk/react` captures the transport at mount and never reads it again. Adding these to the deps array creates dead transport instances on every selection change. Model/effort changes appear to work locally but the sent values never change.

**Do this instead**: Empty deps array `[]` with refs that are updated on every render. See `patterns.md → Transport + Refs Pattern`.

---

## CONSTANTS INSIDE COMPONENT
**Never do this:**
```ts
// WRONG — new reference every render, ReactMarkdown re-mounts all children
export function MarkdownRenderer({ content }: { content: string }) {
  const remarkPlugins = [remarkGfm]; // NEW ARRAY EVERY RENDER
  const components = { code: CodeBlock }; // NEW OBJECT EVERY RENDER
  return <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>...
```
**Why**: ReactMarkdown treats new array/object references as changed props. On every parent re-render (e.g., streaming updates), the entire markdown tree re-renders and CodeBlocks lose their copy-button state.

**Do this instead**: Define `REMARK_PLUGINS` and `MD_COMPONENTS` at module scope, above the component function.

---

## CLIENT SECRETS
**Never do this:**
```ts
// WRONG — process.env.ACCESS_CODE is inlined at build time and exposed
// in any 'use client' file or in constants.ts (which may be imported client-side)
export const ACCESS_CODE = process.env.ACCESS_CODE;

// Also WRONG — in any src/components/ or src/hooks/ file:
if (input === process.env.ACCESS_CODE) { ... }
```
**Why**: Next.js inlines `process.env.X` in client bundles unless the variable name starts with `NEXT_PUBLIC_`. `ACCESS_CODE` and `COOKIE_SECRET` would be shipped to every browser.

**Do this instead**: Use `process.env.ACCESS_CODE` only inside `src/app/api/` route handlers (server-only) and `src/lib/auth/` (server-only). Never import these in components, hooks, or `constants.ts`.

---

## SKIPPING AUTH DEFENSE IN DEPTH
**Never do this:**
```ts
// WRONG — relying on proxy.ts alone to protect API routes
export async function POST(request: Request) {
  // No auth check — "middleware handles it"
  const result = await streamText(...);
}
```
**Why**: Next.js middleware (`proxy.ts`) can be bypassed in certain edge cases (direct function invocation in tests, misconfigured matcher, middleware bugs). API routes that call the Anthropic API must also verify the cookie independently.

**Do this instead**: Always call `verifyAuthCookie(request)` at the top of protected route handlers.

---

## RATE-LIMIT SKIP
**Never do this:**
```ts
// WRONG — code comparison before rate limit check
export async function POST(request: Request) {
  const { code } = await request.json();
  if (code !== process.env.ACCESS_CODE) { // COMPARISON FIRST
    return Response.json({ error: 'Wrong code' }, { status: 401 });
  }
  const { allowed } = checkRateLimit(ip); // TOO LATE
```
**Why**: The comparison timing differs slightly between a match and a non-match. Running the comparison before the rate limit check enables timing-based attacks to enumerate the valid access code.

**Do this instead**: Call `checkRateLimit(ip)` and check `allowed` before any comparison. See `patterns.md → Rate Limit Pattern`.

---

## SPECIFIC AUTH ERRORS
**Never do this:**
```ts
// WRONG — tells attacker which specific condition failed
return Response.json({ error: 'Wrong access code' }, { status: 401 });
return Response.json({ error: 'Too many attempts, try again in 1 hour' }, { status: 429 });
return Response.json({ error: 'Invalid JWT token' }, { status: 401 });
```
**Why**: Specific messages allow enumeration. An attacker learns whether the code was wrong vs. rate limited, and learns the lockout policy.

**Do this instead**: Return a single constant generic error message from all failure paths. The HTTP status code (401 vs. 429) is acceptable.

---

## BLOB URL LEAK
**Never do this:**
```ts
// WRONG — Blob URL is never revoked, memory is leaked
const remove = (id: string) => {
  setAttached(prev => prev.filter(a => a.id !== id));
  // Missing: URL.revokeObjectURL(attachment.url)
};
```
**Why**: `URL.createObjectURL` creates a persistent reference in the browser's blob store. Without `revokeObjectURL`, images accumulate in memory for the lifetime of the page.

**Do this instead**: Always call `URL.revokeObjectURL(attachment.url)` before removing from state, and revoke all on unmount. Use the `useImageAttachments` hook which handles this correctly.

---

## MUTATION OBSERVER LEAK
**Never do this:**
```ts
// WRONG — observer runs forever after component unmounts
useEffect(() => {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true });
  // Missing cleanup return
}, []);
```
**Why**: The observer callback holds a closure over component state. After unmount, the observer continues firing and may call setState on an unmounted component.

**Do this instead**:
```ts
useEffect(() => {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true });
  return () => observer.disconnect(); // Always disconnect
}, []);
```

---

## IMPORT * SYNTAX-HIGHLIGHTER
**Never do this:**
```ts
// WRONG — imports all themes and languages, massively inflates bundle
import SyntaxHighlighter from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
```
**Why**: The default export and HLS styles bundle everything. The Prism ESM path enables tree-shaking.

**Do this instead**:
```ts
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
```
