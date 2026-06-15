'use client'

import { useEffect, useRef } from 'react'
import type { UIMessage } from 'ai'
import { MessageItem } from './MessageItem'

interface MessageListProps {
  messages: UIMessage[]
  isStreaming: boolean
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll: only scroll when user is near the bottom or a new message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center select-none">
        <div className="text-center space-y-1">
          <p className="text-sm text-[var(--text-muted)]">
            Enter a query to begin
          </p>
          <p className="text-xs text-[var(--border)] dark:text-slate-700">
            Shift+Enter for new line · Enter to submit
          </p>
        </div>
      </div>
    )
  }

  const lastMessageId = messages[messages.length - 1]?.id

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto px-6">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isStreaming={isStreaming && message.id === lastMessageId && message.role === 'assistant'}
          />
        ))}
        <div ref={bottomRef} className="h-4" aria-hidden="true" />
      </div>
    </div>
  )
}
