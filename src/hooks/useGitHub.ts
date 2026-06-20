'use client'

import { useState, useCallback, useEffect } from 'react'
import type {
  GitHubUser,
  GitHubRepoInfo,
  GitHubBranchInfo,
  GitHubContentInfo,
  FileChange,
  PushParams,
  PushResult,
} from '@/lib/github/types'

export type { GitHubUser, GitHubRepoInfo, GitHubBranchInfo, GitHubContentInfo, FileChange }

export interface UseGitHubReturn {
  connected: boolean
  user: GitHubUser | null
  loading: boolean
  connect: () => void
  disconnect: () => Promise<void>
  checkStatus: () => Promise<void>
  listRepos: () => Promise<GitHubRepoInfo[]>
  listBranches: (repo: string) => Promise<GitHubBranchInfo[]>
  getContents: (repo: string, ref: string, path: string) => Promise<GitHubContentInfo[]>
  getFileContent: (repo: string, ref: string, path: string) => Promise<string>
  push: (params: PushParams) => Promise<PushResult>
}

export function useGitHub(): UseGitHubReturn {
  const [connected, setConnected] = useState(false)
  const [user, setUser] = useState<GitHubUser | null>(null)
  const [loading, setLoading] = useState(true)

  const checkStatus = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/github/status')
      if (!res.ok) {
        setConnected(false)
        setUser(null)
        return
      }
      const data = await res.json()
      setConnected(data.connected === true)
      setUser(data.user ?? null)
    } catch {
      setConnected(false)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  const connect = useCallback(() => {
    window.location.href = '/api/github/auth'
  }, [])

  const disconnect = useCallback(async () => {
    await fetch('/api/github/disconnect', { method: 'POST' })
    setConnected(false)
    setUser(null)
  }, [])

  const listRepos = useCallback(async (): Promise<GitHubRepoInfo[]> => {
    const res = await fetch('/api/github/repos')
    if (!res.ok) throw new Error('Failed to fetch repos')
    return res.json()
  }, [])

  const listBranches = useCallback(async (repo: string): Promise<GitHubBranchInfo[]> => {
    const res = await fetch(`/api/github/branches?repo=${encodeURIComponent(repo)}`)
    if (!res.ok) throw new Error('Failed to fetch branches')
    return res.json()
  }, [])

  const getContents = useCallback(
    async (repo: string, ref: string, path: string): Promise<GitHubContentInfo[]> => {
      const params = new URLSearchParams({ repo, ref, path })
      const res = await fetch(`/api/github/contents?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch contents')
      return res.json()
    },
    [],
  )

  const getFileContent = useCallback(
    async (repo: string, ref: string, path: string): Promise<string> => {
      const params = new URLSearchParams({ repo, ref, path, mode: 'file' })
      const res = await fetch(`/api/github/contents?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch file')
      const data = await res.json()
      return data.content
    },
    [],
  )

  const push = useCallback(async (params: PushParams): Promise<PushResult> => {
    const res = await fetch('/api/github/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    return res.json()
  }, [])

  return {
    connected,
    user,
    loading,
    connect,
    disconnect,
    checkStatus,
    listRepos,
    listBranches,
    getContents,
    getFileContent,
    push,
  }
}
