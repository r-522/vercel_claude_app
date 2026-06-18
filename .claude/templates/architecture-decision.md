# ADR-NNN: [Title]

**Date:** YYYY-MM-DD
**Status:** proposed | accepted | deprecated | superseded by ADR-NNN

---

## Context
<!-- What problem or situation prompted this decision?
     Describe constraints, forces, and the state of the system before the decision. -->

## Decision
<!-- What was decided? State clearly and in the active voice.
     "We will…" or "The system uses…" -->

## Consequences
### Pros
-
-

### Cons
-
-

## Alternatives Considered
| Alternative | Why Rejected |
|-------------|-------------|
| | |

## Related Decisions
<!-- Link to other ADRs that this one depends on, conflicts with, or supersedes -->
-

---

# Example — ADR-001: Stable Transport via useMemo + Refs

**Date:** 2025-01-01
**Status:** accepted

## Context

`useChat` from the `ai` SDK initializes its transport once at mount time. Recreating the
transport object when the user changes the model or effort level causes `useChat` to be
reinitialised, losing the message history and producing a flash. The model/effort values
need to be readable at the moment each request fires, not captured at hook initialization.

## Decision

The `ChatInterface` component creates the transport exactly once with `useMemo` (empty
dependency array, ESLint disable comment is intentional). Model, effort, and thinking
state are stored in `useRef` values (`modelRef`, `effortRef`, `thinkingRef`). The transport
closure reads from the refs at call time, so it always sees the latest UI state without
requiring transport recreation.

## Consequences

### Pros
- Message history survives model/effort changes.
- No unnecessary `useChat` teardown/reinitialisation.
- Clean separation: display state in `useState`, request-time state in `useRef`.

### Cons
- The `useMemo` empty-dep ESLint disable is a permanent intentional exception that must
  not be "fixed" by future contributors.
- New per-request state (e.g., a system prompt override) must be threaded through refs,
  not state.

## Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| Recreate transport on model change | Resets message history; produces visible flash |
| Pass model/effort as `useChat` body fields | `useChat` does not support dynamic per-call overrides on the transport level |
| Single global transport singleton | Would require module-level state, breaking HMR and multi-instance scenarios |

## Related Decisions
- ADR-002 (if created): Ref pattern for image attachments lifecycle
