# Glossary

Project-specific terms and their precise meanings in this codebase.

---

**Transport**
An instance of `DefaultChatTransport` (from `'ai'`) passed to `useChat`. Configured once via `useMemo` with `[]` deps in `ChatInterface`. Holds the endpoint URL (`/api/chat`) and a `body` callback that reads current model/effort/thinking values from refs. Never recreated after mount.

---

**Effort Level**
One of five presets controlling Claude's extended thinking budget:
- `low` → 1024 budgetTokens, temp 1.0
- `medium` → 3000 budgetTokens, temp 0.85
- `high` → 6000 budgetTokens, temp 0.7 (default)
- `xhigh` → 12000 budgetTokens, temp 0.4
- `max` → 24000 budgetTokens, temp 0.1
Effort controls both cost and reasoning depth.

---

**Thinking / Extended Thinking**
Claude's internal chain-of-thought reasoning. When `enableThinking` is true and the model supports it, Claude produces a `ReasoningUIPart` in the message stream before the text response. Shown as a collapsible "思考中..." block in `MessageItem`. Requires a model with `supportsThinking: true`.

---

**supportsThinking**
A boolean flag on each entry in the `MODELS` constant. `true` for Opus 4.6 and Sonnet 4.6; `false` for Haiku 4.5. When `false`, the thinking toggle is disabled and `enableThinking` is forced off in the API call.

---

**budgetTokens**
The maximum number of tokens Claude may use for internal reasoning (extended thinking). Set per effort level. Higher values allow deeper but costlier reasoning. Passed to the Anthropic provider via `providerOptions.anthropic.thinking.budgetTokens`.

---

**FileUIPart**
AI SDK type (`import type { FileUIPart } from 'ai'`). Represents an image attachment in a `UIMessage`. Has shape `{ type: 'file', mediaType: string, url: string }`. Used when building messages with image content.

---

**UIMessage**
AI SDK type (`import type { UIMessage } from 'ai'`). The message format used by `useChat`. Contains `id`, `role`, `parts` (array of `TextUIPart | ReasoningUIPart | FileUIPart | ...`), and `metadata`.

---

**useDarkMode**
Custom hook in `src/hooks/useDarkMode.ts`. Reads and controls dark mode via `document.documentElement.classList`. Uses `MutationObserver` so multiple components stay in sync without a shared store. Returns `{ isDark: boolean, toggle: () => void }`. The only correct way to access dark mode state in this codebase.

---

**useImageAttachments**
Custom hook in `src/hooks/useImageAttachments.ts`. Manages the lifecycle of image attachments (Blob URLs). Returns `{ attached: AttachedImage[], add: (files: File[]) => void, remove: (id: string) => void, clear: () => void }`. Handles `URL.createObjectURL` and `URL.revokeObjectURL` automatically.

---

**REMARK_PLUGINS**
Module-level constant in `MarkdownRenderer.tsx`. Array containing `[remarkGfm]`. Must be defined at module scope — never inside the component function — to prevent new array identity on every render.

---

**MD_COMPONENTS**
Module-level constant in `MarkdownRenderer.tsx`. Object mapping markdown element names to React components (e.g., `code` → `CodeBlock`). Must be defined at module scope for the same reason as `REMARK_PLUGINS`.

---

**ALLOWED_MODEL_IDS**
Server-side `Set<string>` in `/api/chat/route.ts` derived from `MODELS.map(m => m.id)`. Used to validate the `modelId` sent by the client. If the submitted ID is not in this set, the request is rejected with 400. Prevents arbitrary model injection.

---

**ACCESS_CODE**
The 4-digit login password. Stored only in `process.env.ACCESS_CODE`. Never imported in client-side files, never logged, never returned in API responses. Compared server-side in `/api/auth/verify/route.ts` after the rate limit check.

---

**COOKIE_SECRET**
32+ character secret used to sign and verify JWTs with HMAC-SHA256 (HS256 via `jose`). Stored only in `process.env.COOKIE_SECRET`. If this value changes, all existing cookies become invalid and all users are logged out.

---

**Auth Cookie**
HTTP-only cookie named `auth_session` (value of `AUTH_COOKIE_NAME` in `constants.ts`). Contains a signed JWT. Set on successful login, cleared on logout. Verified by `proxy.ts` middleware and by individual API route handlers. `SameSite=Lax`, `Secure` in production, max-age 30 days (2592000 seconds).

---

**Rate Limiter**
In-memory `Map` in `src/lib/auth/rate-limiter.ts` keyed by IP address. Tracks login attempt counts per IP. `checkRateLimit(ip)` returns `{ allowed: boolean, remaining: number }`. Checked before code comparison in `/api/auth/verify`. Not shared across Vercel function instances — each cold start gets a fresh Map.
