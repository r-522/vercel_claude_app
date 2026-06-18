# Testing Rules

No test suite exists currently. These rules define conventions to follow when tests are added.

Related: [architecture rules](./architecture.md), [backend rules](./backend.md)

## Framework (When Added)
- **Unit/Integration**: Vitest
- **Component tests**: `@testing-library/react` with `@testing-library/user-event`
- **Hook tests**: `renderHook` from `@testing-library/react`
- Do not add Jest — Vitest is compatible with the existing ESLint config and Vite/Turbopack ecosystem

## Test File Location
Two accepted patterns — choose one per directory and be consistent:
```
src/hooks/__tests__/useDarkMode.test.ts       # __tests__ subdirectory
src/hooks/useDarkMode.test.ts                 # co-located
```
For components, co-location is preferred:
```
src/components/chat/ChatInterface.test.tsx
src/components/chat/InputArea.test.tsx
```

## What to Test — Priority Order
1. **Hooks**: `useDarkMode`, `useImageAttachments` — isolated with `renderHook`
2. **API routes**: `/api/auth/verify`, `/api/auth/logout`, `/api/chat` — with real `jose` verification
3. **Components**: `ChatInterface` user flows, `InputArea` paste/submit behavior

## What to Mock
Mock the Anthropic API — never call the real API in tests:
```ts
vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: () => ({ chat: vi.fn() }),
}));
```

Do NOT mock:
- `jose` JWT functions — use real signing and verification with a test secret
- `rate-limiter.ts` — test with the real in-memory state; reset between tests by re-importing with a fresh module
- React hooks internals

## Hook Tests
```ts
import { renderHook, act } from '@testing-library/react';
import { useDarkMode } from '@/hooks/useDarkMode';

it('toggles dark class on documentElement', () => {
  const { result } = renderHook(() => useDarkMode());
  act(() => result.current.toggle());
  expect(document.documentElement.classList.contains('dark')).toBe(true);
});
```

## API Route Tests
Use `NextRequest` directly — no HTTP server needed with Vitest + Next.js route handler exports:
```ts
import { POST } from '@/app/api/auth/verify/route';
import { NextRequest } from 'next/server';

it('returns 429 when rate limited', async () => {
  // exhaust rate limit
  for (let i = 0; i < RATE_LIMIT_MAX; i++) {
    await POST(new NextRequest('http://localhost/api/auth/verify', { method: 'POST', body: JSON.stringify({ code: 'wrong' }) }));
  }
  const res = await POST(new NextRequest(...));
  expect(res.status).toBe(429);
});
```

## Component Tests
Test user-visible behavior, not implementation details:
```ts
// correct
expect(screen.getByRole('button', { name: 'コピー' })).toBeInTheDocument();

// wrong
expect(component.state.copied).toBe(true);
```

## Environment Variables in Tests
Set test-only values in `vitest.config.ts` or a setup file:
```ts
process.env.ACCESS_CODE = '1234';
process.env.COOKIE_SECRET = 'test-secret-minimum-32-characters!!';
```
Never use real production values in tests.
