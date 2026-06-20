'use client'

import type { FileChange } from '@/lib/github/types'

interface ChangeReviewProps {
  changes: FileChange[]
  onToggleStage: (path: string) => void
  onClearAll: () => void
}

export function ChangeReview({ changes, onToggleStage, onClearAll }: ChangeReviewProps) {
  const stagedCount = changes.filter((c) => c.staged).length

  if (changes.length === 0) return null

  return (
    <div className="border-t border-[var(--border)]">
      <div className="flex items-center justify-between px-2.5 py-1.5">
        <span className="text-xs font-medium text-[var(--foreground)]">
          変更ファイル ({stagedCount}/{changes.length})
        </span>
        {changes.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            クリア
          </button>
        )}
      </div>
      <div className="max-h-40 overflow-y-auto">
        {changes.map((change) => (
          <button
            key={change.path}
            onClick={() => onToggleStage(change.path)}
            className={[
              'w-full text-left flex items-center gap-2 px-2.5 py-1 text-xs hover:bg-[var(--surface-hover)] transition-colors',
              change.staged ? 'text-[var(--foreground)]' : 'text-[var(--text-muted)]',
            ].join(' ')}
          >
            <span className="flex-shrink-0 w-3.5 h-3.5 border rounded flex items-center justify-center border-[var(--border)]">
              {change.staged && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
                  <path d="M8.5 2.5L4 7L1.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className="truncate">{change.path}</span>
            <span className="flex-shrink-0 text-[10px] text-[var(--text-muted)] ml-auto">{change.language}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
