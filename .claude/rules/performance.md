# Performance Rules

Related: [react rules](./react.md), [architecture rules](./architecture.md)

## Stable Object References Per Render
Never create objects, arrays, or functions inside a component body if they are constant:

```tsx
// wrong — new array on every render, breaks ReactMarkdown memoization
function MarkdownRenderer({ content }: Props) {
  const plugins = [remarkGfm]; // new reference every render
  return <ReactMarkdown remarkPlugins={plugins}>{content}</ReactMarkdown>;
}

// correct — single reference for the module's lifetime
const REMARK_PLUGINS = [remarkGfm];
function MarkdownRenderer({ content }: Props) {
  return <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>{content}</ReactMarkdown>;
}
```

This applies to `REMARK_PLUGINS`, `MD_COMPONENTS`, `ACCEPT_TYPES`, and any other value that does not depend on props or state.

## Blob URL Lifecycle
Blob URLs created by `URL.createObjectURL()` must be revoked when no longer needed. The `useImageAttachments` hook handles this automatically — always use it instead of managing Blob URLs manually:
```ts
// useImageAttachments.ts (reference implementation)
useEffect(() => {
  return () => {
    attached.forEach(f => URL.revokeObjectURL(f.previewUrl)); // cleanup on unmount
  };
}, []);
```
If a new hook creates Blob URLs, follow the same pattern: revoke all URLs in the `useEffect` cleanup.

## MutationObserver Cleanup
The `useDarkMode` hook connects a `MutationObserver` to `documentElement`. Always disconnect in the cleanup:
```ts
useEffect(() => {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributeFilter: ['class'] });
  return () => observer.disconnect(); // required
}, []);
```
Failing to disconnect leaks the observer across component remounts (especially visible in React StrictMode dev double-invoke).

## Streaming
Always use `streamText` and return the stream immediately via `toUIMessageStreamResponse()`. Never await the full completion:
```ts
// correct — first tokens arrive in ~200ms
const result = streamText({ model, messages });
return result.toUIMessageStreamResponse();

// wrong — user waits for entire completion before seeing anything
const result = await generateText({ model, messages });
return NextResponse.json({ text: result.text });
```

## Chat Images
Images attached to chat messages must use constrained dimensions to prevent layout shift:
```tsx
<img
  src={attachment.url}
  alt=""
  className="max-h-48 max-w-xs rounded object-contain"
/>
```
Always set both `max-h` and `max-w`. Never use unconstrained `<img>` in the message list.

## react-syntax-highlighter Imports
Import only the specific Prism styles needed, not the entire stylesheet bundle:
```ts
// correct — only imports one theme (~5KB)
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// wrong — imports all styles
import styles from 'react-syntax-highlighter/dist/esm/styles/prism';
```

## Re-render Budget
The `MessageList` component renders all messages. For long conversations, avoid:
- Computing derived values inside `MessageList` that depend on all messages (O(n) per render)
- Passing new object references as props to each `MessageItem` on every keystroke in `InputArea`

If performance degrades with long conversations, memoize individual `MessageItem` renders with `React.memo`.
