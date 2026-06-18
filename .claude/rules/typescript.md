# TypeScript Rules

## Strict Mode
`tsconfig.json` has `strict: true`. Never relax this. All strict checks are active:
- `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`
- `noUncheckedIndexedAccess` means array/map access returns `T | undefined` — always guard

## Import Types
Use `import type` for any import that is only used as a type at runtime:
```ts
// correct
import type { UIMessage, FileUIPart } from 'ai';
import type { NextRequest } from 'next/server';

// wrong — will bloat bundle if not tree-shaken
import { UIMessage } from 'ai';
```
ESLint enforces this via `@typescript-eslint/consistent-type-imports`.

## Type Assertions
Prefer type narrowing over `as`:
```ts
// prefer
if (part.type === 'file') { /* part.url is available */ }

// only use 'as' when narrowing is impossible (e.g., external JSON, DOM)
const el = document.getElementById('root') as HTMLDivElement; // DOM API returns Element | null
```
When `as` is necessary, add a single-line comment explaining why the cast is safe.

Never use `as any`. Never double-cast `x as unknown as T` without a comment.

## Interfaces vs Types
- `interface` for component props and object shapes that may be extended:
  ```ts
  interface ChatInterfaceProps { ... }
  interface AttachedFile { previewUrl: string; file: File; }
  ```
- `type` for unions, intersections, mapped types, and computed types:
  ```ts
  type EffortId = 'low' | 'medium' | 'high' | 'xhigh' | 'max';
  type ModelFamily = 'opus' | 'sonnet' | 'haiku';
  ```

## Generic Constraints for SDK Types
When working with AI SDK types, constrain generics to the actual shapes:
```ts
// UIMessage from 'ai' — use directly, do not re-wrap
const messages: UIMessage[];

// FileUIPart from 'ai' — type part.type === 'file' before accessing part.url
if (part.type === 'file' && part.mediaType?.startsWith('image/')) { ... }
```

## No `any`
- `any` is only permitted in `catch` clauses where the error is truly unknown:
  ```ts
  catch (error) {
    console.error('message', error); // error: unknown is also fine
  }
  ```
- `unknown` is preferred over `any` in catch — use type guards before accessing properties.
- Never use `any` in function signatures or return types.

## Const Assertions for Configuration Arrays
`MODELS` and `EFFORT_LEVELS` in `src/lib/constants.ts` must use `as const` so TypeScript narrows to literal types:
```ts
export const MODELS = [
  { id: 'claude-opus-4-6', display: 'Opus 4.6', family: 'opus', supportsThinking: true },
  ...
] as const;

export type ModelId = typeof MODELS[number]['id'];
```
This allows `ALLOWED_MODEL_IDS` to be derived without manual duplication.

## Exporting Types from Hooks
Hooks that return structured objects must export their return-type interface:
```ts
// src/hooks/useImageAttachments.ts
export interface AttachedFile {
  previewUrl: string;
  file: File;
}
export function useImageAttachments() { ... }
```
This lets consumers type-annotate without re-importing the hook itself.

## Return Types
- Explicit return types on all exported functions and hook return values.
- Inline return types acceptable for simple arrow functions inside components.
- Route handlers must declare `Promise<Response>` or `Promise<NextResponse>`.
