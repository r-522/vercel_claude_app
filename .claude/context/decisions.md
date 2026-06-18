# Architectural Decisions Log

Decisions that are non-obvious, look like bugs, or will be revisited later.

---

## 2026-06-18: Transport created once via useMemo with [] deps

**Decision**: `DefaultChatTransport` is instantiated in a `useMemo(() => new DefaultChatTransport(...), [])` with an empty dependency array. An `eslint-disable` comment suppresses the exhaustive-deps warning.

**Reason**: `useChat` from `@ai-sdk/react` captures the transport reference at mount time and does not react to transport prop changes after that. If `selectedModelId`, `selectedEffortId`, or `enableThinking` were added to the deps array, a new transport would be created on every selection change — but `useChat` would continue using the original. The new transports would be dead objects.

**Mechanism**: Refs (`modelRef`, `effortRef`, `thinkingRef`) are updated on every render. The transport's `body` callback is a closure over these refs, so it always reads the *current* values at send time without requiring transport recreation.

**Do not change**: Adding state values to useMemo deps is a silent no-op that makes the code misleading. The eslint-disable comment is intentional.

---

## 2026-06-18: useDarkMode hook extracted

**Decision**: Dark mode reading/toggling was extracted into `src/hooks/useDarkMode.ts` using a MutationObserver on `document.documentElement.classList`.

**Reason**: Both `ChatInterface` and `CodeBlock` need to know the current dark mode state. If each held its own `useState`, toggling in one component would not update the other. The DOM's classList is the single source of truth; the MutationObserver lets multiple hook instances react to the same change without a Context or global store.

**Alternatives considered**: React Context (adds boilerplate and a provider), Zustand (heavyweight for this use case).

---

## 2026-06-18: useImageAttachments hook extracted from InputArea

**Decision**: Image attachment state and Blob URL lifecycle management moved to `src/hooks/useImageAttachments.ts`.

**Reason**: Blob URL management (`URL.createObjectURL` / `URL.revokeObjectURL`) is complex enough to be error-prone inline. Encapsulating it in a hook ensures cleanup happens correctly on remove, clear, and unmount, without requiring `InputArea` to track all the details.

---

## 2026-06-18: REMARK_PLUGINS and MD_COMPONENTS moved to module level

**Decision**: `const REMARK_PLUGINS = [remarkGfm]` and `const MD_COMPONENTS = { code: CodeBlock, ... }` are defined at the top of `MarkdownRenderer.tsx`, outside the component function.

**Reason**: `ReactMarkdown` performs deep equality checks on `remarkPlugins` and `components` props. When these were defined inside the component function body, React created a new array/object reference on every render. This caused ReactMarkdown to re-render the entire markdown tree (and re-mount all CodeBlocks) on every parent render, even when the content hadn't changed. Moving them to module scope makes the references stable.

---

## 2026-06-18: getAppName function removed from constants.ts

**Decision**: A `getAppName(family: string): string` utility was removed. The family name is now inlined directly where needed (`selectedModel?.family`).

**Reason**: The function was only called in one place in `ChatInterface`. A function that has a single call site and does no meaningful transformation is a trivial wrapper. Inlining reduces indirection with no readability cost.

---

## Design: Rate limit check BEFORE code comparison

**Decision**: In `/api/auth/verify/route.ts`, `checkRateLimit(ip)` is called and checked for `allowed` before the ACCESS_CODE comparison ever runs.

**Reason**: If code comparison ran first, an attacker could measure response timing differences between "wrong code" (fast: comparison fails) and "rate limited" (slightly different timing). Running the rate limit check first ensures that all responses after the limit is hit take the same code path, preventing timing-based enumeration of the valid code.

---

## Design: Generic error messages from /api/auth/verify

**Decision**: The endpoint always returns the same error message (`GENERIC_ERROR` constant, e.g. "Invalid credentials") regardless of whether the failure was a wrong code, missing code, rate limit, or server error.

**Reason**: Specific messages ("Wrong code", "Too many attempts") allow attackers to distinguish states. Generic messages prevent enumeration attacks.

---

## Design: In-memory rate limiter (accepted limitation)

**Decision**: The rate limiter uses a `Map` in module scope with no Redis or external store.

**Reason**: Simplicity. Adding Redis or a KV store would require additional infrastructure and env vars for a single-user app. The accepted trade-off: on Vercel, multiple function instances may exist simultaneously, each with its own Map. An attacker with access to multiple IPs (or hitting different instances) could exceed the intended limit. This is acceptable for the current threat model (protecting a personal tool with a 4-digit code from casual brute force, not from a determined attacker with distributed infrastructure).

**Revisit if**: The app becomes public-facing or the ACCESS_CODE becomes higher-value.
