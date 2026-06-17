'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { FileUIPart } from 'ai'
import { MODELS, DEFAULT_MODEL_ID, DEFAULT_EFFORT_ID, getAppName } from '@/lib/constants'
import type { ModelId, EffortId } from '@/lib/constants'
import { MessageList } from './MessageList'
import { InputArea } from './InputArea'
import { ModelSettings } from './ModelSettings'

export function ChatInterface() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState<ModelId>(DEFAULT_MODEL_ID)
  const [effort, setEffort] = useState<EffortId>(DEFAULT_EFFORT_ID)
  const [thinking, setThinking] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark'),
  )

  const currentModelMeta = MODELS.find((m) => m.id === selectedModel)
  const supportsThinking = currentModelMeta?.supportsThinking ?? false

  // Reset thinking when switching to a model that doesn't support it
  useEffect(() => {
    if (!supportsThinking) setThinking(false)
  }, [supportsThinking])

  // Refs hold current values so the transport closure always reads fresh state
  // without needing to recreate the transport (useChat ignores transport changes)
  const modelRef = useRef(selectedModel)
  const effortRef = useRef(effort)
  const thinkingRef = useRef(thinking)
  modelRef.current = selectedModel
  effortRef.current = effort
  thinkingRef.current = thinking

  // Transport created once — body is a function evaluated fresh on every send
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: () => ({
          modelId: modelRef.current,
          effort: effortRef.current,
          thinking: thinkingRef.current,
        }),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const { messages, sendMessage, status, error, regenerate } = useChat({
    transport,
    onError: (err) => {
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        router.replace('/auth')
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

  const handleModelChange = (id: ModelId) => setSelectedModel(id)

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      // localStorage unavailable
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/auth')
  }

  const handleNewChat = () => {
    window.location.reload()
  }

  const selectedModelDisplay =
    MODELS.find((m) => m.id === selectedModel)?.display ?? selectedModel

  const appName = getAppName(selectedModel)

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      {/* Top navigation bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[var(--border)] bg-[var(--surface)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-slate-800 dark:bg-slate-200 rounded-[3px] flex-shrink-0" />
          <span className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
            {appName}
          </span>
          <span className="hidden sm:inline-block text-[10px] font-medium text-[var(--text-muted)] border border-[var(--border)] rounded px-1.5 py-0.5 uppercase tracking-widest">
            Knowledge Base
          </span>
        </div>

        <nav className="flex items-center gap-1.5">
          {/* Model selector */}
          <select
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value as ModelId)}
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

          {/* Active model badge (mobile) */}
          <span className="sm:hidden text-[10px] text-[var(--text-muted)] border border-[var(--border)] rounded px-1.5 py-0.5">
            {selectedModelDisplay}
          </span>

          {/* Settings (effort + thinking) */}
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

          <div className="w-px h-4 bg-[var(--border)] mx-0.5" />

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* New session */}
          {messages.length > 0 && (
            <button
              onClick={handleNewChat}
              className="hidden sm:block text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] px-2 py-1 rounded hover:bg-[var(--surface-hover)] transition-colors"
            >
              New
            </button>
          )}

          <div className="w-px h-4 bg-[var(--border)] mx-0.5" />

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] px-2 py-1 rounded hover:bg-[var(--surface-hover)] transition-colors"
          >
            Sign out
          </button>
        </nav>
      </header>

      {/* Error banner with retry */}
      {error && (
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 bg-red-50 dark:bg-red-950 border-b border-red-200 dark:border-red-900 flex-shrink-0">
          <p className="text-xs text-red-700 dark:text-red-400">
            Request failed. Please try again.
          </p>
          <button
            onClick={() => regenerate()}
            className="text-xs font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200 underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Message list */}
      <MessageList messages={messages} isStreaming={isLoading} />

      {/* Input area */}
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
