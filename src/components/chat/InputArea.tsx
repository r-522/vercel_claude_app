'use client'

import { useRef, useEffect, type KeyboardEvent } from 'react'

interface InputAreaProps {
  value: string
  disabled: boolean
  onChange: (value: string) => void
  onSubmit: () => void
}

export function InputArea({ value, disabled, onChange, onSubmit }: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea to content
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [value])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) onSubmit()
    }
  }

  return (
    <div className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 sm:px-6 sm:py-4">
      <div className="max-w-3xl mx-auto">
        <div
          className={[
            'flex items-end gap-2 rounded-lg border px-4 py-3 transition-colors',
            'bg-[var(--background)]',
            disabled
              ? 'border-[var(--border)] opacity-70'
              : 'border-[var(--border)] focus-within:border-slate-400 dark:focus-within:border-slate-500',
          ].join(' ')}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Enter your query..."
            rows={1}
            aria-label="Query input"
            className="flex-1 resize-none bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] outline-none disabled:opacity-70 leading-relaxed"
            style={{ maxHeight: '200px' }}
          />

          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
            aria-label="Submit query"
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {/* Up-arrow icon */}
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M6 1L11 8H8.5V11H3.5V8H1L6 1Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
