# Accessibility Rules

Related: [frontend rules](./frontend.md)

## Interactive Elements
Every interactive element must have an accessible name — either visible text content or an `aria-label`.

## Icon-Only Buttons
Any button that displays only an icon (SVG, emoji) must have `aria-label` describing the action:
```tsx
<button aria-label="コピー" onClick={handleCopy}>
  <CopyIcon aria-hidden="true" />
</button>

<button aria-label="ダークモードを切り替え" onClick={toggle}>
  {isDark ? <SunIcon aria-hidden="true" /> : <MoonIcon aria-hidden="true" />}
</button>
```

## Custom Switches (Dark Mode Toggle)
```tsx
<button
  role="switch"
  aria-checked={isDark}
  aria-label="ダークモード"
  onClick={toggle}
>
```

## Custom Radio Groups (Effort Level Selector)
```tsx
<div role="radiogroup" aria-label="努力レベル">
  {EFFORT_LEVELS.map(level => (
    <button
      key={level.id}
      role="radio"
      aria-checked={selectedEffort === level.id}
      onClick={() => setEffort(level.id)}
    >
      {level.label}
    </button>
  ))}
</div>
```

## Dialogs and Dropdowns
Dropdown panels (ModelSettings, thinking toggle) use:
```tsx
<div
  role="dialog"
  aria-label="モデル設定"
>
```
The trigger button must have `aria-expanded={isOpen}` to communicate state to screen readers.

## Decorative SVGs
All SVG icons that are decorative (next to labeled text, or icon-only buttons where the button has `aria-label`) must be hidden from assistive technology:
```tsx
<svg aria-hidden="true" focusable="false" ...>
```
Never put `aria-label` on an SVG that is already inside a labeled button — it creates duplicate announcements.

## Color Contrast
CSS custom properties in `globals.css` must maintain WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text/UI components) in both light and dark mode. When modifying color values:
- Test `--foreground` against `--background` in both modes
- Test `--text-muted` against `--background` — this is the most commonly failing pair
- Test interactive element borders (`--border`) against `--background` (3:1 minimum)

## Keyboard Navigation
- `Enter` and `Space` must activate buttons (native `<button>` handles this automatically)
- Tab order must follow the visual reading order (top-left to bottom-right)
- Chat textarea: `Enter` submits, `Shift+Enter` inserts newline
- Never use `tabIndex` values other than `0` and `-1`
- `-1` is acceptable for elements controlled programmatically (e.g., hidden dropdown items)

## Focus Outlines
Never remove focus outline without providing a visible replacement:
```css
/* wrong */
button:focus { outline: none; }

/* acceptable */
button:focus-visible { outline: 2px solid var(--foreground); outline-offset: 2px; }
```
Use `:focus-visible` instead of `:focus` so mouse users are not affected.

## Screen Reader — Decorative Labels
The "Query" / "Result" message type labels in `MessageItem.tsx` are decorative — they duplicate information conveyed by position. Add `select-none` and `aria-hidden="true"` so screen readers skip them:
```tsx
<span aria-hidden="true" className="select-none text-xs text-[var(--text-muted)]">
  Query
</span>
```

## Reasoning Blocks
Collapsible reasoning sections must use a `<button>` (not a `<div onClick>`) with `aria-expanded` toggling correctly as the section opens and closes.
