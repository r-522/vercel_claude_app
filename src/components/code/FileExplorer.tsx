'use client'

import { useState, useCallback } from 'react'
import type { GitHubContentInfo, ContextFile } from '@/lib/github/types'

interface FileExplorerProps {
  repo: string
  branch: string
  contextFiles: ContextFile[]
  onAddFile: (file: ContextFile) => void
  onRemoveFile: (path: string) => void
  getContents: (repo: string, ref: string, path: string) => Promise<GitHubContentInfo[]>
  getFileContent: (repo: string, ref: string, path: string) => Promise<string>
}

interface DirState {
  entries: GitHubContentInfo[]
  loading: boolean
  open: boolean
}

export function FileExplorer({
  repo,
  branch,
  contextFiles,
  onAddFile,
  onRemoveFile,
  getContents,
  getFileContent,
}: FileExplorerProps) {
  const [dirs, setDirs] = useState<Record<string, DirState>>({})
  const [rootLoaded, setRootLoaded] = useState(false)
  const [rootEntries, setRootEntries] = useState<GitHubContentInfo[]>([])
  const [rootLoading, setRootLoading] = useState(false)
  const [loadingFile, setLoadingFile] = useState<string | null>(null)

  const contextPaths = new Set(contextFiles.map((f) => f.path))

  const loadRoot = useCallback(async () => {
    if (rootLoaded) return
    setRootLoading(true)
    try {
      const entries = await getContents(repo, branch, '')
      setRootEntries(entries)
      setRootLoaded(true)
    } catch {
      setRootEntries([])
    } finally {
      setRootLoading(false)
    }
  }, [repo, branch, rootLoaded, getContents])

  const toggleDir = useCallback(
    async (path: string) => {
      const existing = dirs[path]
      if (existing) {
        setDirs((prev) => ({ ...prev, [path]: { ...existing, open: !existing.open } }))
        return
      }

      setDirs((prev) => ({ ...prev, [path]: { entries: [], loading: true, open: true } }))
      try {
        const entries = await getContents(repo, branch, path)
        setDirs((prev) => ({ ...prev, [path]: { entries, loading: false, open: true } }))
      } catch {
        setDirs((prev) => ({ ...prev, [path]: { entries: [], loading: false, open: true } }))
      }
    },
    [dirs, repo, branch, getContents],
  )

  const handleFileClick = useCallback(
    async (path: string) => {
      if (contextPaths.has(path)) {
        onRemoveFile(path)
        return
      }
      setLoadingFile(path)
      try {
        const content = await getFileContent(repo, branch, path)
        onAddFile({ path, content })
      } catch {
        // silently fail
      } finally {
        setLoadingFile(null)
      }
    },
    [repo, branch, contextPaths, onAddFile, onRemoveFile, getFileContent],
  )

  if (!rootLoaded && !rootLoading) {
    return (
      <button
        onClick={loadRoot}
        className="w-full text-left px-2 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded transition-colors"
      >
        ファイルを読み込む
      </button>
    )
  }

  if (rootLoading) {
    return <div className="px-2 py-1.5 text-xs text-[var(--text-muted)]">読み込み中...</div>
  }

  return (
    <div className="text-xs overflow-y-auto">
      {rootEntries.map((entry) => (
        <EntryRow
          key={entry.path}
          entry={entry}
          depth={0}
          dirs={dirs}
          contextPaths={contextPaths}
          loadingFile={loadingFile}
          onToggleDir={toggleDir}
          onFileClick={handleFileClick}
        />
      ))}
    </div>
  )
}

interface EntryRowProps {
  entry: GitHubContentInfo
  depth: number
  dirs: Record<string, DirState>
  contextPaths: Set<string>
  loadingFile: string | null
  onToggleDir: (path: string) => void
  onFileClick: (path: string) => void
}

function EntryRow({ entry, depth, dirs, contextPaths, loadingFile, onToggleDir, onFileClick }: EntryRowProps) {
  const isDir = entry.type === 'dir'
  const dirState = isDir ? dirs[entry.path] : undefined
  const isOpen = dirState?.open ?? false
  const isInContext = contextPaths.has(entry.path)
  const isLoadingThis = loadingFile === entry.path

  return (
    <>
      <button
        onClick={() => (isDir ? onToggleDir(entry.path) : onFileClick(entry.path))}
        className={[
          'w-full text-left flex items-center gap-1.5 py-0.5 px-1.5 rounded hover:bg-[var(--surface-hover)] transition-colors',
          isInContext ? 'text-blue-500 dark:text-blue-400' : 'text-[var(--foreground)]',
        ].join(' ')}
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
        disabled={isLoadingThis}
      >
        {isDir ? (
          <span className="flex-shrink-0 w-3 text-center text-[var(--text-muted)]">{isOpen ? '▾' : '▸'}</span>
        ) : (
          <span className="flex-shrink-0 w-3 text-center text-[var(--text-muted)]">
            {isLoadingThis ? '·' : isInContext ? '✓' : ' '}
          </span>
        )}
        <span className="truncate">{entry.name}</span>
      </button>
      {isDir && isOpen && dirState && (
        <>
          {dirState.loading ? (
            <div className="text-[var(--text-muted)] py-0.5" style={{ paddingLeft: `${(depth + 1) * 12 + 6}px` }}>
              ...
            </div>
          ) : (
            dirState.entries.map((child) => (
              <EntryRow
                key={child.path}
                entry={child}
                depth={depth + 1}
                dirs={dirs}
                contextPaths={contextPaths}
                loadingFile={loadingFile}
                onToggleDir={onToggleDir}
                onFileClick={onFileClick}
              />
            ))
          )}
        </>
      )}
    </>
  )
}
