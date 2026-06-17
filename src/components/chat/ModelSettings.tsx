'use client'

import { useEffect, useRef } from 'react'
import { EFFORT_LEVELS } from '@/lib/constants'
import type { EffortId } from '@/lib/constants'

interface ModelSettingsProps {
  effort: EffortId
  thinking: boolean
  supportsThinking: boolean
  onEffortChange: (id: EffortId) => void
  onThinkingChange: (v: boolean) => void
  onClose: () => void
}

export function ModelSettings({
  effort,
  thinking,
  supportsThinking,
  onEffortChange,
  onThinkingChange,
  onClose,
}: ModelSettingsProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-1 w-64 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg z-50 py-1"
      role="dialog"
      aria-label="Model settings"
    >
      {/* Effort section */}
      <div className="px-3 pt-2 pb-1">
        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">
          エフォート
        </p>
      </div>

      <ul role="radiogroup" aria-label="Effort level">
        {EFFORT_LEVELS.map((level) => {
          const selected = effort === level.id
          return (
            <li key={level.id}>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={!supportsThinking && level.id !== 'low'}
                onClick={() => {
                  if (supportsThinking || level.id === 'low') onEffortChange(level.id as EffortId)
                }}
                className={[
                  'w-full flex items-center justify-between px-3 py-2 text-left transition-colors',
                  supportsThinking
                    ? 'hover:bg-[var(--surface-hover)] cursor-pointer'
                    : 'opacity-40 cursor-not-allowed',
                  selected && supportsThinking ? 'text-[var(--foreground)]' : 'text-[var(--text-muted)]',
                ].join(' ')}
              >
                <div>
                  <span className="text-sm font-medium text-[var(--foreground)]">{level.label}</span>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-tight">
                    {level.description}
                  </p>
                </div>
                {selected && supportsThinking && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="flex-shrink-0 text-[var(--foreground)]"
                    aria-hidden="true"
                  >
                    <polyline points="2 7 5.5 10.5 12 3" />
                  </svg>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mx-3 my-1 border-t border-[var(--border)]" />

      {/* Thinking toggle */}
      <div className="px-3 py-2">
        <div
          className={[
            'flex items-center justify-between',
            !supportsThinking ? 'opacity-40' : '',
          ].join(' ')}
        >
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">思考</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              より複雑なタスクに対して思考します
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={thinking}
            disabled={!supportsThinking}
            onClick={() => supportsThinking && onThinkingChange(!thinking)}
            className={[
              'relative flex-shrink-0 w-9 h-5 rounded-full transition-colors focus:outline-none',
              thinking && supportsThinking
                ? 'bg-slate-700 dark:bg-slate-300'
                : 'bg-slate-300 dark:bg-slate-600',
              !supportsThinking ? 'cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
            aria-label="思考を有効にする"
          >
            <span
              className={[
                'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 shadow transition-transform',
                thinking && supportsThinking ? 'translate-x-4' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
