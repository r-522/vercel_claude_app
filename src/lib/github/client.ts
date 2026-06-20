import {
  GITHUB_API_BASE,
  GITHUB_API_PER_PAGE,
  GITHUB_API_SORT,
  GITHUB_API_AFFILIATION,
} from './constants'
import type { GitHubRepoInfo, GitHubBranchInfo, GitHubContentInfo, PushParams, PushResult } from './types'

// GitHub API response types (internal)
interface GitHubApiUser {
  login: string
  avatar_url: string
}

interface GitHubApiRepo {
  id: number
  full_name: string
  name: string
  owner: { login: string }
  default_branch: string
  private: boolean
  description: string | null
}

interface GitHubApiBranch {
  name: string
  commit: { sha: string }
}

interface GitHubApiContentEntry {
  type: 'file' | 'dir' | 'symlink' | 'submodule'
  name: string
  path: string
  sha: string
  size: number
}

interface GitHubFileResponse {
  type: 'file'
  content: string
  encoding: string
  path: string
  sha: string
  size: number
}

class GitHubApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'GitHubApiError'
  }
}

async function githubFetch<T>(token: string, path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${GITHUB_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new GitHubApiError(`GitHub API error: ${res.status} ${body}`, res.status)
  }

  return res.json() as Promise<T>
}

export async function getUser(token: string): Promise<{ login: string; avatarUrl: string }> {
  const user = await githubFetch<GitHubApiUser>(token, '/user')
  return { login: user.login, avatarUrl: user.avatar_url }
}

export async function listRepos(token: string): Promise<GitHubRepoInfo[]> {
  const repos = await githubFetch<GitHubApiRepo[]>(
    token,
    `/user/repos?per_page=${GITHUB_API_PER_PAGE}&sort=${GITHUB_API_SORT}&affiliation=${GITHUB_API_AFFILIATION}`,
  )
  return repos.map((r) => ({
    id: r.id,
    fullName: r.full_name,
    name: r.name,
    owner: r.owner.login,
    defaultBranch: r.default_branch,
    private: r.private,
    description: r.description,
  }))
}

export async function listBranches(token: string, repo: string): Promise<GitHubBranchInfo[]> {
  const branches = await githubFetch<GitHubApiBranch[]>(
    token,
    `/repos/${repo}/branches?per_page=${GITHUB_API_PER_PAGE}`,
  )
  return branches.map((b) => ({ name: b.name, sha: b.commit.sha }))
}

export async function getContents(token: string, repo: string, path: string, ref: string): Promise<GitHubContentInfo[]> {
  const result = await githubFetch<GitHubApiContentEntry | GitHubApiContentEntry[]>(
    token,
    `/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`,
  )
  const entries = Array.isArray(result) ? result : [result]
  return entries.map((e) => ({
    type: e.type,
    name: e.name,
    path: e.path,
    size: e.size,
  }))
}

export async function getFileContent(token: string, repo: string, path: string, ref: string): Promise<string> {
  const result = await githubFetch<GitHubFileResponse>(
    token,
    `/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`,
  )
  if (result.encoding === 'base64') {
    return Buffer.from(result.content, 'base64').toString('utf-8')
  }
  return result.content
}

export async function createBranchAndPush(token: string, params: PushParams): Promise<PushResult> {
  const { repo, baseBranch, newBranch, files, message } = params

  try {
    const refData = await githubFetch<{ object: { sha: string } }>(
      token,
      `/repos/${repo}/git/ref/heads/${encodeURIComponent(baseBranch)}`,
    )
    const baseSha = refData.object.sha

    const commitData = await githubFetch<{ tree: { sha: string } }>(token, `/repos/${repo}/git/commits/${baseSha}`)
    const baseTreeSha = commitData.tree.sha

    const treeEntries = await Promise.all(
      files.map(async (file) => {
        const blobData = await githubFetch<{ sha: string }>(token, `/repos/${repo}/git/blobs`, {
          method: 'POST',
          body: JSON.stringify({ content: file.content, encoding: 'utf-8' }),
        })
        return { path: file.path, mode: '100644' as const, type: 'blob' as const, sha: blobData.sha }
      }),
    )

    const treeData = await githubFetch<{ sha: string }>(token, `/repos/${repo}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries }),
    })

    const newCommit = await githubFetch<{ sha: string }>(token, `/repos/${repo}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({ message, tree: treeData.sha, parents: [baseSha] }),
    })

    await githubFetch(token, `/repos/${repo}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${newBranch}`, sha: newCommit.sha }),
    })

    return { success: true, branchUrl: `https://github.com/${repo}/tree/${encodeURIComponent(newBranch)}` }
  } catch (err) {
    const errorMessage = err instanceof GitHubApiError ? err.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}
