# Refactoring Plan: [Target]

**Date:** YYYY-MM-DD
**Author:**
**Related issue / ADR:**

---

## Target
<!-- Name of the pattern, module, or abstraction being refactored.
     e.g. "Extract model-selection state into useModelSelection hook" -->

## Motivation
<!-- Why is this refactoring needed now?
     Reference concrete problems: duplication, violation of an established pattern,
     TypeScript errors, upcoming feature that requires cleaner structure, etc. -->

## Current Pattern Description
<!-- Describe how things work today. Reference exact file paths and function/variable names. -->

```typescript
// Excerpt of current code (before)
```

## Proposed Pattern Description
<!-- Describe the target state. Show the new structure, interface, or abstraction. -->

```typescript
// Excerpt of proposed code (after)
```

## Files to Change

| File | Change |
|------|--------|
| | |

## Risk Assessment
- **Behavior change risk:** none / low / medium / high
  <!-- Explanation: -->
- **Type safety risk:** none / low / medium / high
  <!-- Explanation: -->
- **Blast radius:** <!-- How many components / hooks import the changed module? -->

## Rollback Plan
<!-- How to undo this refactoring if a problem is discovered post-merge.
     e.g. "Revert the single commit; no database migrations involved." -->

## Verification Steps
- [ ] `pnpm run typecheck` — zero TypeScript errors
- [ ] `pnpm run lint` — zero ESLint errors
- [ ] `pnpm run build` — successful Vercel/Next.js build
- [ ] Manual: send a chat message with each model (Haiku, Sonnet, Opus) and confirm streaming works
- [ ] Manual: toggle dark mode before and after; confirm no visual regression
- [ ] Manual: attach image and send; confirm useImageAttachments Blob cleanup
- [ ] Additional steps specific to this refactoring:
  - [ ]

## Timeline
<!-- Rough estimate. Update as work progresses. -->
- [ ] Implementation: ___
- [ ] Self-review + typecheck/lint: ___
- [ ] PR open: ___

---

# Example — Extracting a Custom Hook (reference: useDarkMode)

## Target
Extract dark mode logic from `ChatInterface.tsx` into `src/hooks/useDarkMode.ts`.

## Motivation
`ChatInterface` was managing `isDark` state and a `MutationObserver` inline. The same
logic would be needed in any future component that renders theme-aware UI. Extracting it
keeps `ChatInterface` focused on chat orchestration.

## Current Pattern Description
Dark mode state and the `MutationObserver` callback were inlined inside `ChatInterface`.
Every consumer would duplicate the observer setup.

## Proposed Pattern Description

```typescript
// src/hooks/useDarkMode.ts
export function useDarkMode() {
  // MutationObserver on documentElement.classList
  // Returns { isDark: boolean, toggle: () => void }
}
```

Consumers call `const { isDark, toggle } = useDarkMode()` and never manage observer
lifecycle themselves.

## Files to Change

| File | Change |
|------|--------|
| src/hooks/useDarkMode.ts | Create new hook |
| src/components/chat/ChatInterface.tsx | Replace inline logic with `useDarkMode()` call |

## Risk Assessment
- **Behavior change risk:** none (pure extraction)
- **Type safety risk:** none
- **Blast radius:** 1 component currently; hook is immediately reusable

## Rollback Plan
Revert the two files; no API or persistence changes involved.
