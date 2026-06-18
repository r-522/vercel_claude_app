# React Rules

Related: [architecture rules](./architecture.md), [frontend rules](./frontend.md)

## `use client` Directive
Add `'use client'` at the top of any file that:
- Uses React hooks (`useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`, `useContext`)
- Attaches event handlers (`onClick`, `onSubmit`, `onChange`, etc.)
- Uses browser APIs (`window`, `document`, `navigator`)

Do NOT add `'use client'` to server components, API routes, middleware, or pure utility files.

## Component Structure (enforced order)
```tsx
'use client'; // if needed

// imports

export function MyComponent(props: Props) {
  // 1. hooks (useState, useRef, useMemo, custom hooks)
  // 2. derived state (const x = someValue ?? default)
  // 3. useEffect (side effects only, not derived state)
  // 4. event handlers (handle*, on*)
  // 5. JSX return
}
```

## No `useEffect` for Derived State
Derived values must be computed inline or with `useMemo`, not synchronized via `useEffect + setState`:
```tsx
// wrong
const [fullName, setFullName] = useState('');
useEffect(() => setFullName(`${first} ${last}`), [first, last]);

// correct
const fullName = `${first} ${last}`;
// or if expensive:
const fullName = useMemo(() => expensiveFormat(first, last), [first, last]);
```

## Stable References — Module-Level vs `useMemo`
For values that never change based on props or state, declare them at module level:
```tsx
// correct — defined once per module load
const REMARK_PLUGINS = [remarkGfm];
const MD_COMPONENTS = { code: CodeBlock, ... };

// wrong — recreated every render
function MarkdownRenderer() {
  const plugins = [remarkGfm]; // new array each render
}
```
Use `useMemo` only when the value depends on component props/state.

## Custom Hooks
Extract logic to a custom hook when:
- The same stateful logic appears in 2+ components
- A `useEffect` + related state is 5+ lines
- Side-effect cleanup is required (MutationObserver, Blob URL lifecycle)

Follow the `useDarkMode` / `useImageAttachments` pattern:
- Hook lives in `src/hooks/`
- Returns a typed object (not a tuple for multiple values)
- Exports its return-type interface from [typescript rules](./typescript.md)

## Keys
- Always use a stable, unique identifier: `message.id`, `model.id`, `previewUrl`
- Never use array index as key unless the list is static and never reordered
- Prefix keys with a namespace if IDs could collide: `msg-${message.id}`

## `useCallback`
Only wrap handlers in `useCallback` when the handler is passed as a prop to a `React.memo`-wrapped child. For handlers only used in the same component's JSX, `useCallback` is unnecessary overhead.

## Avoid Object/Array Literals in JSX Props
```tsx
// wrong — new object reference every render, breaks memoization
<Component style={{ color: 'red' }} items={['a', 'b']} />

// correct — stable references
const STYLE = { color: 'red' } as const;
const ITEMS = ['a', 'b'] as const;
<Component style={STYLE} items={ITEMS} />
```
Exception: objects derived from component state/props cannot be hoisted.

## Transport Pattern (useChat-specific)
The `useChat` transport must be created with `useMemo(() => ..., [])` — empty deps array. Dynamic values (model, effort, thinking) must flow through `useRef` so the closure over the transport captures the ref, not the stale value. See [architecture rules](./architecture.md) for the full pattern.

ESLint will warn about the empty deps array on this specific `useMemo`. The disable comment is intentional:
```ts
// eslint-disable-next-line react-hooks/exhaustive-deps
const transport = useMemo(() => new HttpTransport({ ... }), []);
```
