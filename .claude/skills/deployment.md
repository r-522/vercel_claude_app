# Skill: Deployment to Vercel

Use this workflow for every deployment of the Claude AI Chat App.

## Pre-Deploy Checklist

### 1. Environment Variables in Vercel Dashboard

Go to: Vercel dashboard > project > Settings > Environment Variables

Verify all three are set for **Production** (and Preview if used):
- [ ] `ANTHROPIC_API_KEY` — must start with `sk-ant-`
- [ ] `ACCESS_CODE` — 4-digit numeric code for login
- [ ] `COOKIE_SECRET` — must be 32+ characters (shorter = weak JWT signing key)

To check `COOKIE_SECRET` length: count characters carefully. 32 chars minimum for HMAC-SHA256.

### 2. Local Build Verification

Run locally before pushing:
```
npx tsc --noEmit
npx next lint
npm run build
```

All must pass with zero errors. Fix any errors before deploying.

### 3. No Debug Code

Search for leftover debug logging:
- `console.log` in `src/app/api/` routes
- Hardcoded test values in `src/lib/constants.ts`
- Temporary `// TODO` or `// DEBUG` comments

## Deploy

Vercel deploys automatically on push to the connected branch (typically `main`).

```
git push origin main
```

Alternatively, deploy manually from Vercel dashboard > Deployments > Deploy.

## Post-Deploy Verification

After deployment completes (2-3 minutes typically), test the live URL:

### Login
- [ ] Navigate to `/auth`
- [ ] Enter the 4-digit `ACCESS_CODE`
- [ ] Should redirect to `/` (home/chat page)
- [ ] Auth cookie should be set (DevTools > Application > Cookies)

### Chat / Streaming
- [ ] Type a message and submit
- [ ] Response should stream in progressively (not appear all at once)
- [ ] Model selector works — switch to Sonnet, send a message, verify in Vercel logs it used the correct model
- [ ] Effort level selector works

### Image Attach
- [ ] Click the image attach button or paste an image
- [ ] Image preview appears in input area
- [ ] Send message with image — model should reference the image content

### Dark Mode
- [ ] Toggle dark mode — switches immediately
- [ ] Reload page — dark mode preference persists
- [ ] No flash of wrong mode on initial load

### Auth Persistence
- [ ] After successful test, reload — should stay logged in (not redirect to /auth)
- [ ] Cookie `Max-Age` means session persists for `COOKIE_MAX_AGE` seconds (check `src/lib/constants.ts`)

## Monitor for Errors After Deploy

Vercel dashboard > project > Functions tab:
- Watch for 4xx/5xx errors in the first 5-10 minutes
- Check `api/chat` function logs for Anthropic API errors
- Check `api/auth/verify` for auth issues

Common post-deploy errors:
- `500` on `/api/chat` — usually `ANTHROPIC_API_KEY` not set or invalid
- `401` on all routes — usually `COOKIE_SECRET` not set (JWT verify fails)
- Redirect loop — usually middleware misconfiguration or `COOKIE_SECRET` mismatch

## Rollback Procedure

If the deployment is broken:

1. Vercel dashboard > project > Deployments
2. Find the last working deployment (green checkmark)
3. Click the three-dot menu > **Promote to Production**

This instantly reverts to the previous build without a code change.

Then investigate the issue locally before re-deploying.

## Edge Case: COOKIE_SECRET Changed

If `COOKIE_SECRET` is changed in Vercel env vars:
- All existing sessions are immediately invalidated (JWT signatures won't verify)
- All logged-in users will be redirected to `/auth`
- This is expected and safe — users simply log in again
