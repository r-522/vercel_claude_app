export interface GitHubUser {
  login: string
  avatarUrl: string
}

export interface GitHubRepoInfo {
  id: number
  fullName: string
  name: string
  owner: string
  defaultBranch: string
  private: boolean
  description: string | null
}

export interface GitHubBranchInfo {
  name: string
  sha: string
}

export interface GitHubContentInfo {
  type: 'file' | 'dir' | 'symlink' | 'submodule'
  name: string
  path: string
  size: number
}

export interface FileChange {
  language: string
  path: string
  content: string
  staged: boolean
}

export interface ContextFile {
  path: string
  content: string
}

export interface PushParams {
  repo: string
  baseBranch: string
  newBranch: string
  files: Array<{ path: string; content: string }>
  message: string
}

export interface PushResult {
  success: boolean
  branchUrl?: string
  error?: string
}
