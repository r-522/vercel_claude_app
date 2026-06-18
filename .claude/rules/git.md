# Git Rules

## Commit Message Format
Imperative present tense with a scope prefix:
```
feat: add image paste support to InputArea
fix: revoke blob URLs on useImageAttachments unmount
refactor: extract model validation to shared util
docs: update CLAUDE.md with transport pattern
chore: bump @ai-sdk/anthropic to 3.0.85
```

Scopes:
- `feat` — new user-facing feature
- `fix` — bug fix
- `refactor` — code restructuring without behavior change
- `docs` — documentation only
- `chore` — dependency updates, config, build

Keep the subject line under 72 characters. Add a body paragraph only when the WHY is non-obvious from the subject.

## Never Commit
These files and values must never appear in a commit:
- `.env.local` — contains `ACCESS_CODE`, `COOKIE_SECRET`, `ANTHROPIC_API_KEY`
- Any file containing literal values of `ACCESS_CODE` or `COOKIE_SECRET`
- `.next/` build output
- `node_modules/`

The `.gitignore` already covers `.env.local`, `.next/`, and `node_modules/`. Never use `git add .env.local` or `git add -f`.

## `.claude/settings.local.json`
This file stores session-specific Claude Code permissions and must be gitignored. It is not shared across developers or deployments. Ensure it stays in `.gitignore`:
```
.claude/settings.local.json
```

## Branch Naming
```
feature/image-attachments
fix/blob-url-leak
refactor/extract-model-validation
```
Use hyphens, not underscores. Keep names short but descriptive.

## Pull Request Guidelines
- One concern per PR — do not mix feature work with unrelated refactors
- PR description must include a test plan:
  ```
  ## Test Plan
  - [ ] Verified dark mode toggle works in both states
  - [ ] Ran `npm run type-check` with no errors
  - [ ] Ran `npm run lint` with no warnings
  ```
- Link to the relevant rule file if the PR touches a pattern defined in `.claude/rules/`

## Pre-Commit Checks
Before pushing, always run:
```
npm run type-check
npm run lint
```
There is no CI/CD to catch these failures automatically. A broken build on Vercel blocks the entire app.

## Vercel Deployment
Main branch deploys automatically to Vercel. Do not push directly to `main` for experimental changes — use a feature branch and merge only when confident.
