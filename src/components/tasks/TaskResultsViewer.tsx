'use client'

import { useState, useEffect, useCallback } from 'react'
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer'
import type { ScheduledTask } from '@/lib/tasks/types'
import type { GitHubContentInfo } from '@/lib/github/types'

interface TaskResultsViewerProps {
  task: ScheduledTask
  configRepo: string
  configBranch: string
  onClose: () => void
}

export function TaskResultsViewer({ task, configRepo, configBranch, onClose }: TaskResultsViewerProps) {
  const repo = task.targetRepo || configRepo
  const branch = task.targetBranch || configBranch

  const [dates, setDates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [contentLoading, setContentLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ repo, ref: branch, path: task.outputPath })
      const res = await fetch(`/api/github/contents?${params.toString()}`)
      if (!res.ok) {
        if (res.status === 404) {
          setDates([])
          return
        }
        throw new Error('Failed to fetch')
      }
      const entries = await res.json() as GitHubContentInfo[]
      const dateDirs = entries
        .filter((e) => e.type === 'dir')
        .map((e) => e.name)
        .sort()
        .reverse()
      setDates(dateDirs)
    } catch {
      setError('結果の取得に失敗しました')
      setDates([])
    } finally {
      setLoading(false)
    }
  }, [repo, branch, task.outputPath])

  useEffect(() => { fetchDates() }, [fetchDates])

  const fetchContent = async (date: string) => {
    setSelectedDate(date)
    setContentLoading(true)
    setContent(null)
    try {
      // First list files in the date folder
      const listParams = new URLSearchParams({ repo, ref: branch, path: `${task.outputPath}/${date}` })
      const listRes = await fetch(`/api/github/contents?${listParams.toString()}`)
      if (!listRes.ok) throw new Error('Failed to list')

      const entries = await listRes.json() as GitHubContentInfo[]
      const mdFile = entries.find((e) => e.type === 'file' && e.name.endsWith('.md'))
      if (!mdFile) {
        setContent('結果ファイルが見つかりません')
        return
      }

      const fileParams = new URLSearchParams({ repo, ref: branch, path: mdFile.path, mode: 'file' })
      const fileRes = await fetch(`/api/github/contents?${fileParams.toString()}`)
      if (!fileRes.ok) throw new Error('Failed to fetch file')

      const data = await fileRes.json() as { content: string }
      setContent(data.content)
    } catch {
      setContent('ファイルの読み込みに失敗しました')
    } finally {
      setContentLoading(false)
    }
  }

  const handleBack = () => {
    setSelectedDate(null)
    setContent(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        role="dialog"
        aria-label={`結果一覧: ${task.name}`}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {selectedDate && (
              <button
                onClick={handleBack}
                aria-label="戻る"
                className="p-1 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded transition-colors flex-shrink-0"
              >
                <BackIcon />
              </button>
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">
                {selectedDate ? `${task.name} — ${selectedDate}` : `結果一覧: ${task.name}`}
              </h3>
              <p className="text-[10px] text-[var(--text-muted)] truncate">
                {repo} ({branch})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="閉じる"
            className="p-1 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded transition-colors flex-shrink-0"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-[var(--text-muted)] text-sm">
              読み込み中...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-500 text-sm">
              {error}
            </div>
          ) : selectedDate ? (
            contentLoading ? (
              <div className="flex items-center justify-center py-12 text-[var(--text-muted)] text-sm">
                読み込み中...
              </div>
            ) : content ? (
              <div className="px-4 py-3 prose prose-sm dark:prose-invert max-w-none">
                <MarkdownRenderer content={content} />
              </div>
            ) : null
          ) : dates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)] text-sm">
              <p>結果がありません</p>
              <p className="text-xs mt-1">タスクを実行すると結果がここに表示されます</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {dates.map((date) => (
                <button
                  key={date}
                  onClick={() => fetchContent(date)}
                  className="w-full text-left px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors flex items-center justify-between"
                >
                  <span className="text-sm text-[var(--foreground)]">{date}</span>
                  <ChevronRightIcon />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M9 3L5 7L9 11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M3 3L11 11M11 3L3 11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="text-[var(--text-muted)]">
      <path d="M4.5 2.5L7.5 6L4.5 9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
