# Documentation Rules

Related: [architecture rules](./architecture.md)

## CLAUDE.md
Update `CLAUDE.md` whenever:
- A new architectural pattern is established (e.g., a new hook pattern, a new module)
- A new directory or layer is added to `src/`
- A dependency is added or removed that affects how Claude Code should work with the project
- A constraint changes (e.g., runtime requirement, environment variable added)

Do not update CLAUDE.md for individual bug fixes or feature additions that don't change patterns.

## Context Files
Significant architectural decisions must be recorded in context files:
- `context/patterns.md` — recurring implementation patterns (transport refs, module-level constants, etc.)
- `context/decisions.md` — why a specific approach was chosen over alternatives (e.g., why in-memory rate limiter, why `as const` on MODELS)

When you make a decision that a future developer might question ("why not use X instead?"), write a brief entry in `context/decisions.md`.

## Code Comments — WHY Only
Comments explain non-obvious constraints, invariants, or workarounds. They do not describe what the code does (the code does that):
```ts
// correct — explains a non-obvious requirement
// transport must never be recreated after mount; useChat ignores transport updates
const transport = useMemo(() => new HttpTransport(...), []);

// wrong — describes what the code already shows
// create the transport using useMemo
const transport = useMemo(() => new HttpTransport(...), []);
```

Add a comment when:
- An ESLint rule is disabled (`// eslint-disable-*` must always explain why)
- A runtime declaration is required (`export const runtime = 'nodejs'` — comment which dependency requires it)
- A non-obvious workaround is used (e.g., empty deps array with refs)
- A security constraint is enforced (e.g., rate limit before secret comparison)

## No JSDoc for Internal Functions
TypeScript types and interfaces serve as documentation for internal functions. Do not add JSDoc (`/** */`) to:
- Internal utility functions in `src/lib/`
- Hook implementations
- Component props interfaces

JSDoc is acceptable for public API boundaries if this project is ever extracted as a library (currently N/A).

## API Route Request/Response Types
Each route handler should have TypeScript types for the expected request body defined inline or imported:
```ts
// src/app/api/auth/verify/route.ts
interface VerifyRequestBody {
  code: string;
}
```
This type serves as the documentation for what the client must send.

## Environment Variables — .env.local.example
When adding a new environment variable:
1. Add it to `.env.local.example` with a placeholder value and a comment:
   ```
   # 4-digit access code for login
   ACCESS_CODE=1234

   # 32+ character secret for JWT HMAC-SHA256
   COOKIE_SECRET=change-me-in-production-must-be-32-chars

   # Anthropic API key from console.anthropic.com
   ANTHROPIC_API_KEY=sk-ant-...
   ```
2. Update `CLAUDE.md` Environment Variables section
3. Update `.claude/rules/` if the variable introduces a new constraint

Never commit `.env.local`. Only commit `.env.local.example`.
