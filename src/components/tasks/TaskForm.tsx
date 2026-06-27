'use client'

import { useState, type FormEvent } from 'react'
import { RepoSelector } from '@/components/code/RepoSelector'
import type { ScheduledTask } from '@/lib/tasks/types'
import type { GitHubRepoInfo } from '@/lib/github/types'

export interface TaskFormData {
  name: string
  prompt: string
  outputPath: string
  targetRepo?: string
  targetBranch?: string
  webSearch?: boolean
  schedule?: 'daily' | 'weekly'
  stateFilePath?: string
}

interface TaskFormProps {
  task?: ScheduledTask
  onSave: (data: TaskFormData) => Promise<void>
  onCancel: () => void
  listRepos: () => Promise<GitHubRepoInfo[]>
}

export function TaskForm({ task, onSave, onCancel, listRepos }: TaskFormProps) {
  const [name, setName] = useState(task?.name ?? '')
  const [prompt, setPrompt] = useState(task?.prompt ?? '')
  const [outputPath, setOutputPath] = useState(task?.outputPath ?? 'results')
  const [targetRepo, setTargetRepo] = useState(task?.targetRepo ?? '')
  const [targetBranch, setTargetBranch] = useState(task?.targetBranch ?? 'main')
  const [webSearch, setWebSearch] = useState(task?.webSearch ?? false)
  const [schedule, setSchedule] = useState<'daily' | 'weekly'>(task?.schedule ?? 'daily')
  const [stateFilePath, setStateFilePath] = useState(task?.stateFilePath ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !prompt.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      await onSave({
        name: name.trim(),
        prompt: prompt.trim(),
        outputPath: outputPath.trim() || 'results',
        ...(targetRepo ? { targetRepo: targetRepo.trim() } : {}),
        ...(targetBranch ? { targetBranch: targetBranch.trim() } : {}),
        webSearch,
        schedule,
        ...(stateFilePath.trim() ? { stateFilePath: stateFilePath.trim() } : {}),
      })
    } catch {
      setError('保存に失敗しました')
      setSaving(false)
    }
  }

  const handleRepoSelect = (repo: string, defaultBranch: string) => {
    setTargetRepo(repo)
    setTargetBranch(defaultBranch)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        role="dialog"
        aria-label={task ? 'タスクを編集' : 'タスクを追加'}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col"
      >
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            {task ? 'タスクを編集' : '新しいタスクを追加'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-4 py-3 space-y-3 overflow-y-auto flex-1">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">タスク名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: テック・トレンド日報"
                required
                className="w-full px-2.5 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">プロンプト</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="例: 東京の今日の天気を教えてください。"
                required
                rows={6}
                className="w-full px-2.5 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)] resize-none"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                結果の保存先リポジトリ
                <span className="ml-1 text-[var(--text-muted)]">(空欄: タスク設定リポジトリ)</span>
              </label>
              <RepoSelector
                selectedRepo={targetRepo || null}
                onSelect={handleRepoSelect}
                listRepos={listRepos}
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">保存先ブランチ</label>
              <input
                type="text"
                value={targetBranch}
                onChange={(e) => setTargetBranch(e.target.value)}
                placeholder="main"
                className="w-full px-2.5 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                結果の保存先パス
                <span className="ml-1 text-[var(--text-muted)]">(リポジトリ内)</span>
              </label>
              <input
                type="text"
                value={outputPath}
                onChange={(e) => setOutputPath(e.target.value)}
                placeholder="results"
                className="w-full px-2.5 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)]"
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                結果は {outputPath || 'results'}/YYYY-MM-DD/タスクID.md に保存されます
              </p>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-[var(--foreground)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={webSearch}
                  onChange={(e) => setWebSearch(e.target.checked)}
                  className="accent-blue-600"
                />
                Web検索を有効にする
              </label>
            </div>

            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">実行頻度</label>
              <div role="radiogroup" aria-label="実行頻度" className="flex gap-3">
                <label className="flex items-center gap-1.5 text-xs text-[var(--foreground)] cursor-pointer">
                  <input
                    type="radio"
                    name="schedule"
                    checked={schedule === 'daily'}
                    onChange={() => setSchedule('daily')}
                    className="accent-blue-600"
                  />
                  毎日
                </label>
                <label className="flex items-center gap-1.5 text-xs text-[var(--foreground)] cursor-pointer">
                  <input
                    type="radio"
                    name="schedule"
                    checked={schedule === 'weekly'}
                    onChange={() => setSchedule('weekly')}
                    className="accent-blue-600"
                  />
                  毎週
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                状態ファイルパス
                <span className="ml-1 text-[var(--text-muted)]">(任意)</span>
              </label>
              <input
                type="text"
                value={stateFilePath}
                onChange={(e) => setStateFilePath(e.target.value)}
                placeholder="例: _state/language.json"
                className="w-full px-2.5 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)]"
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                実行間で永続化する状態を管理するファイル（言語ローテーション等）
              </p>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <div className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] rounded hover:bg-[var(--surface-hover)] transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !prompt.trim() || saving}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
