'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGitHub } from '@/hooks/useGitHub'
import { TaskSetup } from './TaskSetup'
import { TaskList } from './TaskList'
import { TaskForm } from './TaskForm'
import { TaskResultsViewer } from './TaskResultsViewer'
import type { TaskFormData } from './TaskForm'
import type { ScheduledTask, TasksFile } from '@/lib/tasks/types'

type ConfigState =
  | { status: 'loading' }
  | { status: 'not-configured' }
  | { status: 'ready'; repo: string; branch: string }

export function TasksInterface() {
  const { connected, loading: ghLoading, connect, listRepos } = useGitHub()
  const [config, setConfig] = useState<ConfigState>({ status: 'loading' })
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [viewingResultsTask, setViewingResultsTask] = useState<ScheduledTask | null>(null)

  const checkConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks/config')
      if (!res.ok) { setConfig({ status: 'not-configured' }); return }
      const data = await res.json() as { configured: boolean; repo?: string; branch?: string }
      if (data.configured && data.repo && data.branch) {
        setConfig({ status: 'ready', repo: data.repo, branch: data.branch })
      } else {
        setConfig({ status: 'not-configured' })
      }
    } catch {
      setConfig({ status: 'not-configured' })
    }
  }, [])

  useEffect(() => {
    if (!ghLoading && connected) checkConfig()
    else if (!ghLoading && !connected) setConfig({ status: 'not-configured' })
  }, [ghLoading, connected, checkConfig])

  const loadTasks = useCallback(async () => {
    if (config.status !== 'ready') return
    setTasksLoading(true)
    try {
      const res = await fetch('/api/tasks')
      if (!res.ok) return
      const data = await res.json() as TasksFile
      setTasks(data.tasks)
    } finally {
      setTasksLoading(false)
    }
  }, [config])

  useEffect(() => { loadTasks() }, [loadTasks])

  const handleConfigured = (repo: string, branch: string) => {
    setConfig({ status: 'ready', repo, branch })
  }

  const handleAddTask = async (data: TaskFormData) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to add task')
    const newTask = await res.json() as ScheduledTask
    setTasks((prev) => [...prev, newTask])
    setShowAddForm(false)
  }

  const handleEditTask = async (data: TaskFormData) => {
    if (!editingTask) return
    const res = await fetch(`/api/tasks/${editingTask.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to update task')
    const updated = await res.json() as ScheduledTask
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    setEditingTask(null)
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
    if (!res.ok) throw new Error('Failed to toggle task')
    const updated = await res.json() as ScheduledTask
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete task')
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const handleRun = async (id: string) => {
    const res = await fetch(`/api/tasks/run/${id}`, { method: 'POST' })
    if (!res.ok) throw new Error('Task run failed')
    await loadTasks()
  }

  if (ghLoading || config.status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
        読み込み中...
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-[var(--text-muted)]">タスク機能にはGitHub接続が必要です</p>
        <button
          onClick={connect}
          className="px-4 py-2 text-xs font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded hover:opacity-80 transition-opacity"
        >
          GitHubに接続
        </button>
      </div>
    )
  }

  if (config.status === 'not-configured') {
    return <TaskSetup listRepos={listRepos} onConfigured={handleConfigured} />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)]">
        <div>
          <span className="text-xs text-[var(--text-muted)]">毎日 3:00 AM (JST) に自動実行</span>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
        >
          + タスクを追加
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tasksLoading ? (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
            読み込み中...
          </div>
        ) : (
          <TaskList
            tasks={tasks}
            repo={config.repo}
            onToggle={handleToggle}
            onEdit={setEditingTask}
            onDelete={handleDelete}
            onRun={handleRun}
            onViewResults={setViewingResultsTask}
          />
        )}
      </div>

      {showAddForm && (
        <TaskForm onSave={handleAddTask} onCancel={() => setShowAddForm(false)} listRepos={listRepos} />
      )}
      {editingTask && (
        <TaskForm task={editingTask} onSave={handleEditTask} onCancel={() => setEditingTask(null)} listRepos={listRepos} />
      )}
      {viewingResultsTask && config.status === 'ready' && (
        <TaskResultsViewer
          task={viewingResultsTask}
          configRepo={config.repo}
          configBranch={config.branch}
          onClose={() => setViewingResultsTask(null)}
        />
      )}
    </div>
  )
}
