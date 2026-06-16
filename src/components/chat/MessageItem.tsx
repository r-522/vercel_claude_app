'use client'

import { useState } from 'react'
import type { UIMessage, TextUIPart, FileUIPart } from 'ai'
import { MarkdownRenderer } from './MarkdownRenderer'
import { LoadingDots } from '@/components/ui/LoadingDots'

interface MessageItemProps {
  message: UIMessage
  isStreaming: boolean
}

function getTextContent(message: UIMessage): string {
  return message.parts
    .filter((p): p is TextUIPart => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

function getFileParts(message: UIMessage): FileUIPart[] {
  return message.parts.filter((p): p is FileUIPart => p.type === 'file')
}

function isStreamingPart(message: UIMessage): boolean {
  return message.parts.some(
    (p): p is TextUIPart => p.type === 'text' && p.state === 'streaming',
  )
}

function imageUrl(part: FileUIPart): string {
  return part.url
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="text-[10px] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors select-none px-1.5 py-0.5 rounded hover:bg-[var(--surface-hover)]"
      aria-label="Copy text"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

export function MessageItem({ message, isStreaming }: MessageItemProps) {
  const text = getTextContent(message)
  const fileParts = getFileParts(message)
  const activelyStreaming = isStreaming && isStreamingPart(message)

  if (message.role === 'user') {
    return (
      <div className="py-4 border-b border-[var(--border)] group">
        <div className="flex items-start gap-4">
          <span className="flex-shrink-0 mt-0.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest w-14 text-right pt-0.5 select-none">
            Query
          </span>
          <div className="flex-1 min-w-0">
            {/* Attached images */}
            {fileParts.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {fileParts.map((part, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={imageUrl(part)}
                    alt={part.filename ?? `Image ${i + 1}`}
                    className="max-h-48 max-w-xs rounded-md border border-[var(--border)] object-contain"
                  />
                ))}
              </div>
            )}
            {text && (
              <p className="text-sm font-medium text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                {text}
              </p>
            )}
            {(text || fileParts.length > 0) && (
              <div className="mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {text && <CopyButton text={text} />}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4 border-b border-[var(--border)] group">
      <div className="flex items-start gap-4">
        <span className="flex-shrink-0 mt-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest w-14 text-right pt-0.5 select-none">
          Result
        </span>
        <div className="flex-1 min-w-0 text-[var(--foreground)]">
          {isStreaming && !text ? (
            <LoadingDots />
          ) : (
            <>
              <MarkdownRenderer content={text} />
              {activelyStreaming && (
                <span
                  className="inline-block w-0.5 h-4 bg-slate-400 dark:bg-slate-500 animate-pulse ml-0.5 align-middle"
                  aria-hidden="true"
                />
              )}
              {!activelyStreaming && text && (
                <div className="mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyButton text={text} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
