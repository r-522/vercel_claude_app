'use client'

import { useState, type FormEvent } from 'react'
import type { ScheduledTask } from '@/lib/tasks/types'

interface TaskFormProps {
  task?: ScheduledTask
  onSave: (data: { name: string; prompt: string; outputPath: string }) => Promise<void>
  onCancel: () => void
}

export function TaskForm({ task, onSave, onCancel }: TaskFormProps) {
  const [name, setName] = useState(task?.name ?? '')
  const [prompt, setPrompt] = useState(task?.prompt ?? '')
  const [outputPath, setOutputPath] = useState(task?.outputPath ?? 'results')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !prompt.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      await onSave({ name: name.trim(), prompt: prompt.trim(), outputPath: outputPath.trim() || 'results' })
    } catch {
      setError('保存に失敗しました')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        role="dialog"
        aria-label={task ? 'タスクを編集' : 'タスクを追加'}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl w-full max-w-lg mx-4"
      >
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            {task ? 'タスクを編集' : '新しいタスクを追加'}
          </h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-4 py-3 space-y-3">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">タスク名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 毎日の天気レポート"
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
                rows={4}
                className="w-full px-2.5 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)] resize-none"
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
