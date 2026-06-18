# Security Checklist

Run before every release. All items must pass.

---

## Secrets — must not appear in source

- [ ] `grep -r 'ANTHROPIC_API_KEY' src/` — zero matches (value must only be referenced via `process.env`)
- [ ] `grep -r 'ACCESS_CODE' src/` — zero matches outside of `src/app/api/auth/verify/route.ts` and `src/lib/constants.ts` (where only the name, never the value, appears)
- [ ] `grep -r 'COOKIE_SECRET' src/` — zero matches outside of `src/lib/auth/cookies.ts`
- [ ] `.env.local` is in `.gitignore` and is not committed

---

## API Route Authentication

- [ ] `src/app/api/chat/route.ts` calls `verifyAuthCookie()` before calling `streamText`
- [ ] Every other route under `src/app/api/` (if any) calls `verifyAuthCookie()` before processing
- [ ] `src/proxy.ts` (Next.js Middleware) verifies JWT on all routes except `/auth`

---

## Auth Route — Rate Limiting & Timing

- [ ] `src/app/api/auth/verify/route.ts`: `checkRateLimit(ip)` is called and checked BEFORE the access code string comparison
- [ ] On rate-limit rejection the response is returned immediately without reaching the code comparison
- [ ] Error message on wrong code does not hint at whether the code was "close" or how many digits were wrong

---

## Cookie Security

- [ ] `buildCookieHeader` in `src/lib/auth/cookies.ts` includes `HttpOnly`
- [ ] `buildCookieHeader` includes `SameSite=Lax`
- [ ] `buildCookieHeader` includes `Max-Age` set to `COOKIE_MAX_AGE`
- [ ] `buildCookieHeader` includes `Path=/`
- [ ] `buildCookieHeader` adds `Secure` when `NODE_ENV === 'production'`
- [ ] `buildClearCookieHeader` sets `Max-Age=0` to expire the cookie immediately

---

## JWT

- [ ] `jwtVerify` in `verifyAuthCookie` has `algorithms: ['HS256']` locked (not omitted or set to `*`)
- [ ] JWT secret is derived from `process.env.COOKIE_SECRET` (never hardcoded)

---

## Input Validation

- [ ] Model ID from client request is validated against `ALLOWED_MODEL_IDS` in `src/app/api/chat/route.ts` before being passed to `streamText`
- [ ] File type of image attachments is validated as `image/*` before processing
- [ ] Unrecognised model ID returns a 400 response (not silently substituted)

---

## Dependency Surface

- [ ] `npm audit` — no critical or high severity vulnerabilities (or each is acknowledged with a reason)
