# Established Code Patterns

Patterns used throughout the codebase. Follow these when adding features.

---

## Transport + Refs Pattern
Create transport once with empty deps; keep fresh values in refs for the body callback.

```ts
// In ChatInterface.tsx
const modelRef = useRef(selectedModelId);
const effortRef = useRef(selectedEffortId);
const thinkingRef = useRef(enableThinking);

// Update refs on every render so transport closure always sees current values
modelRef.current = selectedModelId;
effortRef.current = selectedEffortId;
thinkingRef.current = enableThinking;

// eslint-disable-next-line react-hooks/exhaustive-deps
const transport = useMemo(() => new DefaultChatTransport({
  url: '/api/chat',
  body: () => ({
    modelId: modelRef.current,
    effortId: effortRef.current,
    enableThinking: thinkingRef.current,
  }),
}), []);
```

---

## useDarkMode Hook Usage
Always use the hook; never maintain local isDark state.

```ts
import { useDarkMode } from '@/hooks/useDarkMode';

// In any component that needs dark mode
const { isDark, toggle } = useDarkMode();
```

---

## useImageAttachments Hook Usage
```ts
import { useImageAttachments } from '@/hooks/useImageAttachments';

const { attached, add, remove, clear } = useImageAttachments();

// Add from file input or paste
add(Array.from(event.target.files ?? []));

// Remove one by id
remove(attachment.id);

// Clear all (e.g., after sending)
clear();

// Use in message
const fileParts = attached.map(a => ({
  type: 'file' as const,
  mediaType: a.file.type,
  url: a.url,
}));
```

---

## Module-Level Constants Pattern
For any array or object passed as a prop to a memoized component.

```ts
// MarkdownRenderer.tsx — TOP OF FILE, outside the component

import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

const REMARK_PLUGINS = [remarkGfm];

const MD_COMPONENTS = {
  code({ node, className, children, ...props }) {
    // ...
    return <CodeBlock language={language}>{String(children)}</CodeBlock>;
  },
};

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={MD_COMPONENTS}>
      {content}
    </ReactMarkdown>
  );
}
```

---

## Auth Verification Pattern in API Routes
Every API route that requires authentication verifies the cookie directly (not relying solely on middleware).

```ts
// In any protected route handler
import { verifyAuthCookie } from '@/lib/auth/cookies';

export async function POST(request: Request) {
  const verified = await verifyAuthCookie(request);
  if (!verified) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ... rest of handler
}
```

---

## Rate Limit Pattern
Check rate limit BEFORE doing any comparison that could leak timing information.

```ts
import { checkRateLimit } from '@/lib/auth/rate-limiter';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return Response.json({ error: GENERIC_ERROR }, { status: 429 });
  }

  const { code } = await request.json();
  if (code !== process.env.ACCESS_CODE) {
    return Response.json({ error: GENERIC_ERROR }, { status: 401 });
  }
  // ...
}
```

---

## Class Concatenation Pattern
Use array join for conditional classes — no `classnames` library.

```ts
const buttonClass = [
  'px-3 py-1 rounded text-sm',
  isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black',
  isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80',
].join(' ');
```

---

## Copy Button Pattern
2-second visual feedback; no external library.

```ts
const [copied, setCopied] = useState(false);

const handleCopy = async () => {
  await navigator.clipboard.writeText(text);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};

// In JSX
<button onClick={handleCopy}>
  {copied ? 'コピー済み' : 'コピー'}
</button>
```

---

## Thinking Block Pattern
Collapsible; auto-expanded while streaming, collapsed when done.

```ts
// In MessageItem.tsx
const [thinkingOpen, setThinkingOpen] = useState(isStreaming);

// Auto-expand when streaming starts
useEffect(() => {
  if (isStreaming) setThinkingOpen(true);
}, [isStreaming]);

// Render for ReasoningUIPart
{part.type === 'reasoning' && (
  <div className="thinking-block">
    <button onClick={() => setThinkingOpen(o => !o)}>
      思考中... {thinkingOpen ? '▲' : '▼'}
    </button>
    {thinkingOpen && <div className="thinking-content">{part.reasoning}</div>}
  </div>
)}
```

---

## Streaming Cursor Pattern
Inline-block cursor element shown only while actively streaming.

```ts
// After the last text content in MessageItem
{activelyStreaming && (
  <span className="inline-block w-2 h-4 bg-current animate-pulse ml-0.5" />
)}
```

`activelyStreaming` is true when the message is the last in the list AND `status === 'streaming'` from `useChat`.
