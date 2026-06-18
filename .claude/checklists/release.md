# Release Checklist

Complete every item before deploying to Vercel.

---

## Pre-Deploy (local)

- [ ] `npm run type-check` — 0 errors
- [ ] `npm run lint` — 0 errors
- [ ] `npm run build` — completes without error; inspect First Load JS sizes for regressions
- [ ] Security checklist (`checklists/security.md`) — all items pass
- [ ] `MODELS` array in `src/lib/constants.ts` reflects the latest Claude model IDs available on the Anthropic API

---

## Vercel Dashboard — Environment Variables

- [ ] `ANTHROPIC_API_KEY` is set and the key is valid (test with a quick API call if in doubt)
- [ ] `ACCESS_CODE` is set (minimum 4 characters)
- [ ] `COOKIE_SECRET` is set (minimum 32 characters, high entropy)
- [ ] `NODE_ENV` is `production` (Vercel sets this automatically — verify it has not been overridden)
- [ ] No environment variable has a trailing space or stray newline (common paste error)

---

## Vercel Deployment Settings

- [ ] Build command: `npm run build` (or Vercel default)
- [ ] Output directory: `.next`
- [ ] Node.js version matches local development version (v22.x)
- [ ] `src/proxy.ts` is recognised as Next.js Middleware (file path must be `src/middleware.ts` or `middleware.ts` — confirm filename matches project setup)

---

## Post-Deploy Smoke Test

Run against the production URL after deployment completes.

**Auth**
- [ ] `https://<your-domain>/` redirects to `/auth` when not logged in
- [ ] Entering the correct access code redirects to the chat page
- [ ] Entering a wrong access code shows an error message

**Chat**
- [ ] Send a short text message with **Haiku 4.5** — response streams in
- [ ] Streaming is visible character-by-character (not a single dumped response)
- [ ] Attach an image and send — assistant acknowledges the image

**UI**
- [ ] Dark mode toggle works; preference persists after a hard reload (`Ctrl+Shift+R`)
- [ ] "新しいセッション" button clears the chat history
- [ ] Sign-out button redirects to `/auth` and the session is cleared (navigating to `/` redirects back to `/auth`)

**Error paths**
- [ ] Submitting with an empty message does not send a request
- [ ] Attempting 10+ rapid logins triggers the rate limit message
