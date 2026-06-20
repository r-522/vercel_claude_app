'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { FileUIPart } from 'ai'
import { MODELS, DEFAULT_MODEL_ID, DEFAULT_EFFORT_ID } from '@/lib/constants'
import type { ModelId, EffortId } from '@/lib/constants'
import { useDarkMode } from '@/hooks/useDarkMode'
import type { FileChange, ContextFile } from '@/lib/github/types'
import { MessageList } from '@/components/chat/MessageList'
import { InputArea } from '@/components/chat/InputArea'
import { ModelSettings } from '@/components/chat/ModelSettings'

interface CodeChatProps {
  repo: string
  branch: string
  contextFiles: ContextFile[]
  onChangesExtracted: (changes: FileChange[]) => void
}

const FILE_CHANGE_REGEX = /```(\w+):([^\n]+)\n([\s\S]*?)```/g

function extractFileChanges(text: string): FileChange[] {
  const changes: FileChange[] = []
  let match
  const regex = new RegExp(FILE_CHANGE_REGEX.source, 'g')
  while ((match = regex.exec(text)) !== null) {
    changes.push({
      language: match[1],
      path: match[2].trim(),
      content: match[3],
      staged: true,
    })
  }
  return changes
}

export function CodeChat({ repo, branch, contextFiles, onChangesExtracted }: CodeChatProps) {
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState<ModelId>(DEFAULT_MODEL_ID)
  const [effort, setEffort] = useState<EffortId>(DEFAULT_EFFORT_ID)
  const [thinking, setThinking] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { isDark, toggle: toggleTheme } = useDarkMode()

  const supportsThinking = MODELS.find((m) => m.id === selectedModel)?.supportsThinking ?? false

  const modelRef = useRef(selectedModel)
  const effortRef = useRef(effort)
  const thinkingRef = useRef(thinking)
  const repoRef = useRef(repo)
  const branchRef = useRef(branch)
  const contextFilesRef = useRef(contextFiles)
  modelRef.current = selectedModel
  effortRef.current = effort
  thinkingRef.current = thinking
  repoRef.current = repo
  branchRef.current = branch
  contextFilesRef.current = contextFiles

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/code',
        body: () => ({
          modelId: modelRef.current,
          effort: effortRef.current,
          thinking: thinkingRef.current,
          repoContext: {
            repo: repoRef.current,
            branch: branchRef.current,
            files: contextFilesRef.current,
          },
        }),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const { messages, sendMessage, status } = useChat({
    transport,
    onFinish: ({ message }) => {
      if (message.role === 'assistant') {
        const textContent = message.parts
          .filter((p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text')
          .map((p) => p.text)
          .join('\n')
        if (textContent) {
          const changes = extractFileChanges(textContent)
          if (changes.length > 0) {
            onChangesExtracted(changes)
          }
        }
      }
    },
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  const handleSubmit = useCallback(
    (fileUIParts: FileUIPart[]) => {
      const text = input.trim()
      if ((!text && fileUIParts.length === 0) || isLoading) return

      if (text && fileUIParts.length > 0) {
        sendMessage({ text, files: fileUIParts })
      } else if (text) {
        sendMessage({ text })
      } else {
        sendMessage({ files: fileUIParts })
      }

      setInput('')
    },
    [input, isLoading, sendMessage],
  )

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      <header className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--surface)] flex-shrink-0">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] min-w-0">
          <span className="truncate font-medium text-[var(--foreground)]">{repo}</span>
          <span className="flex-shrink-0">:</span>
          <span className="truncate">{branch}</span>
          {contextFiles.length > 0 && (
            <span className="flex-shrink-0 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-[10px]">
              {contextFiles.length} files
            </span>
          )}
        </div>

        <nav className="flex items-center gap-1.5 flex-shrink-0">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as ModelId)}
            disabled={isLoading}
            aria-label="Select model"
            className="text-xs text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1 outline-none hover:border-slate-400 dark:hover:border-slate-500 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.display}
              </option>
            ))}
          </select>

          <div className="relative">
            <button
              onClick={() => setSettingsOpen((o) => !o)}
              className={[
                'p-1.5 rounded transition-colors',
                settingsOpen
                  ? 'text-[var(--foreground)] bg-[var(--surface-hover)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]',
              ].join(' ')}
              aria-label="Model settings"
              aria-expanded={settingsOpen}
            >
              <GearIcon />
            </button>
            {settingsOpen && (
              <ModelSettings
                effort={effort}
                thinking={thinking}
                supportsThinking={supportsThinking}
                onEffortChange={setEffort}
                onThinkingChange={setThinking}
                onClose={() => setSettingsOpen(false)}
              />
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </nav>
      </header>

      <MessageList messages={messages} isStreaming={isLoading} />

      <InputArea
        value={input}
        disabled={isLoading}
        onChange={setInput}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M7.5 5.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM4.5 7.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M7.5 1a.5.5 0 0 1 .491.401l.24 1.44a5.513 5.513 0 0 1 1.163.677l1.378-.459a.5.5 0 0 1 .588.213l.5.866a.5.5 0 0 1-.098.625l-1.105.958a5.532 5.532 0 0 1 0 1.358l1.105.958a.5.5 0 0 1 .098.625l-.5.866a.5.5 0 0 1-.588.213l-1.378-.459a5.513 5.513 0 0 1-1.163.677l-.24 1.44A.5.5 0 0 1 7.5 14a.5.5 0 0 1-.491-.401l-.24-1.44a5.512 5.512 0 0 1-1.163-.677l-1.378.459a.5.5 0 0 1-.588-.213l-.5-.866a.5.5 0 0 1 .098-.625l1.105-.958a5.532 5.532 0 0 1 0-1.358L3.238 6.963a.5.5 0 0 1-.098-.625l.5-.866a.5.5 0 0 1 .588-.213l1.378.459a5.512 5.512 0 0 1 1.163-.677l.24-1.44A.5.5 0 0 1 7.5 1Z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
      <path d="M7.5 0a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1a.5.5 0 0 1 .5-.5ZM7.5 13a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1a.5.5 0 0 1 .5-.5ZM15 7.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1 0-1h1a.5.5 0 0 1 .5.5ZM2 7.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1 0-1h1a.5.5 0 0 1 .5.5ZM12.364 2.636a.5.5 0 0 1 0 .707l-.707.707a.5.5 0 1 1-.707-.707l.707-.707a.5.5 0 0 1 .707 0ZM3.757 11.243a.5.5 0 0 1 0 .707l-.707.707a.5.5 0 0 1-.707-.707l.707-.707a.5.5 0 0 1 .707 0ZM12.364 12.364a.5.5 0 0 1-.707 0l-.707-.707a.5.5 0 0 1 .707-.707l.707.707a.5.5 0 0 1 0 .707ZM3.757 3.757a.5.5 0 0 1-.707 0l-.707-.707a.5.5 0 0 1 .707-.707l.707.707a.5.5 0 0 1 0 .707ZM7.5 4.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
      <path d="M2.89 0.686A6.5 6.5 0 0 0 8 13a6.5 6.5 0 0 0 6.314-8.11A5 5 0 0 1 2.89.686Z" />
    </svg>
  )
}
