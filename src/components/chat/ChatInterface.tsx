'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { MessageList } from './MessageList'
import { InputArea } from './InputArea'

interface ChatInterfaceProps {
  displayName: string
}

export function ChatInterface({ displayName }: ChatInterfaceProps) {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark'),
  )

  const { messages, sendMessage, status, error, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    onError: (err) => {
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        router.replace('/auth')
      }
    },
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  const handleSubmit = useCallback(() => {
    const text = input.trim()
    if (!text || isLoading) return
    sendMessage({ text })
    setInput('')
  }, [input, isLoading, sendMessage])

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

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      {/* Top navigation bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[var(--border)] bg-[var(--surface)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-slate-800 dark:bg-slate-200 rounded-[3px] flex-shrink-0" />
          <span className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
            {displayName}
          </span>
          <span className="hidden sm:inline-block text-[10px] font-medium text-[var(--text-muted)] border border-[var(--border)] rounded px-1.5 py-0.5 uppercase tracking-widest">
            Knowledge Base
          </span>
        </div>

        <nav className="flex items-center gap-1">
          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <SunIcon />
            ) : (
              <MoonIcon />
            )}
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

          <div className="w-px h-4 bg-[var(--border)] mx-1" />

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

      {/* Message list — fills remaining space */}
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
