# Skill: Code Cleanup

Use this workflow for routine code hygiene work — removing clutter, improving clarity, tightening types.

## 1. Remove Unused Imports

Signs of unused imports:
- TypeScript error `'X' is declared but its value is never read`
- Import at top of file but the name never appears in the file body
- `import type { X }` where `X` is not used as a type annotation anywhere

How to find them:
```
npx tsc --noEmit
```

TypeScript reports unused imports in strict mode. Fix by removing the entire import line, or removing just the unused name from a named import.

Do NOT use `// @ts-ignore` to silence these — remove them.

## 2. Extract Magic Values to Constants

A "magic value" is a literal (number, string) used directly in code with no named explanation.

Extraction rule: if the value:
- Appears more than once, OR
- Would not be obvious to a reader what it represents

then move it to `src/lib/constants.ts` or define it as a module-level constant in the file.

```ts
// Before
if (attempts > 5) { ... }
document.cookie = `auth-token=${value}; Max-Age=86400`

// After — in constants.ts
export const RATE_LIMIT_MAX_ATTEMPTS = 5
export const COOKIE_MAX_AGE = 86400
export const AUTH_COOKIE_NAME = 'auth-token'
```

Naming: SCREAMING_SNAKE_CASE for module-level constants.

## 3. Identify and Inline Trivial Wrapper Functions

A wrapper function is trivial if ALL are true:
- Has exactly one call site in the codebase
- Does nothing except call another function
- Adds no type safety, no error handling, no transformation

```ts
// Trivial wrapper — inline it
function submitForm() {
  handleSubmit()
}

// NOT trivial — adds type narrowing
function getModel(id: string): Model {
  const m = MODELS.find(m => m.id === id)
  if (!m) throw new Error(`Unknown model: ${id}`)
  return m
}
```

## 4. TypeScript Strictness Improvements

Work through these in order (easiest to hardest):

**a) Add `import type` for type-only imports**
```ts
// Before
import { FC, ReactNode } from 'react'
// After
import type { FC, ReactNode } from 'react'
```

**b) Remove explicit `any`**
Replace with the actual type. Read the source of the value to determine it.
If truly unknown: use `unknown` and narrow before use.

**c) Remove unsafe casts**
```ts
// Before
const data = response.json() as MyType
// After — validate first
const raw = await response.json()
if (!isMyType(raw)) throw new Error('Unexpected response shape')
const data = raw // TypeScript now knows it's MyType
```

**d) Add return types to exported functions**
```ts
// Before
export function buildHeader(token: string) {
// After
export function buildHeader(token: string): string {
```

## 5. Remove Unused State and Effects

**Unused state:**
- `const [x, setX] = useState(...)` where `setX` is never called after initialization
- Or where `x` is never read

**Unused effects:**
- `useEffect` with an empty body
- `useEffect` that only sets a value that is never read
- `useEffect` where the cleanup is the only meaningful part (consider event listener pattern instead)

To find: read each component file top-to-bottom. Trace every `useState` and `useEffect`:
- Is the state value consumed anywhere?
- Is the setter called anywhere meaningful?
- Does the effect have an observable side effect?

## 6. Cleanup Checklist

Work through this list file by file:

- [ ] No unused imports
- [ ] No magic numbers/strings (moved to constants)
- [ ] No trivial wrapper functions
- [ ] No `any` types
- [ ] `import type` for all type-only imports
- [ ] No unused `useState` or `useEffect`
- [ ] No TODO/FIXME/HACK comments left over from development
- [ ] No commented-out code blocks

## 7. Verification After Cleanup

```
npx tsc --noEmit
npx next lint
npm run build
```

All must pass. Cleanup changes must be pure — if behavior changes, that is a bug fix or refactor, not cleanup.

Manual check:
- [ ] Chat still works
- [ ] Auth still works
- [ ] Dark mode still works
- [ ] No new console errors
