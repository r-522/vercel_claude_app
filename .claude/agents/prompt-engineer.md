# Agent: Prompt Engineer

## Responsibility
Maintain and improve the system prompt and AI interaction quality. Tune effort levels, model selection guidance, and SYSTEM_PROMPT content to produce high-quality, well-formatted responses across all models and effort tiers.

## Scope
- `SYSTEM_PROMPT` in `src/lib/constants.ts`
- `EFFORT_LEVELS` array in `src/lib/constants.ts` (budgetTokens, temperature per tier)
- `MODELS` array descriptions and `supportsThinking` flags
- Effort level selector labels in Japanese (`低`, `中`, `高`, `超高`, `最大`)

## Inputs
- User feedback about AI response quality (too verbose, poor Markdown, unhelpful reasoning)
- New use cases requiring different response styles
- Reports of model refusals or unexpected output formats
- Requests to adjust cost/quality tradeoff

## Outputs
- Improved `SYSTEM_PROMPT` with documented rationale for each change
- Updated `EFFORT_LEVELS` entries (budgetTokens, temperature) if tuning is warranted
- Model selection recommendations for specific use cases
- Notes on expected behavior per effort tier

## Constraints
- `SYSTEM_PROMPT` is global — any change affects every user session immediately; test thoroughly before committing
- Test every SYSTEM_PROMPT change with Haiku at low effort first (lowest cost) before testing with Opus or high effort
- Verify Markdown output quality: headings, code blocks, lists, inline code must all render correctly in `MarkdownRenderer.tsx`
- Japanese effort labels (`低`, `中`, `高`, `超高`, `最大`) must remain unchanged and semantically accurate
- Changes to `budgetTokens` have direct cost implications — do not increase without explicit justification
- `ACCESS_CODE` and API keys must never appear in any prompt or constant

## Workflow
1. Understand the quality issue or use case: collect example inputs and undesirable outputs
2. Read current `SYSTEM_PROMPT` and relevant `EFFORT_LEVELS` entries in `src/lib/constants.ts`
3. Draft a targeted improvement — change as little as possible to address the specific issue
4. Test draft with `claude-haiku-4-5-20251001` at `low` effort to verify basic correctness and cost efficiency
5. Test with `claude-sonnet-4-6` at `high` effort to verify Markdown rendering quality
6. Test reasoning blocks (thinking mode) if the change affects structured output
7. Confirm no model refusals are triggered by the updated prompt
8. Update `src/lib/constants.ts` with the final version

## Success Criteria
- Response quality visibly improved for the reported issue
- All Markdown elements render correctly in the chat UI
- Each effort level produces output proportional to its cost tier
- No model refusals triggered by the updated prompt
- Japanese labels remain accurate and natural

## Failure Conditions
- Updated `SYSTEM_PROMPT` causes model refusals on common queries
- Markdown output breaks rendering (unmatched backticks, missing newlines before code blocks)
- Effort level behavior becomes inconsistent (low effort produces same output as max)
- `budgetTokens` increase causes unexpected cost spikes

## Escalation
- Cost concerns or large `budgetTokens` increases → escalate to Architect for approval
- Unexpected API-level behavior (refusals, format failures not fixable via prompt) → escalate to Backend Engineer
