# Skill: Documentation Updates

Use this workflow to keep project documentation accurate and current.

## What Triggers a CLAUDE.md Update

Update `CLAUDE.md` (project root or `.claude/`) when:
- A new file or directory is added to `src/`
- An existing file's primary responsibility changes
- A new environment variable is required
- A key architectural pattern is added or changed
- A new model is added to `MODELS` in `src/lib/constants.ts`
- A new effort level is added to `EFFORT_LEVELS`
- A coding convention is established (e.g., a new rule added to `.claude/rules/`)
- A dependency is added, removed, or significantly upgraded

Do NOT update CLAUDE.md for:
- Internal implementation details that don't affect how to work with the codebase
- Bug fixes that don't change the architecture
- Style-only refactors

## How to Update Context Files

Context files live in `.claude/context/`. Each file covers a single long-lived topic.

When updating a context file:
1. Read the existing file first
2. Identify the specific section to update — do not rewrite the entire file
3. Update only the changed information
4. Keep the file factual and current — remove outdated information

Common context file triggers:
- `models.md` or similar — update when `MODELS` array in `constants.ts` changes
- `auth.md` — update when auth flow or cookie behavior changes
- `env-vars.md` — update when environment variables change

If no relevant context file exists and the information is long-lived (not a one-off), create a new one.

## How to Update .env.local.example When Adding Env Vars

When a new environment variable is required by the app:

1. Add it to `.env.local.example` with a placeholder value and a comment:
   ```
   # Description of what this is for and where to get it
   NEW_VAR_NAME=your-value-here
   ```

2. Add it to the "Environment Variables" section of `CLAUDE.md`

3. Add it to the Vercel deployment checklist in `.claude/skills/deployment.md`

4. If it's a secret (API key, signing key), explicitly note "server-only" in the comment

Never commit actual values to `.env.local.example` — only placeholders.
Never commit `.env.local` (should be in `.gitignore`).

## Pattern for Documenting Non-Obvious Code Decisions

The project convention is: no comments unless the WHY is non-obvious.

**Add a comment when:**
- A pattern looks wrong but is intentional (e.g., the transport useMemo ESLint disable)
- A constraint from an external system forces a non-obvious choice (e.g., `runtime = 'nodejs'` for streaming)
- A deliberate trade-off was made with known downsides (e.g., in-memory rate limiter)

**Comment format:** Explain WHY, not WHAT.
```ts
// ESLint: transport intentionally created once — model/effort read via refs in closure
// eslint-disable-next-line react-hooks/exhaustive-deps
const transport = useMemo(...)
```

**Do NOT comment:**
- Obvious code (`// increment counter` above `count++`)
- Type annotations (they are self-documenting)
- What a function does when the name is clear

## Documenting Architecture Decisions

For significant decisions (not just implementation details), add to `.claude/skills/architecture.md`:
- What decision was made
- Why (trade-offs considered)
- What the alternatives were and why they were rejected

Example triggers:
- Choosing in-memory rate limiter over Redis
- Choosing jose over jsonwebtoken
- Choosing to use refs instead of recreating transport

## Keeping Skills Files Current

When a workflow changes, update the relevant skill file in `.claude/skills/`.

Trigger: any change that makes existing step-by-step instructions incorrect.

Do not add every minor change — only update when the steps would produce wrong results if followed as written.
