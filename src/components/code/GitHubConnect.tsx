'use client'

import type { GitHubUser } from '@/lib/github/types'

interface GitHubConnectProps {
  connected: boolean
  user: GitHubUser | null
  loading: boolean
  onConnect: () => void
  onDisconnect: () => Promise<void>
}

export function GitHubConnect({ connected, user, loading, onConnect, onDisconnect }: GitHubConnectProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-[var(--text-muted)]">接続状態を確認中...</div>
      </div>
    )
  }

  if (connected && user) {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <GitHubIcon />
        <span>{user.login}</span>
        <button
          onClick={onDisconnect}
          className="text-[var(--text-muted)] hover:text-[var(--foreground)] underline underline-offset-2 transition-colors"
        >
          切断
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--surface-hover)] flex items-center justify-center">
          <GitHubIcon size={24} />
        </div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">GitHub に接続</h2>
        <p className="text-sm text-[var(--text-muted)] max-w-sm">
          リポジトリのファイルを読み取り、Claude にコード変更を依頼して、新しいブランチにプッシュできます。
        </p>
      </div>
      <button
        onClick={onConnect}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#24292f] dark:bg-[#f0f0f0] dark:text-[#24292f] rounded-lg hover:opacity-90 transition-opacity"
      >
        <GitHubIcon size={16} />
        GitHub で認証
      </button>
    </div>
  )
}

function GitHubIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}
