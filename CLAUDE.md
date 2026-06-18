# Claude AI Chat App — Project Reference

Next.js 16 + React 19 streaming chat application powered by the Anthropic API. Protected by JWT-based access code authentication. Japanese UI. Deployed on Vercel.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Quick Start](#2-quick-start)
3. [npm Scripts](#3-npm-scripts)
4. [Architecture](#4-architecture)
5. [Coding Standards](#5-coding-standards)
6. [Key Patterns](#6-key-patterns)
7. [Security Rules](#7-security-rules)
8. [AI Workflow](#8-ai-workflow)
9. [Commands Reference](#9-commands-reference)
10. [Sub-Agents Reference](#10-sub-agents-reference)
11. [Skills Reference](#11-skills-reference)
12. [Development Workflow](#12-development-workflow)
13. [Debug Workflow](#13-debug-workflow)
14. [Review & Release](#14-review--release)
15. [Context Files](#15-context-files)
16. [Rules](#16-rules)
17. [Forbidden Actions](#17-forbidden-actions)
18. [Environment Variables](#18-environment-variables)

---

## 1. Project Overview

A single-user AI chat application built with Next.js App Router. Users authenticate with a 4-digit access code, then chat with Claude models via streaming responses. Supports image attachments, extended thinking (reasoning blocks), model selection, effort levels, dark mode, and Markdown rendering with syntax highlighting.

**Tech Stack**

| Layer | Package | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.9 |
| UI | React | 19.2.7 |
| Language | TypeScript (strict) | 6.0.3 |
| Styling | Tailwind CSS, PostCSS | 4.3.1 |
| AI SDK | @ai-sdk/anthropic, ai, @ai-sdk/react | 3.0.84 / 6.0.206 / 3.0.208 |
| Auth | jose (JWT HS256) | 6.2.3 |
| Markdown | react-markdown, remark-gfm | 10.1.0 / 4.0.1 |
| Syntax highlight | react-syntax-highlighter | 16.1.1 |
| Linting | ESLint 9 + eslint-config-next | — |

**Deployment:** Vercel (serverless Node.js runtime). No test suite. No CI/CD pipeline.

---

## 2. Quick Start

### Node.js Setup (fnm)

This project uses **fnm** to manage Node.js. The shell PATH does not include node by default. All PowerShell commands must prefix the node path.

```powershell
$nodePath = "C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation"
$env:Path = "$nodePath;$env:Path"
Set-Location "C:\Users\ikere\OneDrive\デスクトップ\プログラミング\vercel app"
```

After setting the path, run npm as:

```powershell
& "$nodePath\npm.cmd" run <script>
```

### Install Dependencies

```powershell
& "$nodePath\npm.cmd" install
```

### Environment Setup

```powershell
Copy-Item .env.local.example .env.local
# Edit .env.local and fill in all three variables (see Section 18)
```

### Start Development Server

```powershell
& "$nodePath\npm.cmd" run dev
# Opens at http://localhost:3000
```

---

## 3. npm Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `next dev` | Development server on port 3000 |
| `build` | `next build` | Production build (runs type-check implicitly) |
| `type-check` | `tsc --noEmit` | TypeScript validation without emit |
| `lint` | `next lint --dir src` | ESLint over `src/` only |

**PowerShell one-liners:**

```powershell
# Type check
& "$nodePath\npm.cmd" run type-check

# Build
& "$nodePath\npm.cmd" run build

# Lint
& "$nodePath\npm.cmd" run lint

# Dev server
& "$nodePath\npm.cmd" run dev
```

---

## 4. Architecture

### Full Directory Tree

```
src/
  app/
    api/
      chat/
        route.ts              # POST — streaming chat endpoint
                              #   runtime: 'nodejs'
                              #   streamText + convertToModelMessages
                              #   validates modelId against ALLOWED_MODEL_IDS
                              #   applies budgetTokens (thinking) or temperature
      auth/
        verify/
          route.ts            # POST — login: rate-limit → code compare → set JWT cookie
        logout/
          route.ts            # POST — logout: clear JWT cookie
    auth/
      page.tsx                # 4-digit access code login page (client)
    page.tsx                  # Protected home page — renders <ChatInterface />
    layout.tsx                # Root layout: dark mode init script, lang="ja"
    globals.css               # Tailwind base + CSS custom properties:
                              #   --background, --foreground, --border,
                              #   --surface, --surface-hover, --text-muted

  components/
    chat/
      ChatInterface.tsx       # Main container
                              #   model/effort selector, dark toggle
                              #   useChat hook, transport useMemo
                              #   modelRef/effortRef/thinkingRef for stale-closure safety
      MessageList.tsx         # Auto-scroll list, empty state placeholder
      MessageItem.tsx         # Renders one turn: user query + assistant response
                              #   reasoning blocks (thinking), copy buttons
      InputArea.tsx           # Textarea + image attach, paste image, submit
      MarkdownRenderer.tsx    # ReactMarkdown with REMARK_PLUGINS + MD_COMPONENTS
                              #   both constants defined at MODULE level (never inline)
      CodeBlock.tsx           # Prism syntax highlight, dark/light theme swap, copy
      ModelSettings.tsx       # Effort level radio group + thinking toggle dropdown
    ui/
      LoadingDots.tsx         # 3-dot bounce animation (shared primitive)

  hooks/
    useDarkMode.ts            # MutationObserver on documentElement.classList
                              #   returns { isDark: boolean, toggle: () => void }
                              #   single source of truth for dark mode state
    useImageAttachments.ts    # Blob URL lifecycle management
                              #   returns { attached, add, remove, clear }
                              #   auto-revokes URLs on unmount

  lib/
    constants.ts              # MODELS, EFFORT_LEVELS, SYSTEM_PROMPT
                              #   AUTH_COOKIE_NAME, COOKIE_MAX_AGE
                              #   RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS
                              #   ALLOWED_MODEL_IDS (derived from MODELS)
                              #   NOTE: ACCESS_CODE is NOT here — env only
    auth/
      cookies.ts              # signAuthCookie(payload) → token
                              # verifyAuthCookie(token) → payload | null
                              # buildCookieHeader(token) → string
                              # buildClearCookieHeader() → string
      rate-limiter.ts         # in-memory Map<ip, attempts>
                              # checkRateLimit(ip) → { allowed, remaining }
                              # WARNING: not persistent across Vercel instances

  proxy.ts                    # Next.js Middleware
                              #   verifies JWT on ALL routes except /auth/*
                              #   redirects unauthenticated → /auth
```

### Models

Defined in `src/lib/constants.ts`:

| id | Display | Family | Thinking |
|---|---|---|---|
| `claude-opus-4-6` | Opus 4.6 | opus | Yes |
| `claude-sonnet-4-6` | Sonnet 4.6 | sonnet | Yes |
| `claude-haiku-4-5-20251001` | Haiku 4.5 | haiku | No |

`DEFAULT_MODEL_ID = 'claude-haiku-4-5-20251001'`

`ALLOWED_MODEL_IDS` is derived from `MODELS` — never hardcoded separately.

### Effort Levels

| id | Label | budgetTokens | temperature |
|---|---|---|---|
| `low` | 低 | 1,024 | 1.0 |
| `medium` | 中 | 3,000 | 0.85 |
| `high` | 高 | 6,000 | 0.7 |
| `xhigh` | 超高 | 12,000 | 0.4 |
| `max` | 最大 | 24,000 | 0.1 |

`DEFAULT_EFFORT_ID = 'high'`

- `budgetTokens` used when extended thinking is enabled
- `temperature` used when thinking is disabled
- Haiku models always have thinking disabled regardless of setting

### .claude Directory Structure

```
.claude/
  agents/       — sub-agent role definitions (23 agents)
  checklists/   — execution checklists (9 files)
  commands/     — slash commands (17 commands)
  context/      — long-lived project knowledge (9 files)
  rules/        — coding rules by domain (15 files)
  skills/       — reusable task workflows (14 skills)
  templates/    — structured templates (10 files)
  settings.json
  settings.local.json
```

---

## 5. Coding Standards

See `.claude/rules/` for full domain rules. Summary below.

### TypeScript — `.claude/rules/typescript.md`

- Strict mode always on (`tsconfig.json`)
- `import type` for type-only imports
- No `any` — use `unknown` + narrowing
- Prefer `interface` for object shapes, `type` for unions/intersections
- Discriminated unions over optional fields where possible

### React — `.claude/rules/react.md`

- `'use client'` explicit at top of every client component file
- No default exports mixed with named exports in same file
- Stable values (constants, plugin arrays) defined outside component bodies
- Custom hooks for all stateful logic that could be reused
- No inline object/array literals as props when they would cause unnecessary re-renders

### Next.js — `.claude/rules/nextjs.md`

- App Router only — no Pages Router patterns
- Server Components by default; add `'use client'` only when needed
- Route Handlers in `app/api/*/route.ts`
- Middleware in `src/proxy.ts` (not `middleware.ts` — custom path configured in `next.config`)
- Never use `export const runtime = 'edge'` on the chat route (requires Node.js APIs)

### Backend — `.claude/rules/backend.md`

- Rate limit before any secret comparison
- Validate all model/effort IDs server-side
- Never trust client-supplied values for sensitive parameters

### Frontend — `.claude/rules/frontend.md`

- Use CSS custom properties from `globals.css` for theming, not hardcoded colors
- Dark mode via `useDarkMode()` hook only
- Tailwind utility classes preferred; custom CSS only for animations and CSS vars

### API — `.claude/rules/api.md`

- Streaming responses use `streamText` from `ai` SDK
- `convertToModelMessages` for message format conversion
- Return proper HTTP status codes (400 for validation, 401 for auth, 429 for rate limit)

### Documentation — `.claude/rules/documentation.md`

- Comments only when WHY is non-obvious
- No JSDoc on trivial getters/setters
- Public API surface in constants.ts should have brief inline comments

### Performance — `.claude/rules/performance.md`

- No unnecessary re-renders: stable refs for values read in callbacks
- `useMemo` for expensive derivations only
- Module-level constants for plugin arrays (see MarkdownRenderer pattern)

### Accessibility — `.claude/rules/accessibility.md`

- ARIA labels on icon-only buttons
- Keyboard navigation for all interactive elements
- Color contrast meets WCAG AA

### Git — `.claude/rules/git.md`

- Commit messages: imperative mood, present tense
- One logical change per commit
- Never commit `.env.local` or secrets

### Testing — `.claude/rules/testing.md`

- No test suite exists; validate via `type-check` + `build` + manual testing
- For new utilities, add unit test scaffolding if test runner is added later

---

## 6. Key Patterns

See `.claude/context/patterns.md` for full detail and `.claude/context/anti-patterns.md` for what NOT to do.

### Transport Pattern (Critical)

```typescript
// ChatInterface.tsx — CORRECT
const transport = useMemo(() => createTransport(endpoint), []);
// eslint-disable-next-line react-hooks/exhaustive-deps — INTENTIONAL

const modelRef = useRef(selectedModel);
const effortRef = useRef(selectedEffort);
const thinkingRef = useRef(thinkingEnabled);

// Keep refs fresh on every render
modelRef.current = selectedModel;
effortRef.current = selectedEffort;
thinkingRef.current = thinkingEnabled;
```

**Why:** `useChat` from `@ai-sdk/react` captures the transport at mount and does not react to transport prop changes. Recreating the transport would silently reset the chat history. Refs provide fresh state at send time without triggering transport recreation.

**ESLint disable is intentional** — do not "fix" it.

### Dark Mode Pattern

```typescript
// CORRECT — always use the hook
const { isDark, toggle } = useDarkMode();

// WRONG — never do this
const [isDark, setIsDark] = useState(false);
```

`useDarkMode` uses a `MutationObserver` on `document.documentElement.classList` to stay in sync across components. The dark mode init script in `layout.tsx` runs before hydration to prevent flash.

### Image Attachments Pattern

```typescript
// CORRECT — always use the hook
const { attached, add, remove, clear } = useImageAttachments();

// Blob URLs are auto-revoked on unmount — never call URL.revokeObjectURL manually
```

### MarkdownRenderer Pattern

```typescript
// CORRECT — module level, defined ONCE
const REMARK_PLUGINS = [remarkGfm];
const MD_COMPONENTS = { code: CodeBlock, ... };

export function MarkdownRenderer({ content }: Props) {
  return <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={MD_COMPONENTS}>
    {content}
  </ReactMarkdown>;
}

// WRONG — never define inside component body
export function MarkdownRenderer({ content }: Props) {
  const plugins = [remarkGfm]; // new array every render → ReactMarkdown re-mounts
  ...
}
```

### Adding a New Model

1. Add entry to `MODELS` array in `src/lib/constants.ts`
2. `ALLOWED_MODEL_IDS` is auto-derived — no other change needed for server validation
3. If making it the default: update `DEFAULT_MODEL_ID`
4. Run `/typecheck` to verify

### Server-Side Validation Pattern

```typescript
// chat/route.ts — never trust client input
const { modelId, effortId } = await req.json();
if (!ALLOWED_MODEL_IDS.includes(modelId)) {
  return new Response('Invalid model', { status: 400 });
}
```

---

## 7. Security Rules

See `.claude/rules/security.md` for full rules and `.claude/checklists/security.md` for the pre-deploy checklist.

**Summary:**

- `ACCESS_CODE` lives in `process.env` only — never in `constants.ts`, never in client code, never in logs
- Rate limiting runs BEFORE code comparison to prevent timing attacks
- JWT: HS256, `COOKIE_SECRET` (32+ chars), HTTP-only cookie, `SameSite=Lax`, `Secure` flag in production
- All model IDs and effort IDs validated server-side before use
- In-memory rate limiter is NOT persistent across Vercel cold starts — acceptable for single-user app
- Never expose stack traces or internal error details to the client
- Middleware (`proxy.ts`) gates all non-`/auth` routes — verify it is included in the matcher

---

## 8. AI Workflow

### How to Use Claude Code in This Project

Claude Code commands are slash commands defined in `.claude/commands/`. Use them to delegate well-defined tasks. Sub-agents in `.claude/agents/` handle specialized roles. Skills in `.claude/skills/` are reusable multi-step workflows.

### Task Type → Command → Agent

| Task Type | Command to Use | Relevant Agent |
|---|---|---|
| Implement a new feature | `/implement` | `frontend-engineer`, `backend-engineer` |
| Fix a bug | `/fix` or `/debug` | `bug-hunter`, `root-cause-analyzer` |
| Refactor existing code | `/refactor` | `refactoring-engineer` |
| Code review | `/review` | `code-reviewer` |
| Security audit | `/security` | `security-engineer` |
| Performance investigation | `/performance` | `performance-engineer` |
| Architecture decision | `/plan` + `/analyze` | `architect`, `planner` |
| Add new Claude model | `/add-model` | `api-engineer` |
| Run type check | `/typecheck` | — |
| Run build | `/build` | `devops-engineer` |
| Run linter | `/lint` | — |
| Write documentation | `/docs` | `documentation-writer` |
| Prepare a release | `/release` | `release-manager` |
| Analyze codebase | `/analyze` | `researcher`, `architect` |

### Typical Invocation Pattern

```
/implement Add a "copy conversation" button to MessageList that copies all messages as plain text
/review Check ChatInterface.tsx for stale closure bugs
/security Audit the auth flow in api/auth/verify/route.ts
/add-model claude-opus-4-8 "Opus 4.8" opus true
```

---

## 9. Commands Reference

All commands in `.claude/commands/`.

| Command | File | Description |
|---|---|---|
| `/typecheck` | `typecheck.md` | Run `tsc --noEmit` and report type errors |
| `/build` | `build.md` | Run `next build` and report build errors |
| `/lint` | `lint.md` | Run ESLint over `src/` and report violations |
| `/dev` | `dev.md` | Start the Next.js development server |
| `/add-model` | `add-model.md` | Add a new Claude model to `constants.ts` MODELS array |
| `/implement` | `implement.md` | Implement a described feature end-to-end |
| `/review` | `review.md` | Review code for correctness, patterns, and security |
| `/refactor` | `refactor.md` | Refactor code following project conventions |
| `/test` | `test.md` | Run tests or validate behavior manually |
| `/fix` | `fix.md` | Fix a described bug with root cause analysis |
| `/debug` | `debug.md` | Investigate and diagnose a problem |
| `/analyze` | `analyze.md` | Analyze code structure, dependencies, or behavior |
| `/plan` | `plan.md` | Create an implementation plan before coding |
| `/release` | `release.md` | Prepare and validate a release |
| `/docs` | `docs.md` | Generate or update documentation |
| `/security` | `security.md` | Run security audit against rules/security.md |
| `/performance` | `performance.md` | Profile and optimize performance |

---

## 10. Sub-Agents Reference

All agents in `.claude/agents/`.

| Agent | File | Role |
|---|---|---|
| Architect | `architect.md` | System design, ADRs, structural decisions |
| Frontend Engineer | `frontend-engineer.md` | React/Next.js UI components and hooks |
| Backend Engineer | `backend-engineer.md` | API routes, server logic, middleware |
| API Engineer | `api-engineer.md` | Anthropic SDK integration, model config |
| Security Engineer | `security-engineer.md` | Auth flows, JWT, rate limiting, secrets |
| Performance Engineer | `performance-engineer.md` | Bundle size, render performance, Core Web Vitals |
| Refactoring Engineer | `refactoring-engineer.md` | Code cleanup, pattern enforcement, deduplication |
| Bug Hunter | `bug-hunter.md` | Reproduce, isolate, and fix bugs |
| Root Cause Analyzer | `root-cause-analyzer.md` | Deep diagnosis of production/runtime errors |
| Code Reviewer | `code-reviewer.md` | PR review against project rules and patterns |
| Testing Engineer | `testing-engineer.md` | Test strategy, coverage, and validation |
| DevOps Engineer | `devops-engineer.md` | Vercel deployment, build pipeline |
| Release Manager | `release-manager.md` | Release preparation, changelogs, checklists |
| Documentation Writer | `documentation-writer.md` | Docs, comments, CLAUDE.md maintenance |
| Planner | `planner.md` | Break down tasks into actionable steps |
| Researcher | `researcher.md` | Investigate libraries, APIs, and approaches |
| Accessibility Reviewer | `accessibility-reviewer.md` | ARIA, keyboard nav, WCAG compliance |
| UX Reviewer | `ux-reviewer.md` | Usability, interaction patterns, Japanese UI |
| Prompt Engineer | `prompt-engineer.md` | SYSTEM_PROMPT tuning and model behavior |
| Log Analyzer | `log-analyzer.md` | Parse and interpret error logs and stack traces |
| Context Manager | `context-manager.md` | Maintain `.claude/context/` files |
| Task Manager | `task-manager.md` | Track and prioritize development tasks |
| Dependency Manager | `dependency-manager.md` | Package upgrades, compatibility, audits |

---

## 11. Skills Reference

All skills in `.claude/skills/`.

| Skill | File | When to Use |
|---|---|---|
| Feature Development | `feature-development.md` | Building a new user-facing capability end-to-end |
| Bug Fix | `bug-fix.md` | Diagnosing and patching a reported defect |
| Refactoring | `refactoring.md` | Improving code structure without changing behavior |
| Code Review | `code-review.md` | Evaluating a diff or PR against project standards |
| Debug | `debug.md` | Tracing a runtime error or unexpected behavior |
| Security | `security.md` | Auditing auth, secrets handling, input validation |
| Performance | `performance.md` | Identifying and resolving performance regressions |
| API Design | `api-design.md` | Designing or modifying a route.ts endpoint |
| Architecture | `architecture.md` | Planning structural changes or new subsystems |
| Testing | `testing.md` | Designing test coverage and validation strategies |
| Documentation | `documentation.md` | Writing or updating docs and comments |
| Deployment | `deployment.md` | Preparing and validating Vercel deploys |
| Release | `release.md` | End-to-end release preparation and publishing |
| Cleanup | `cleanup.md` | Dead code removal, dependency pruning, file organization |

---

## 12. Development Workflow

### New Feature

1. **Plan** — `/plan <feature description>` to get a step-by-step implementation plan
2. **Implement** — `/implement <feature>` or code manually following Section 5 standards
3. **Type check** — `/typecheck` (must pass with zero errors)
4. **Lint** — `/lint` (must pass with zero errors)
5. **Build** — `/build` (must complete successfully)
6. **Review** — `/review` against `.claude/checklists/review.md`
7. **Security check** — `/security` if the change touches auth, env vars, or API routes

### Bug Fix

1. **Reproduce** — describe the bug precisely
2. **Debug** — `/debug <symptom>` or check `.claude/context/common-errors.md`
3. **Fix** — `/fix <bug>` or implement manually
4. **Verify** — `/typecheck` + `/build`
5. **Review** — confirm the fix does not introduce regressions

### Refactor

1. **Analyze** — `/analyze <target>` to understand current structure
2. **Plan** — confirm the refactor is consistent with `.claude/context/patterns.md`
3. **Refactor** — `/refactor <scope>`
4. **Verify** — `/typecheck` + `/build` + `/lint`
5. **Anti-pattern check** — confirm nothing in `.claude/context/anti-patterns.md` was introduced

### Adding a Model (Special Case)

```
/add-model <model-id> "<display-name>" <family> <supportsThinking>
```

Example:
```
/add-model claude-sonnet-4-8 "Sonnet 4.8" sonnet true
```

The command edits `src/lib/constants.ts` only. `ALLOWED_MODEL_IDS` updates automatically.

---

## 13. Debug Workflow

See `.claude/context/common-errors.md` for a catalogue of known errors and solutions.

### Common Issues

| Symptom | Likely Cause | First Step |
|---|---|---|
| Type error on build | Strict TS violation | `/typecheck` for exact location |
| 401 on chat route | JWT cookie missing or expired | Check `proxy.ts` matcher config |
| 429 from auth route | Rate limit hit | Check `rate-limiter.ts` window config |
| Chat history resets on model change | Transport recreated | Verify `useMemo` + ESLint disable pattern |
| Dark mode flickers on load | Init script missing | Check `layout.tsx` inline script |
| Markdown re-mounts on every message | Plugins defined inside component | Move to module scope |
| Image Blob URL memory leak | Manual revocation missing | Use `useImageAttachments` hook |
| Model not appearing in UI | Not added to `MODELS` array | `/add-model` command |
| Build fails on Vercel, passes locally | Missing env var | Check Vercel environment variables |
| Rate limit not resetting | In-memory state on warm instance | Expected behavior — document for users |

### Debug Steps

1. Check `.claude/context/common-errors.md` for the exact error
2. Run `/typecheck` to rule out type errors
3. Run `/debug <symptom>` to get a structured diagnosis
4. Use `/analyze` on the suspect file to understand context
5. Engage `root-cause-analyzer` agent for deep runtime issues
6. Engage `log-analyzer` agent for Vercel function log analysis

---

## 14. Review & Release

### Pre-PR Checklist

See `.claude/checklists/pr.md` for full checklist.

- `/typecheck` passes
- `/build` passes
- `/lint` passes
- No new `any` types introduced
- No secrets or `.env.local` committed
- Patterns from Section 6 followed
- No forbidden actions from Section 17 violated
- If auth touched: `.claude/checklists/security.md` completed

### Code Review

See `.claude/checklists/review.md` and `.claude/rules/review.md`.

Run: `/review` to get a structured review of the current diff.

### Security Review

See `.claude/checklists/security.md`.

Run: `/security` before any deploy touching auth, cookies, or environment variables.

### Release Checklist

See `.claude/checklists/release.md`.

Run: `/release` to step through the full release preparation workflow.

Steps include:
1. Final `/typecheck` + `/build` + `/lint`
2. Security checklist
3. Update `CLAUDE.md` if architecture changed
4. Update `.claude/context/` files if patterns changed
5. Verify Vercel environment variables are set
6. Deploy and smoke test the `/auth` flow and one chat message

---

## 15. Context Files

All files in `.claude/context/`. These are long-lived knowledge documents maintained across sessions.

| File | Contents |
|---|---|
| `project.md` | Project purpose, constraints, user persona, design goals |
| `architecture.md` | Detailed architecture narrative, data flow, component relationships |
| `patterns.md` | Canonical implementation patterns for this codebase (authoritative) |
| `anti-patterns.md` | What NOT to do — known bad patterns and why they are banned |
| `common-errors.md` | Catalogue of errors encountered with root causes and fixes |
| `decisions.md` | Architecture Decision Records (ADRs) with rationale |
| `dependencies.md` | Key dependency notes, version constraints, upgrade considerations |
| `glossary.md` | Domain terms, abbreviations, and project-specific vocabulary |
| `business.md` | Business context, deployment environment, operational notes |

---

## 16. Rules

All files in `.claude/rules/`. Claude Code reads these to enforce standards.

| File | Governs |
|---|---|
| `typescript.md` | TypeScript strict mode, import style, type patterns |
| `react.md` | Component structure, hooks, rendering patterns |
| `nextjs.md` | App Router, route handlers, middleware, runtime config |
| `frontend.md` | CSS, Tailwind, theming, dark mode |
| `backend.md` | API routes, validation, error handling |
| `api.md` | Anthropic SDK usage, streaming, model config |
| `security.md` | Auth, secrets, cookies, rate limiting, input validation |
| `performance.md` | Render optimization, memoization, bundle size |
| `accessibility.md` | ARIA, keyboard nav, color contrast |
| `architecture.md` | File structure, module boundaries, dependency direction |
| `documentation.md` | Comment style, doc standards |
| `testing.md` | Test strategy for this no-test-suite project |
| `review.md` | Code review standards and checklist criteria |
| `git.md` | Commit messages, branching, what never to commit |
| `node.md` | Node.js runtime specifics, fnm path handling |

---

## 17. Forbidden Actions

From `.claude/rules/security.md` and `.claude/context/anti-patterns.md`:

### Never Do

- **NEVER** put `ACCESS_CODE` in `constants.ts` or any client-accessible file
- **NEVER** export `ACCESS_CODE` from any module
- **NEVER** log `ACCESS_CODE`, `COOKIE_SECRET`, or JWT tokens
- **NEVER** compare the access code BEFORE checking the rate limit
- **NEVER** use `export const runtime = 'edge'` on `api/chat/route.ts`
- **NEVER** recreate the chat transport inside `useChat` callbacks or on state change
- **NEVER** define `REMARK_PLUGINS` or `MD_COMPONENTS` inside the `MarkdownRenderer` component body
- **NEVER** create a local `isDark` state — always use `useDarkMode()`
- **NEVER** call `URL.revokeObjectURL` manually — always use `useImageAttachments`
- **NEVER** trust client-supplied `modelId` or `effortId` without server validation
- **NEVER** commit `.env.local` to git
- **NEVER** add `console.log` calls that might print env vars or user data
- **NEVER** hardcode `ALLOWED_MODEL_IDS` separately from `MODELS` array
- **NEVER** use `// eslint-disable` except for the intentional transport `useMemo` dep suppression

### ESLint Disable Policy

The only intentional ESLint disable in this codebase is:

```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps
const transport = useMemo(() => createTransport(endpoint), []);
```

This is documented and intentional. Any other `eslint-disable` comment requires explicit justification in a code review.

---

## 18. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values before running.

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key — obtain from console.anthropic.com |
| `ACCESS_CODE` | Yes | 4-digit numeric code for login — keep secret, never in client code |
| `COOKIE_SECRET` | Yes | 32+ character random string for JWT HMAC-SHA256 signing |

### Security Notes on Each Variable

**`ANTHROPIC_API_KEY`**
- Server-side only (`src/app/api/chat/route.ts`)
- Never referenced in any `'use client'` file
- Never prefixed with `NEXT_PUBLIC_`

**`ACCESS_CODE`**
- Read via `process.env.ACCESS_CODE` in `api/auth/verify/route.ts` only
- Never imported into `constants.ts`
- Never passed to the client in any response payload
- Rate limit is checked BEFORE this value is compared

**`COOKIE_SECRET`**
- Used by `src/lib/auth/cookies.ts` for `jose` JWT signing
- Must be 32+ characters (shorter keys reduce HMAC-SHA256 security)
- Rotate by changing value + clearing user cookies (next login required)

### Generating a Secure COOKIE_SECRET

```powershell
# PowerShell — generates a 48-char random base64 string
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(36))
```

### .env.local.example

```
ANTHROPIC_API_KEY=sk-ant-...
ACCESS_CODE=1234
COOKIE_SECRET=replace-with-32-plus-character-random-string
```
