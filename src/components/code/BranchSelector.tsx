'use client'

import { useState, useEffect, useCallback } from 'react'
import type { GitHubBranchInfo } from '@/lib/github/types'

interface BranchSelectorProps {
  repo: string | null
  selectedBranch: string | null
  onSelect: (branch: string) => void
  listBranches: (repo: string) => Promise<GitHubBranchInfo[]>
}

export function BranchSelector({ repo, selectedBranch, onSelect, listBranches }: BranchSelectorProps) {
  const [branches, setBranches] = useState<GitHubBranchInfo[]>([])
  const [loading, setLoading] = useState(false)

  const loadBranches = useCallback(async () => {
    if (!repo) {
      setBranches([])
      return
    }
    setLoading(true)
    try {
      const data = await listBranches(repo)
      setBranches(data)
    } catch {
      setBranches([])
    } finally {
      setLoading(false)
    }
  }, [repo, listBranches])

  useEffect(() => {
    loadBranches()
  }, [loadBranches])

  if (!repo) return null

  return (
    <select
      value={selectedBranch ?? ''}
      onChange={(e) => onSelect(e.target.value)}
      disabled={loading}
      aria-label="ブランチを選択"
      className="w-full px-2.5 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--surface)] text-[var(--foreground)] outline-none hover:border-slate-400 dark:hover:border-slate-500 transition-colors disabled:opacity-50 cursor-pointer"
    >
      {loading ? (
        <option value="">読み込み中...</option>
      ) : branches.length === 0 ? (
        <option value="">ブランチなし</option>
      ) : (
        branches.map((b) => (
          <option key={b.name} value={b.name}>
            {b.name}
          </option>
        ))
      )}
    </select>
  )
}
