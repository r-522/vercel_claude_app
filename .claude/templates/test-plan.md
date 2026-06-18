# Test Plan: [Feature / Component Under Test]

**Date:** YYYY-MM-DD
**Author:**
**Related PR / Issue:**

---

## Test Scope
<!-- What is being tested? State the component(s) and behavior boundaries. -->

## Out of Scope
<!-- What is explicitly NOT tested here, and why? -->
-

---

## Test Cases

| ID | Scenario | Steps | Expected Result | Status |
|----|----------|-------|-----------------|--------|
| TC-01 | | 1. <br>2. | | pending |
| TC-02 | | 1. <br>2. | | pending |

*Status values: pending / pass / fail / blocked*

---

## Happy Path Tests
<!-- Core successful flows. One row per test. -->

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| HP-01 | Send message with default model (Haiku 4.5) and high effort | 1. Open app. <br>2. Type a message. <br>3. Press Enter. | Streaming response appears; loading dots show while streaming |
| HP-02 | Switch to Sonnet 4.6, enable extended thinking | 1. Open ModelSettings. <br>2. Select Sonnet 4.6. <br>3. Toggle thinking on. <br>4. Send message. | Response includes reasoning block; model switch does not reset history |
| HP-03 | Attach image and send | 1. Click attach in InputArea. <br>2. Select image. <br>3. Send. | Image thumbnail shown; message sent with image content |
| HP-04 | Toggle dark mode | 1. Click dark mode button. | documentElement class toggles; all surfaces use CSS custom properties |

## Edge Cases

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| EC-01 | Send empty message | 1. Leave textarea blank. <br>2. Press Enter or Submit. | Submit is a no-op; no API call made |
| EC-02 | Very long message (>4000 chars) | 1. Paste large text block. <br>2. Send. | Textarea scrolls; request fires; response streams normally |
| EC-03 | Rapid model switching during stream | 1. Start a response. <br>2. Switch model while streaming. | In-flight stream uses original model (ref captured); UI updates modelRef for next send |
| EC-04 | Multiple image attachments | 1. Attach 3 images. <br>2. Send. | All 3 included; Blob URLs revoked after send via useImageAttachments |

## Auth / Security Tests

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| AS-01 | Access app without valid JWT cookie | 1. Clear cookies. <br>2. Navigate to /. | Middleware (proxy.ts) redirects to /auth |
| AS-02 | Submit wrong access code | 1. Go to /auth. <br>2. Enter wrong 4-digit code. <br>3. Submit. | Error shown; rate limit counter incremented; no JWT set |
| AS-03 | Exceed rate limit (5 attempts) | 1. Submit wrong code 5 times. | Subsequent requests blocked; 429 returned before code comparison |
| AS-04 | Submit invalid model ID from API client | 1. POST to /api/chat with model: "gpt-4". | 400 response; ALLOWED_MODEL_IDS check rejects request |
| AS-05 | Logout | 1. Click logout (if available). <br>2. POST to /api/auth/logout. | Cookie cleared; redirect to /auth |

## Dark Mode Tests

| ID | Scenario | Expected |
|----|----------|----------|
| DM-01 | Initial load with OS dark preference | documentElement has `dark` class; all custom properties render correctly |
| DM-02 | Toggle light → dark | CSS variables (--background, --surface, --border, --text-muted) switch; no FOUC |
| DM-03 | Code block in dark mode | CodeBlock uses dark Prism theme |
| DM-04 | Code block in light mode | CodeBlock uses light Prism theme |

## Mobile Tests

| ID | Scenario | Expected |
|----|----------|----------|
| MB-01 | Textarea on iOS Safari | Virtual keyboard appears; layout does not break; InputArea remains above keyboard |
| MB-02 | Image attach on mobile | File picker opens; selected image attaches correctly |
| MB-03 | Long code block on narrow screen | Horizontal scroll on CodeBlock; does not overflow page |

---

## Notes
<!-- Any additional context, known flakiness, or environment setup required -->
