'use client'

import { useState, useCallback } from 'react'
import type { GitHubRepoInfo } from '@/lib/github/types'
import { RepoSelector } from '@/components/code/RepoSelector'

interface TaskSetupProps {
  listRepos: () => Promise<GitHubRepoInfo[]>
  onConfigured: (repo: string, branch: string) => void
}

export function TaskSetup({ listRepos, onConfigured }: TaskSetupProps) {
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null)
  const [branch, setBranch] = useState('main')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelect = useCallback((repo: string, defaultBranch: string) => {
    setSelectedRepo(repo)
    setBranch(defaultBranch)
  }, [])

  const handleSave = async () => {
    if (!selectedRepo || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/tasks/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: selectedRepo, branch }),
      })
      if (!res.ok) throw new Error('設定の保存に失敗しました')
      onConfigured(selectedRepo, branch)
    } catch {
      setError('設定の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="w-full max-w-md space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">タスク設定</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            スケジュールタスクと結果を保存するGitHubリポジトリを選択してください。
            タスクは <code className="text-[10px] bg-[var(--surface)] px-1 py-0.5 rounded">.claude-tasks/tasks.json</code> に保存されます。
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs text-[var(--text-muted)]">リポジトリ</label>
          <RepoSelector selectedRepo={selectedRepo} onSelect={handleSelect} listRepos={listRepos} />
        </div>

        <div className="space-y-2">
          <label className="block text-xs text-[var(--text-muted)]">ブランチ</label>
          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="main"
            className="w-full px-2.5 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)]"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleSave}
          disabled={!selectedRepo || !branch.trim() || saving}
          className="w-full px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '保存中...' : '設定を保存'}
        </button>
      </div>
    </div>
  )
}
