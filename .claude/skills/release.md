# Skill: Release Workflow

Use this workflow before and after each production release of the Claude AI Chat App.

## Pre-Release Checks

### 1. Type Check
```
npx tsc --noEmit
```
Must complete with zero errors. Fix all errors before proceeding.

### 2. Lint
```
npx next lint
```
Must complete with zero warnings or errors. Fix all issues before proceeding.

### 3. Build
```
npm run build
```
Must complete successfully. Check the output for:
- Any route that failed to compile
- Unusually large JS chunks (flag any over 100 kB gzipped)
- Missing or invalid module errors

If build fails, do not deploy.

### 4. Check for Leftover Debug Code
Search for:
- `console.log` in `src/app/api/` files
- Hardcoded test values
- Commented-out code that should not ship
- `// TODO` comments that became blocking issues

### 5. Update MODELS If New Claude Models Are Available

Check Anthropic's model availability at: https://docs.anthropic.com/en/docs/about-claude/models

Compare against `MODELS` in `src/lib/constants.ts`.

If a new model is available:
1. Add it following the pattern in `.claude/skills/architecture.md` (section: "How to Add a New Model")
2. Verify `ALLOWED_MODEL_IDS` still derives from `MODELS.map(m => m.id)`
3. Test locally: select the new model, send a message, confirm it works
4. Re-run type check, lint, build

If a model is deprecated:
1. Remove from `MODELS` array
2. Update `DEFAULT_MODEL_ID` if it was the default (pick a current model)
3. Test that model switching still works

### 6. Verify Environment Variables in Vercel Dashboard

Before deploying, confirm in Vercel dashboard > Settings > Environment Variables:
- [ ] `ANTHROPIC_API_KEY` is set and valid
- [ ] `ACCESS_CODE` is set (4-digit code)
- [ ] `COOKIE_SECRET` is set and is 32+ characters

These do not change often, but verify they are still present — Vercel env vars can be accidentally deleted.

## Deploy

```
git push origin main
```

Vercel auto-deploys on push. Watch the Vercel dashboard for deployment status (typically 2-3 minutes).

## Post-Deploy Smoke Test

After deployment completes, test the live URL:

### Login
- [ ] Go to `/auth`
- [ ] Enter ACCESS_CODE — should redirect to `/`
- [ ] Reload — should stay logged in

### Chat
- [ ] Send a short message — response streams in progressively
- [ ] Switch model to Sonnet — send a message — streams correctly
- [ ] Switch effort to 最大 (max) — send a message — responds (may take longer)
- [ ] Switch back to default model and effort

### Thinking (Extended Reasoning)
- [ ] Enable thinking toggle (requires Opus or Sonnet model)
- [ ] Send a message — reasoning blocks should appear before the main response
- [ ] Disable thinking toggle — next message has no reasoning block

### Image Attachment
- [ ] Click image attach button or paste an image
- [ ] Image preview appears in input area
- [ ] Send — model response references the image

### Dark Mode
- [ ] Toggle dark mode — switches immediately
- [ ] Reload — dark mode preference persists (no flash)
- [ ] Check both dark and light themes look correct

### Logout
- [ ] Trigger logout (if UI button exists) — redirects to `/auth`
- [ ] Attempting to access `/` without cookie redirects to `/auth`

## Monitor for Errors

After smoke test, watch Vercel logs for 10-15 minutes:

Vercel dashboard > project > Functions tab:
- Look for 5xx errors on `api/chat`
- Look for 401 errors (auth failures)
- Look for any Anthropic API errors in function logs

Common post-deploy issues:
| Symptom | Likely Cause | Fix |
|---|---|---|
| 500 on `/api/chat` | `ANTHROPIC_API_KEY` wrong/missing | Update in Vercel env vars |
| All requests → 401 | `COOKIE_SECRET` wrong/missing | Update in Vercel env vars, users re-login |
| Redirect loop | Middleware config wrong | Check `src/proxy.ts` excluded routes |
| Streaming broken | Edge runtime activated | Verify `export const runtime = 'nodejs'` in route |

## Rollback

If a critical issue is found post-deploy:

1. Vercel dashboard > project > Deployments
2. Find the previous working deployment
3. Three-dot menu > **Promote to Production**
4. Deployment reverts in ~30 seconds

Then investigate locally before re-deploying.

## After Successful Release

Update any changed documentation:
- `CLAUDE.md` if architecture or patterns changed
- `.claude/skills/` if workflows changed
- `.claude/context/` if long-lived knowledge changed
