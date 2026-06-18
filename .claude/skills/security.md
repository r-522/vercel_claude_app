# Skill: Security Review

Use this workflow when reviewing changes for security issues, or doing a periodic security audit.

## 1. Secrets Audit

Search for environment variable names in client-accessible files.

**MUST NOT appear in these directories:**
- `src/components/`
- `src/hooks/`
- Any file with `'use client'`
- `src/lib/constants.ts`

**Specifically check for:**
- `process.env.ACCESS_CODE` — login code, server-only
- `process.env.COOKIE_SECRET` — JWT signing key, server-only
- `process.env.ANTHROPIC_API_KEY` — API key, server-only

**Allowed locations:**
- `src/app/api/` — all API routes (server-side)
- `src/lib/auth/cookies.ts` — JWT sign/verify
- `src/lib/auth/rate-limiter.ts` — rate limiting
- `src/proxy.ts` — middleware (server-side)

If any secret reference appears in a client file, it will be included in the browser bundle. This is a critical vulnerability.

## 2. Auth Flow Review

Verify the exact order in `src/app/api/auth/verify/route.ts`:

1. **Rate limit check FIRST** — `checkRateLimit(ip)` before anything else
   - If rate limited: return 429 immediately — do NOT compare the code
   - This prevents timing attacks where the comparison time leaks information
2. **Constant-time comparison** — code comparison must not short-circuit
   - Verify the comparison does not use `===` on the raw strings if timing matters
   - Ideal: use `timingSafeEqual` from Node.js `crypto` module
3. **JWT sign** — only after successful comparison
4. **Cookie set** — response includes `Set-Cookie` with the signed JWT

Verify `src/proxy.ts` middleware:
- [ ] `/auth` route excluded from JWT verification
- [ ] `/api/auth/verify` excluded from JWT verification
- [ ] `/api/auth/logout` excluded from JWT verification
- [ ] All other routes require valid JWT

## 3. Cookie Security Check

Verify `src/lib/auth/cookies.ts` `buildCookieHeader()` output includes:

- [ ] `HttpOnly` — prevents JavaScript access to cookie
- [ ] `SameSite=Lax` — prevents CSRF from cross-site requests
- [ ] `Secure` in production — cookie only sent over HTTPS
- [ ] `Path=/` — cookie sent to all routes
- [ ] `Max-Age` set to `COOKIE_MAX_AGE` from `src/lib/constants.ts`

JWT algorithm: must be `HS256` (symmetric, using `COOKIE_SECRET`).
`COOKIE_SECRET` must be 32+ characters — shorter secrets are weak for HMAC-SHA256.

## 4. Input Validation Check

For every API route that reads a request body:

- [ ] Parse body with try/catch — malformed JSON should return 400
- [ ] Validate required fields exist before use
- [ ] Validate `modelId` against `ALLOWED_MODEL_IDS` — never pass unsanitized model ID to Anthropic SDK
- [ ] Validate `effortId` against `EFFORT_LEVELS.map(e => e.id)` if used server-side
- [ ] Image data: validate MIME type is an image type before processing

`ALLOWED_MODEL_IDS` is derived from `MODELS` in `src/lib/constants.ts`. If MODELS changes, ALLOWED_MODEL_IDS updates automatically — verify this derivation exists in `src/app/api/chat/route.ts`.

## 5. ESLint Security Patterns

Run:
```
npx next lint
```

Look for:
- Unused variables that could be leftover debug code
- Any `// eslint-disable` comment — read it and verify the reason is legitimate
  - The one in `ChatInterface.tsx` on transport useMemo deps is intentional and documented

## 6. Client-Side Data Exposure Check

Verify nothing sensitive is passed to client components as props or stored in client state:
- Auth tokens: never in React state — only in HttpOnly cookies
- Access code: never sent to client — only compared server-side
- API key: never anywhere in client code

## 7. Rate Limiter Limitations (Known)

`src/lib/auth/rate-limiter.ts` uses an in-memory Map. Document the known limitation:
- Rate limit state resets on Vercel cold start / function instance restart
- Not shared across Vercel function instances
- An attacker with multiple IPs could bypass it entirely

This is acceptable for a personal-use app. If this becomes a concern, replace with an external store (Redis, KV).

## 8. After Security Review

For any finding:
- Critical (secret exposure, auth bypass): fix immediately before any deployment
- High (missing validation, cookie flag): fix before next release
- Medium (timing, rate limit gap): document as known limitation or fix in next sprint
- Low (style, defense-in-depth): log as improvement

Run after fixes:
```
npx tsc --noEmit
npx next lint
npm run build
```
