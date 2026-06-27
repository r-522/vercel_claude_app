'use client'

import { useState } from 'react'
import type { ScheduledTask } from '@/lib/tasks/types'

interface TaskListProps {
  tasks: ScheduledTask[]
  repo: string
  onToggle: (id: string, enabled: boolean) => Promise<void>
  onEdit: (task: ScheduledTask) => void
  onDelete: (id: string) => Promise<void>
  onRun: (id: string) => Promise<void>
  onViewResults: (task: ScheduledTask) => void
}

export function TaskList({ tasks, repo, onToggle, onEdit, onDelete, onRun, onViewResults }: TaskListProps) {
  const [runningId, setRunningId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<{ id: string; resultPath: string } | null>(null)

  const handleToggle = async (task: ScheduledTask) => {
    if (togglingId) return
    setTogglingId(task.id)
    try {
      await onToggle(task.id, !task.enabled)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (deletingId) return
    if (!confirm('このタスクを削除しますか？')) return
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  const handleRun = async (task: ScheduledTask) => {
    if (runningId) return
    setRunningId(task.id)
    setRunResult(null)
    try {
      await onRun(task.id)
      const dateStr = new Date().toISOString().split('T')[0]!
      setRunResult({ id: task.id, resultPath: `${task.outputPath}/${dateStr}/${task.id}.md` })
    } catch {
      // error shown by parent
    } finally {
      setRunningId(null)
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] text-sm">
        <p>タスクがありません</p>
        <p className="text-xs mt-1">「タスクを追加」から最初のタスクを作成してください</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-4">
      <p className="text-[10px] text-[var(--text-muted)]">管理リポジトリ: {repo}</p>
      {runResult && (
        <div className="text-xs px-2.5 py-2 rounded bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 flex items-center justify-between">
          <span>実行完了 — 結果: {runResult.resultPath}</span>
          <button onClick={() => setRunResult(null)} aria-label="閉じる" className="ml-2 underline">
            閉じる
          </button>
        </div>
      )}
      {tasks.map((task) => (
        <div key={task.id} className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <button
                role="switch"
                aria-checked={task.enabled}
                aria-label={task.enabled ? '無効にする' : '有効にする'}
                onClick={() => handleToggle(task)}
                disabled={togglingId === task.id}
                className={[
                  'mt-0.5 flex-shrink-0 w-7 h-4 rounded-full transition-colors relative disabled:opacity-50',
                  task.enabled ? 'bg-blue-600' : 'bg-[var(--border)]',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform',
                    task.enabled ? 'translate-x-3.5' : 'translate-x-0.5',
                  ].join(' ')}
                />
              </button>

              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--foreground)] truncate">{task.name}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-2">{task.prompt}</p>

                <div className="flex flex-wrap gap-1.5 mt-1">
                  {task.targetRepo && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                      {task.targetRepo}
                    </span>
                  )}
                  {task.schedule === 'weekly' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                      毎週
                    </span>
                  )}
                  {task.webSearch && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400">
                      Web検索
                    </span>
                  )}
                  {task.stateFilePath && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                      状態管理
                    </span>
                  )}
                </div>

                {task.lastRunAt && (
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    最終実行: {new Date(task.lastRunAt).toLocaleString('ja-JP')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onViewResults(task)}
                aria-label="結果を見る"
                title="結果を見る"
                className="p-1 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded transition-colors"
              >
                <EyeIcon />
              </button>
              <button
                onClick={() => handleRun(task)}
                disabled={!!runningId}
                aria-label="今すぐ実行"
                title="今すぐ実行"
                className="p-1 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded transition-colors disabled:opacity-50"
              >
                {runningId === task.id ? (
                  <span className="text-[10px]">実行中</span>
                ) : (
                  <RunIcon />
                )}
              </button>
              <button
                onClick={() => onEdit(task)}
                aria-label="編集"
                className="p-1 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded transition-colors"
              >
                <EditIcon />
              </button>
              <button
                onClick={() => handleDelete(task.id)}
                disabled={deletingId === task.id}
                aria-label="削除"
                className="p-1 text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--surface-hover)] rounded transition-colors disabled:opacity-50"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M1 6C1 6 3 2.5 6 2.5C9 2.5 11 6 11 6C11 6 9 9.5 6 9.5C3 9.5 1 6 1 6Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="6" r="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function RunIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      <path d="M3 2.5L9.5 6L3 9.5V2.5Z" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M8.5 2L10 3.5L4.5 9H3V7.5L8.5 2Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M2 3H10M4.5 3V2H7.5V3M5 5.5V9M7 5.5V9M3 3L3.5 10H8.5L9 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
