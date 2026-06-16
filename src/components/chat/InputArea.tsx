'use client'

import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type ClipboardEvent,
  type ChangeEvent,
} from 'react'
import { convertFileListToFileUIParts } from 'ai'
import type { FileUIPart } from 'ai'

interface AttachedFile {
  file: File
  previewUrl: string
}

interface InputAreaProps {
  value: string
  disabled: boolean
  onChange: (value: string) => void
  onSubmit: (files: FileUIPart[]) => void
}

const ACCEPT_TYPES = 'image/png,image/jpeg,image/gif,image/webp'

export function InputArea({ value, disabled, onChange, onSubmit }: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attached, setAttached] = useState<AttachedFile[]>([])

  // Keep a stable ref to current attached list for cleanup on unmount
  const attachedRef = useRef<AttachedFile[]>([])
  useEffect(() => {
    attachedRef.current = attached
  }, [attached])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [value])

  // Revoke all blob URLs on unmount to free memory
  useEffect(() => {
    return () => {
      for (const item of attachedRef.current) {
        URL.revokeObjectURL(item.previewUrl)
      }
    }
  }, [])

  const addFiles = (incoming: FileList | File[]) => {
    const images = Array.from(incoming).filter((f) => f.type.startsWith('image/'))
    if (images.length === 0) return
    // Create preview URLs immediately, not in an effect
    const newItems = images.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setAttached((prev) => [...prev, ...newItems])
  }

  const removeFile = (index: number) => {
    setAttached((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const clearAttached = () => {
    for (const item of attachedRef.current) {
      URL.revokeObjectURL(item.previewUrl)
    }
    setAttached([])
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files)
    e.target.value = ''
  }

  const handlePaste = (e: ClipboardEvent) => {
    const images: File[] = []
    for (const item of e.clipboardData.items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) images.push(file)
      }
    }
    if (images.length > 0) addFiles(images)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if ((value.trim() || attached.length > 0) && !disabled) {
        void handleSubmit()
      }
    }
  }

  const handleSubmit = async () => {
    if ((!value.trim() && attached.length === 0) || disabled) return

    let fileUIParts: FileUIPart[] = []
    if (attached.length > 0) {
      const dt = new DataTransfer()
      for (const { file } of attached) dt.items.add(file)
      fileUIParts = await convertFileListToFileUIParts(dt.files)
    }

    onSubmit(fileUIParts)
    clearAttached()
  }

  const canSubmit = !disabled && (value.trim().length > 0 || attached.length > 0)

  return (
    <div className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 sm:px-6 sm:py-4">
      <div className="max-w-3xl mx-auto">
        {/* Image previews */}
        {attached.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attached.map(({ previewUrl, file }, i) => (
              <div key={previewUrl} className="relative group/preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="h-16 w-16 object-cover rounded-md border border-[var(--border)]"
                />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-700 dark:bg-slate-300 text-white dark:text-slate-900 text-[10px] leading-none flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity"
                  aria-label={`Remove ${file.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div
          className={[
            'flex items-end gap-2 rounded-lg border px-3 py-2.5 transition-colors',
            'bg-[var(--background)]',
            disabled
              ? 'border-[var(--border)] opacity-70'
              : 'border-[var(--border)] focus-within:border-slate-400 dark:focus-within:border-slate-500',
          ].join(' ')}
        >
          {/* Attach image button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            aria-label="Attach image"
            className="flex-shrink-0 p-1 text-[var(--text-muted)] hover:text-[var(--foreground)] disabled:opacity-40 transition-colors"
          >
            <PaperclipIcon />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_TYPES}
            multiple
            onChange={handleFileInput}
            className="hidden"
            aria-hidden="true"
          />

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={disabled}
            placeholder="Enter your query..."
            rows={1}
            aria-label="Query input"
            className="flex-1 resize-none bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] outline-none disabled:opacity-70 leading-relaxed"
            style={{ maxHeight: '200px' }}
          />

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            aria-label="Submit query"
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <path d="M6 1L11 8H8.5V11H3.5V8H1L6 1Z" />
            </svg>
          </button>
        </div>

        <p className="text-[10px] text-[var(--text-muted)] mt-1.5 text-center">
          Enter to submit · Shift+Enter for new line · Paste or attach images
        </p>
      </div>
    </div>
  )
}

function PaperclipIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      aria-hidden="true"
    >
      <path d="M13 7L7.5 12.5a4 4 0 0 1-5.657-5.657L8 1.5A2.5 2.5 0 0 1 11.657 5.157L6 10.5a1 1 0 0 1-1.414-1.414L10 4" />
    </svg>
  )
}
