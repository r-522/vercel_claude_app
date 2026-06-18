# Skill: Refactoring

Use this workflow when improving code structure without changing behavior.

## 1. Extract Hook Pattern

**When to extract a new hook:**
- A component manages 3+ related state variables that move together
- State + effects for a single concern appear in multiple components
- Lifecycle logic (create/cleanup) for external resources (Blob URLs, timers, subscriptions)

**When NOT to extract:**
- Single useState with no associated effects
- Logic only used in one place and unlikely to be reused
- Would require passing many parameters — inline is clearer

**How to structure the extracted hook:**

1. Create `src/hooks/useFeatureName.ts`
2. Move all related `useState`, `useCallback`, `useEffect`, `useRef` into the hook
3. Return a single object (not multiple values) — consistent with existing hooks
4. `'use client'` at top if it uses browser APIs
5. Cleanup in `useEffect` return function — especially for Blob URLs

Example — extracting image attachment logic (already done as `useImageAttachments`):
```ts
// src/hooks/useImageAttachments.ts
export function useImageAttachments() {
  // ...state, effects, callbacks...
  return { attached, add, remove, clear }
}
```

Update the component to import and destructure from the hook.

## 2. Module-Level Constant Extraction

**When to extract to module level:**
- Object or array created inside a component with a stable value (never changes at runtime)
- Used as a prop or dependency — being inside the component causes new reference each render
- Especially critical: ReactMarkdown `remarkPlugins` and `components` props

**Pattern:**
```ts
// Before — BAD: new object every render
function Component() {
  return <Markdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }} />
}

// After — GOOD: stable reference
const REMARK_PLUGINS = [remarkGfm]
const MD_COMPONENTS = { code: CodeBlock }

function Component() {
  return <Markdown remarkPlugins={REMARK_PLUGINS} components={MD_COMPONENTS} />
}
```

Name module-level constants in SCREAMING_SNAKE_CASE.

## 3. TypeScript Type Improvement

Priority order:
1. Replace `any` with the actual type — read the value's source to determine the type
2. Replace `as Type` casts with proper type narrowing (if/typeof/Array.isArray)
3. Add missing return types to exported functions
4. Use `import type` for imports that are only used as types

**Pattern for narrowing instead of casting:**
```ts
// Before
const value = someMap.get(key) as string

// After
const value = someMap.get(key)
if (!value) throw new Error(`Missing key: ${key}`)
// value is now string
```

**Do not:**
- Add `@ts-ignore` or `@ts-expect-error` without a detailed comment
- Widen types (e.g., `string | undefined` → `string`) unless the undefined case is truly impossible

## 4. Removing Trivial Wrapper Functions

A wrapper function is trivial if it:
- Has only one call site
- Does nothing except call another function with the same arguments
- Adds no type safety, error handling, or logic

Inline it directly.

## 5. Unused Import / State / Effect Removal

Check for:
- Imports that are not referenced in the file
- `useState` where the setter is never called
- `useEffect` with an empty body or a body that has no side effect
- Variables assigned but never read

Use `npx tsc --noEmit` to surface some of these. For others, read the file carefully.

## 6. Verification (no regressions)

Run in order:
```
npx tsc --noEmit
npx next lint
npm run build
```

Manual test after refactor:
- [ ] Feature that was refactored still works end-to-end
- [ ] Dark mode still correct (if any component was touched)
- [ ] No console errors or warnings related to React keys, prop types, or hooks
- [ ] Streaming still works if ChatInterface.tsx was touched
- [ ] Auth still works if any auth file was touched
