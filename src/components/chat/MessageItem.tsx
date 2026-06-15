import type { UIMessage, TextUIPart } from 'ai'
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

function isStreamingPart(message: UIMessage): boolean {
  return message.parts.some(
    (p): p is TextUIPart => p.type === 'text' && p.state === 'streaming',
  )
}

export function MessageItem({ message, isStreaming }: MessageItemProps) {
  const text = getTextContent(message)
  const activelyStreaming = isStreaming && isStreamingPart(message)

  if (message.role === 'user') {
    return (
      <div className="py-4 border-b border-[var(--border)]">
        <div className="flex items-start gap-4">
          <span className="flex-shrink-0 mt-0.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest w-14 text-right pt-0.5 select-none">
            Query
          </span>
          <p className="flex-1 text-sm font-medium text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
            {text}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4 border-b border-[var(--border)]">
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
