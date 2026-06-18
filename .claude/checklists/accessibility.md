# Accessibility Checklist

Run when adding or modifying any UI component.

---

## Buttons & Interactive Controls

- [ ] Gear/settings button has `aria-label` (e.g., `aria-label="設定"`)
- [ ] Sun/moon dark-mode toggle button has `aria-label` that reflects current state (e.g., `aria-label="ダークモードをオフにする"`)
- [ ] Paperclip image-attach button has `aria-label` (e.g., `aria-label="画像を添付"`)
- [ ] Submit/send arrow button has `aria-label` (e.g., `aria-label="送信"`)
- [ ] "新しいセッション" and sign-out buttons have visible text — no additional `aria-label` needed unless icon-only

---

## Custom Widgets

- [ ] Thinking toggle switch has `role="switch"` and `aria-checked` reflecting its boolean state
- [ ] Effort level radio group has `role="radiogroup"` on the container and `role="radio"` + `aria-checked` on each option (低/中/高/超高/最大)
- [ ] Settings/ModelSettings dropdown has `role="dialog"` (or `role="menu"` if appropriate) and `aria-label`
- [ ] When the settings dropdown is open, focus is trapped inside it or moves to the first interactive element

---

## Images & Decorative Elements

- [ ] Decorative SVG icons (logos, separators, flourishes) have `aria-hidden="true"`
- [ ] Functional SVG icons inside labelled buttons do not need their own `aria-label` (the button label is sufficient)
- [ ] Attached image thumbnails have `alt` text describing them (or `alt=""` if purely decorative)

---

## Loading & Live Regions

- [ ] `LoadingDots` component is either `aria-hidden="true"` (if a text status is announced elsewhere) or has an `aria-label` like `"読み込み中"`
- [ ] Streaming assistant response: consider whether a live region (`aria-live="polite"`) is appropriate for screen-reader users

---

## Non-Interactive Text

- [ ] "Query" / "Result" (or Japanese equivalents) label elements have `select-none` / `user-select: none` so double-clicking to select message text does not accidentally select the label

---

## Keyboard Navigation

- [ ] All actions (submit, attach image, toggle dark mode, change model, change effort, toggle thinking, new session, sign out) are reachable and operable without a mouse
- [ ] Tab order follows visual reading order
- [ ] No keyboard focus traps except intentional ones (open dialog)

---

## Colour & Contrast

- [ ] Body text on `--background` meets WCAG AA (4.5:1) in both light and dark modes
- [ ] Muted text (`--text-muted`) on `--background` meets WCAG AA (4.5:1) — or is used only for decorative/supplementary content
- [ ] Syntax-highlighted code in `CodeBlock` has sufficient contrast in both Prism light and dark themes

---

## Language

- [ ] `<html lang="ja">` is set in `layout.tsx` (already done — verify it has not been changed)
- [ ] Japanese strings are grammatically correct and natural; no machine-translated approximations introduced
