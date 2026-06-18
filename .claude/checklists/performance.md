# Performance Checklist

Run when making UI changes or adding new components.

---

## Stable References (prevent unnecessary re-renders)

- [ ] `REMARK_PLUGINS` is defined at module level in `src/components/chat/MarkdownRenderer.tsx` — not inside the component body, a custom hook, or a render helper
- [ ] `MD_COMPONENTS` is defined at module level in `src/components/chat/MarkdownRenderer.tsx` — same requirement
- [ ] `ACCEPT_TYPES` (file input accept string) is defined at module level in `src/components/chat/InputArea.tsx`
- [ ] No object literals (e.g., `style={{ }}`, `className` objects) or arrow functions (e.g., `onClick={() => ...}`) are written directly in JSX props of components that render on every keystroke or scroll event
- [ ] New constants that are truly static (not derived from props or state) are lifted to module level

---

## Memory Management

- [ ] `useImageAttachments` — `URL.revokeObjectURL(url)` is called in `remove()` for the individual URL being removed
- [ ] `useImageAttachments` — `URL.revokeObjectURL(url)` is called for every URL in `clear()`
- [ ] `useImageAttachments` — `useEffect` cleanup function revokes all currently held Blob URLs on component unmount
- [ ] `useDarkMode` — `MutationObserver.disconnect()` is called in the `useEffect` cleanup return
- [ ] Any new `useEffect` that creates a timer (`setTimeout` / `setInterval`), event listener, or subscription has a corresponding cleanup that clears/removes/unsubscribes

---

## Bundle Size

- [ ] `npm run build` — inspect "First Load JS" per route; pages should not have grown significantly
- [ ] `react-syntax-highlighter` theme imported from the deep path `/dist/esm/styles/prism/<theme>` rather than a top-level barrel that pulls in all themes
- [ ] No new large dependencies added without confirming they are tree-shakeable or justified by the feature

---

## Rendering Efficiency

- [ ] `MessageList.tsx` auto-scroll uses a ref + `useEffect` (not a state update that triggers a re-render)
- [ ] Model/effort/thinking values read inside the transport `fetch` callback use refs (`modelRef.current`, `effortRef.current`, `thinkingRef.current`) — not state that would recreate the transport
- [ ] `useChat` transport `useMemo` dependency array remains `[]` (recreating transport on every render would break streaming)
