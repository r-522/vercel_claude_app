# Bug Report

## Title
<!-- One-line summary: component + symptom, e.g. "InputArea: image paste crashes on Firefox" -->

## Severity
- [ ] critical — app unusable / data loss / security breach
- [ ] high     — major feature broken, no workaround
- [ ] medium   — feature degraded, workaround exists
- [ ] low      — cosmetic or rare edge case

## Description
<!-- What is broken? State the observable failure clearly. -->

## Steps to Reproduce
1.
2.
3.

## Expected Behavior
<!-- What should happen? -->

## Actual Behavior
<!-- What actually happens? Include error messages verbatim if any. -->

## Environment
| Field | Value |
|-------|-------|
| Model | <!-- e.g. claude-haiku-4-5-20251001 / Sonnet 4.6 / Opus 4.6 --> |
| Effort Level | <!-- low / medium / high / xhigh / max --> |
| Extended Thinking | <!-- on / off --> |
| Dark Mode | <!-- on / off --> |
| Browser | <!-- e.g. Chrome 125, Safari 17, Firefox 127 --> |
| Vercel environment | <!-- production / preview / local dev --> |

## Relevant Logs
<!-- Paste browser console errors, Next.js server logs, or Vercel function logs.
     Remove any sensitive values (API keys, cookie contents). -->
```
(paste here)
```

## Affected Component
<!-- Select the most specific entry -->
- [ ] ChatInterface.tsx
- [ ] MessageList.tsx
- [ ] MessageItem.tsx
- [ ] InputArea.tsx
- [ ] MarkdownRenderer.tsx / CodeBlock.tsx
- [ ] ModelSettings.tsx
- [ ] useChat / transport (ai SDK)
- [ ] useDarkMode hook
- [ ] useImageAttachments hook
- [ ] api/chat/route.ts
- [ ] api/auth/verify or logout
- [ ] proxy.ts (middleware / JWT)
- [ ] Other: ___

## First Seen
<!-- Date or approximate date when the bug was first observed -->

## Workaround
<!-- If a workaround exists, describe it. Otherwise write "None." -->
