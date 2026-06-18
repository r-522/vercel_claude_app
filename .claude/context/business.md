# Business Context

## Use Case
Personal or small-team knowledge base and research tool powered by Claude. Enables rapid Q&A, document analysis, coding assistance, and exploratory research via multi-turn chat. Extended thinking mode (xhigh/max effort) supports deeper reasoning tasks.

## Japanese Language Context
- UI is fully Japanese-localized (labels, placeholders, effort level names: 低/中/高/超高/最大)
- `lang="ja"` set on `<html>` in layout.tsx
- Target audience is likely Japanese-speaking; do not remove or replace Japanese labels with English
- System prompt and error messages are in English (internal, not shown to users)

## Operational Model
- Self-hosted on Vercel free/pro tier
- Anthropic API costs paid by the project owner
- No third-party data processing beyond Anthropic's API

## Cost Drivers
API costs are the primary (and only) operating cost. Two levers control cost:
1. **Model choice**: Haiku (cheapest) → Sonnet → Opus (most expensive). Default is Haiku.
2. **Effort level**: Maps to `budgetTokens` for extended thinking. Higher effort = more thinking tokens = higher cost. Default effort is `high` (6000 tokens).

Cost-aware usage: use Haiku + low/medium effort for routine queries; Opus + max effort only when deep reasoning is needed.

## Feature Priorities
1. **Reliability** — auth, streaming, and error handling must never silently fail
2. **Performance** — fast first token, smooth streaming, no layout jank
3. **Features** — new capabilities added only when reliable and non-breaking

## Access Control
- Single shared ACCESS_CODE (4-digit)
- Not multi-user: no per-user rate limits, no per-user history, no roles
- Rate limit is IP-based (in-memory, per Vercel instance)
- If the code needs to change, update the Vercel environment variable and redeploy

## Business Rules
- Never expose ACCESS_CODE or COOKIE_SECRET in client-side code
- Generic error messages from auth endpoints (no enumeration of valid/invalid states)
- Rate limit enforced before code comparison (security, not business logic)
