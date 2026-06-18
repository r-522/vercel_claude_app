# Testing Checklist

Manual testing steps to run before merging (no automated test suite exists).

---

## Auth Flow

- [ ] Navigate to `/` while unauthenticated — redirected to `/auth`
- [ ] Enter the correct 4-digit access code — redirected to `/` (chat page loads)
- [ ] Enter a wrong code — error message displayed, code input cleared
- [ ] Enter wrong code 3 times in a row — still shows error (not locked out yet at 3)
- [ ] Attempt login 10+ times rapidly — rate limit error message appears (no code comparison attempted)
- [ ] Click sign-out button — redirected to `/auth`, JWT cookie cleared, `/` redirects back to `/auth`

---

## Chat — Basic Text

- [ ] Select model **Haiku 4.5**, send a short text message — response streams in
- [ ] Select model **Sonnet 4.6**, send a short text message — response streams in
- [ ] Select model **Opus 4.6**, send a short text message — response streams in
- [ ] Click "新しいセッション" (new session) — message list clears, input is empty

---

## Chat — Images

- [ ] Click the paperclip icon, select a JPEG — thumbnail appears in input area
- [ ] Paste an image (Ctrl+V) — thumbnail appears in input area
- [ ] Send the message with the attached image — assistant receives and responds to the image
- [ ] Remove an attached image thumbnail — thumbnail disappears, no console errors (Blob URL revoked)

---

## Thinking / Extended Reasoning

- [ ] Select model **Opus 4.6**, open ModelSettings, enable the thinking toggle
- [ ] Send a complex query (e.g., multi-step math or logic puzzle)
- [ ] Reasoning block appears above the assistant answer
- [ ] Click the reasoning block header — it collapses; click again — it expands
- [ ] Select model **Haiku 4.5** — thinking toggle is disabled/hidden (Haiku does not support thinking)

---

## Effort Levels

- [ ] Change effort to **低 (low)** — request completes (budgetTokens: 1024)
- [ ] Change effort to **最大 (max)** with thinking enabled — request completes (budgetTokens: 24000)
- [ ] Change effort mid-session — next message uses new effort, previous messages unaffected

---

## Dark Mode

- [ ] Click the sun/moon toggle — UI switches between light and dark
- [ ] Reload the page — dark/light preference is preserved
- [ ] In dark mode, `CodeBlock` renders with the dark Prism theme; in light mode it renders with the light theme
- [ ] Toggle dark mode while a streaming response is in progress — no visual glitches

---

## Keyboard & Mobile

- [ ] Press **Enter** in the text area — message is submitted
- [ ] Press **Shift+Enter** in the text area — inserts a newline without submitting
- [ ] Resize browser to 375 px width — input area, model selector, and message list all render without overflow
- [ ] On narrow viewport, settings dropdown opens and is fully visible/usable
