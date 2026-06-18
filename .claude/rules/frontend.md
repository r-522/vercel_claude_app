# Frontend / UI Rules

Related: [react rules](./react.md), [accessibility rules](./accessibility.md)

## Tailwind and Theming
Use CSS custom properties for all themeable colors. Never hardcode `gray-800` or `white` for surfaces that differ between dark and light mode:

```tsx
// correct — adapts to dark/light mode automatically
className="bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)]"

// wrong — hardcoded, breaks in one mode
className="bg-white text-gray-900"
```

Available custom properties (defined in `globals.css`):
- `--background` — page background
- `--foreground` — primary text
- `--border` — border color
- `--surface` — card/panel background
- `--surface-hover` — hover state for surface elements
- `--text-muted` — secondary/dimmed text

## Dark Mode
Always use the `useDarkMode` hook from `src/hooks/useDarkMode.ts`. Never manage dark mode state locally:
```tsx
// correct
const { isDark, toggle } = useDarkMode();

// wrong — duplicates observer logic, breaks sync
const [isDark, setIsDark] = useState(false);
```
The hook uses a `MutationObserver` on `document.documentElement.classList` so all components stay in sync with the dark class toggled by `layout.tsx`'s inline script.

## Icons
Use inline SVG components defined in the same file as the component using them. Keep them small and named:
```tsx
function SunIcon() {
  return <svg aria-hidden="true" ...>...</svg>;
}
function MoonIcon() { ... }
function GearIcon() { ... }
```
Do not import an icon library for this project — the icon count is small and tree-shaking from large icon packs adds bundle complexity.

## Animations
Prefer Tailwind/CSS animations over JS:
- Loading indicators: `animate-pulse`, `animate-bounce` (LoadingDots component)
- State transitions: `transition-colors duration-200`
- Streaming cursor: CSS `@keyframes` in `globals.css`

Use JS animation only when CSS cannot express the behavior (e.g., height animation on dynamic content).

## Responsive Design
Mobile-first. Critical controls (model selector, submit button, dark mode toggle) must be visible and usable on small screens:
- Default styles target mobile
- Use `sm:` breakpoints for desktop enhancements
- Chat input and send button must be full-width on mobile
- Model/effort selectors collapse gracefully on narrow viewports

## Accessibility
Follow all rules in [accessibility rules](./accessibility.md). Summary for UI elements:
- Every icon-only button needs `aria-label`
- Effort level radio group needs `role="radiogroup"` + `role="radio"` + `aria-checked` per item
- Thinking toggle dropdown needs `aria-expanded`
- Decorative SVGs need `aria-hidden="true"`

## Class Concatenation
Follow the existing codebase pattern — join an array of class strings:
```tsx
// current project convention
className={[
  'base-class',
  condition ? 'active-class' : 'inactive-class',
  isDark ? 'dark-class' : '',
].join(' ')}
```
Do not add `clsx` or `cn` utility — keep the existing pattern consistent.

## Copy Buttons
Copy buttons on code blocks and messages follow this pattern:
- Hidden by default, visible on `group-hover` of the parent container
- Show "Copied!" feedback for exactly 2 seconds, then revert to copy icon
- Use `navigator.clipboard.writeText()` — no fallback needed for the target browser set

## Loading / Streaming States
- Full placeholder (before first token): use `<LoadingDots />` component
- Streaming in progress: CSS cursor animation appended to the last token
- Do not show a spinner and text simultaneously
- Stop button appears during active streaming; hidden otherwise
