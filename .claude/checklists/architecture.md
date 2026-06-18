# Architecture Checklist

Run before implementing any significant change. Catching violations here is cheaper than fixing them after the code is written.

---

## State & Hooks

- [ ] Change does not introduce local `isDark` / `setIsDark` state — dark mode must go through `useDarkMode` hook
- [ ] Change does not recreate the `useChat` transport — `useMemo([], ...)` with `[]` deps is intentional; dynamic values are threaded through refs
- [ ] Any new custom hook follows the same pattern as `useDarkMode` and `useImageAttachments`: subscriptions/timers/observers are created in `useEffect` and cleaned up in its return function
- [ ] New module-level constants are truly static — they do not close over component props, state, or runtime-computed values

---

## Server / Client Boundary

- [ ] Client components have `'use client'` at the top of the file
- [ ] No server-only logic (env var access, `jose`, `rate-limiter`) is imported into client components
- [ ] Any new client-controlled parameter sent to `api/chat` or `api/auth` is validated on the server (allowlist or schema check) before use
- [ ] New environment variables are read from `process.env` on the server only — never passed to the client through `NEXT_PUBLIC_` unless the value is intentionally public

---

## Security Constraints

- [ ] `ACCESS_CODE` is consumed only in `src/app/api/auth/verify/route.ts` via `process.env`
- [ ] `checkRateLimit` placement preserved: called before code comparison in the auth verify route
- [ ] `verifyAuthCookie` added to every new API route that should be protected

---

## Documentation & Decision Records

- [ ] New environment variables are added to `.env.local.example` with a description
- [ ] `CLAUDE.md` updated if a new hook, utility, route, or architectural pattern is introduced
- [ ] `context/architecture.md` updated to reflect the change (new component, moved logic, changed data flow)
- [ ] If the decision will constrain future work (e.g., transport pattern, module-level constants, in-memory rate limiter), an Architecture Decision Record is written using `templates/architecture-decision.md` and referenced in `context/decisions.md`

---

## Conventions

- [ ] New files follow the existing directory structure (`hooks/`, `lib/auth/`, `components/chat/`, `components/ui/`)
- [ ] No comments added to explain WHAT the code does — only WHY if the reason is non-obvious
- [ ] No trivial wrapper functions introduced (prefer direct calls)
- [ ] `import type` used for type-only imports in all new files
