'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGitHub } from '@/hooks/useGitHub'
import type { FileChange, ContextFile } from '@/lib/github/types'
import { GitHubConnect } from './GitHubConnect'
import { RepoSelector } from './RepoSelector'
import { BranchSelector } from './BranchSelector'
import { FileExplorer } from './FileExplorer'
import { CodeChat } from './CodeChat'
import { ChangeReview } from './ChangeReview'
import { PushDialog } from './PushDialog'

export function CodeInterface() {
  const router = useRouter()
  const github = useGitHub()

  const [selectedRepo, setSelectedRepo] = useState<string | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([])
  const [changes, setChanges] = useState<FileChange[]>([])
  const [showPushDialog, setShowPushDialog] = useState(false)

  const handleRepoSelect = useCallback((repo: string, defaultBranch: string) => {
    setSelectedRepo(repo)
    setSelectedBranch(defaultBranch)
    setContextFiles([])
    setChanges([])
  }, [])

  const handleBranchSelect = useCallback((branch: string) => {
    setSelectedBranch(branch)
    setContextFiles([])
  }, [])

  const handleAddContextFile = useCallback((file: ContextFile) => {
    setContextFiles((prev) => {
      if (prev.some((f) => f.path === file.path)) return prev
      return [...prev, file]
    })
  }, [])

  const handleRemoveContextFile = useCallback((path: string) => {
    setContextFiles((prev) => prev.filter((f) => f.path !== path))
  }, [])

  const handleChangesExtracted = useCallback((newChanges: FileChange[]) => {
    setChanges((prev) => {
      const pathMap = new Map(prev.map((c) => [c.path, c]))
      for (const change of newChanges) {
        pathMap.set(change.path, change)
      }
      return Array.from(pathMap.values())
    })
  }, [])

  const handleToggleStage = useCallback((path: string) => {
    setChanges((prev) =>
      prev.map((c) => (c.path === path ? { ...c, staged: !c.staged } : c)),
    )
  }, [])

  const handleClearChanges = useCallback(() => {
    setChanges([])
  }, [])

  const stagedChanges = changes.filter((c) => c.staged)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/auth')
  }

  if (!github.connected) {
    return (
      <div className="h-full flex flex-col">
        <header className="flex items-center justify-end px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)] flex-shrink-0">
          <button
            onClick={handleLogout}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] px-2 py-1 rounded hover:bg-[var(--surface-hover)] transition-colors"
          >
            Sign out
          </button>
        </header>
        <div className="flex-1">
          <GitHubConnect
            connected={github.connected}
            user={github.user}
            loading={github.loading}
            onConnect={github.connect}
            onDisconnect={github.disconnect}
          />
        </div>
      </div>
    )
  }

  if (!selectedRepo || !selectedBranch) {
    return (
      <div className="h-full flex flex-col">
        <header className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)] flex-shrink-0">
          <GitHubConnect
            connected={github.connected}
            user={github.user}
            loading={github.loading}
            onConnect={github.connect}
            onDisconnect={github.disconnect}
          />
          <button
            onClick={handleLogout}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] px-2 py-1 rounded hover:bg-[var(--surface-hover)] transition-colors"
          >
            Sign out
          </button>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">リポジトリを選択</h2>
          <div className="w-full max-w-xs">
            <RepoSelector
              selectedRepo={selectedRepo}
              onSelect={handleRepoSelect}
              listRepos={github.listRepos}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col sm:flex-row">
      {/* Sidebar */}
      <aside className="w-full sm:w-56 lg:w-64 flex-shrink-0 border-b sm:border-b-0 sm:border-r border-[var(--border)] bg-[var(--surface)] flex flex-col overflow-hidden">
        <div className="px-2.5 py-2 border-b border-[var(--border)] space-y-1.5">
          <GitHubConnect
            connected={github.connected}
            user={github.user}
            loading={github.loading}
            onConnect={github.connect}
            onDisconnect={github.disconnect}
          />
          <RepoSelector
            selectedRepo={selectedRepo}
            onSelect={handleRepoSelect}
            listRepos={github.listRepos}
          />
          <BranchSelector
            repo={selectedRepo}
            selectedBranch={selectedBranch}
            onSelect={handleBranchSelect}
            listBranches={github.listBranches}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-1 py-1">
          <FileExplorer
            repo={selectedRepo}
            branch={selectedBranch}
            contextFiles={contextFiles}
            onAddFile={handleAddContextFile}
            onRemoveFile={handleRemoveContextFile}
            getContents={github.getContents}
            getFileContent={github.getFileContent}
          />
        </div>

        <ChangeReview
          changes={changes}
          onToggleStage={handleToggleStage}
          onClearAll={handleClearChanges}
        />

        {stagedChanges.length > 0 && (
          <div className="px-2.5 py-2 border-t border-[var(--border)]">
            <button
              onClick={() => setShowPushDialog(true)}
              className="w-full px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              プッシュ ({stagedChanges.length} ファイル)
            </button>
          </div>
        )}
      </aside>

      {/* Main chat area */}
      <div className="flex-1 min-w-0">
        <CodeChat
          repo={selectedRepo}
          branch={selectedBranch}
          contextFiles={contextFiles}
          onChangesExtracted={handleChangesExtracted}
        />
      </div>

      {showPushDialog && (
        <PushDialog
          repo={selectedRepo}
          baseBranch={selectedBranch}
          stagedChanges={stagedChanges}
          onPush={github.push}
          onClose={() => setShowPushDialog(false)}
        />
      )}
    </div>
  )
}
