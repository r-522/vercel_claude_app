'use client'

import { useState, useEffect, useCallback } from 'react'
import type { GitHubRepoInfo } from '@/lib/github/types'

interface RepoSelectorProps {
  selectedRepo: string | null
  onSelect: (repo: string, defaultBranch: string) => void
  listRepos: () => Promise<GitHubRepoInfo[]>
}

export function RepoSelector({ selectedRepo, onSelect, listRepos }: RepoSelectorProps) {
  const [repos, setRepos] = useState<GitHubRepoInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('')
  const [open, setOpen] = useState(false)

  const loadRepos = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listRepos()
      setRepos(data)
    } catch {
      setRepos([])
    } finally {
      setLoading(false)
    }
  }, [listRepos])

  useEffect(() => {
    loadRepos()
  }, [loadRepos])

  const filtered = filter
    ? repos.filter((r) => r.fullName.toLowerCase().includes(filter.toLowerCase()))
    : repos

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors text-left"
        aria-expanded={open}
        aria-label="リポジトリを選択"
      >
        <span className="truncate text-[var(--foreground)]">
          {selectedRepo ?? 'リポジトリを選択'}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[var(--surface)] border border-[var(--border)] rounded shadow-lg max-h-64 overflow-hidden flex flex-col">
          <div className="p-1.5 border-b border-[var(--border)]">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="検索..."
              className="w-full px-2 py-1 text-xs bg-[var(--background)] border border-[var(--border)] rounded outline-none text-[var(--foreground)] placeholder:text-[var(--text-muted)]"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto">
            {loading ? (
              <div className="px-3 py-2 text-xs text-[var(--text-muted)]">読み込み中...</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-[var(--text-muted)]">
                {filter ? '一致するリポジトリがありません' : 'リポジトリがありません'}
              </div>
            ) : (
              filtered.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => {
                    onSelect(repo.fullName, repo.defaultBranch)
                    setOpen(false)
                    setFilter('')
                  }}
                  className={[
                    'w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-2',
                    selectedRepo === repo.fullName ? 'bg-[var(--surface-hover)]' : '',
                  ].join(' ')}
                >
                  <span className="truncate text-[var(--foreground)]">{repo.fullName}</span>
                  {repo.private && (
                    <span className="flex-shrink-0 text-[10px] text-[var(--text-muted)] border border-[var(--border)] rounded px-1">
                      private
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="currentColor"
      aria-hidden="true"
      className={['transition-transform flex-shrink-0', open ? 'rotate-180' : ''].join(' ')}
    >
      <path d="M2 3.5L5 6.5L8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
