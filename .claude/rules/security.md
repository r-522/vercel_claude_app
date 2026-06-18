# Security Rules

Related: [backend rules](./backend.md), [api rules](./api.md)

## Secrets — Never Expose to Client
These values must NEVER appear in client-side code, `constants.ts`, or any module imported by client components:
- `ACCESS_CODE` — the 4-digit login code
- `COOKIE_SECRET` — the JWT HMAC-SHA256 signing key
- `ANTHROPIC_API_KEY` — the API key

Detection: if any of these strings are accessed as exported constants (not via `process.env` inline in a server file), it is a blocking issue. See [review rules](./review.md) for the grep check.

## Rate Limiting Order
Rate limiting must run BEFORE any secret comparison. The current order in `api/auth/verify/route.ts`:
1. `checkRateLimit(ip)` — if not allowed, return 429 immediately
2. Parse request body
3. Read `process.env.ACCESS_CODE`
4. Compare codes with constant-time comparison (or standard equality if timing is not a concern at this scale)

Never reorder steps 1–4. Comparing secrets before rate limiting leaks timing information.

## Generic Auth Error Messages
All authentication failures return the same response body to prevent user enumeration:
```ts
// wrong
if (rateLimited) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
if (!codeMatch) return NextResponse.json({ error: 'Wrong code' }, { status: 401 });

// correct — 429 for rate limit is fine (standard HTTP), but auth failures get the same message
if (!codeMatch) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```
Rate limit 429 responses are acceptable — they do not reveal code correctness.

## JWT Requirements
- Algorithm: HS256 only — verify the algorithm is not `none` or RS256
- Verify on every protected request — never cache or skip verification
- Use `jose` library — do not implement JWT verification manually
- Cookie name comes from `AUTH_COOKIE_NAME` constant

## Cookie Attributes
Auth cookies must be set with all of:
```
HttpOnly   — prevents JS access (XSS protection)
SameSite=Lax — CSRF baseline protection
Secure     — HTTPS only (set conditionally: process.env.NODE_ENV === 'production')
Max-Age    — use COOKIE_MAX_AGE constant; never use Expires with a past date to clear
```

## File Uploads (Image Attachments)
When processing image attachments in the chat API:
- Validate `mediaType` against an allowlist: only `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Do not accept `image/svg+xml` — SVGs can contain scripts
- Reject any non-`image/` MIME type
- File size limits are enforced client-side via `useImageAttachments` — also enforce server-side

## XSS Prevention
- Never use `dangerouslySetInnerHTML`
- User-generated content rendered as markdown goes through `ReactMarkdown` — this is the sanitization layer
- `MarkdownRenderer.tsx` uses `react-markdown` which does not render raw HTML by default
- Do not add `rehype-raw` plugin — it would re-enable HTML injection

## CSRF Protection
`SameSite=Lax` on the auth cookie provides baseline CSRF protection:
- State-changing requests (`/api/chat`, `/api/auth/*`) are `POST` — `Lax` blocks cross-site POSTs
- No additional CSRF token is needed for this architecture (single-origin app, no sensitive GET mutations)

## Dependency Security
- Review AI SDK (`@ai-sdk/anthropic`, `ai`) updates carefully — they process user input and make external requests
- `jose` is the JWT library — do not add a second JWT library
- Run `npm audit` before adding new dependencies
