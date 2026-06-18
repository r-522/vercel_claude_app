'use client'

import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useDarkMode } from '@/hooks/useDarkMode'

interface CodeBlockProps {
  language: string
  children: string
}

export function CodeBlock({ language, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const { isDark } = useDarkMode()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — silently ignore
    }
  }

  const lineCount = children.split('\n').length

  return (
    <div className="rounded-md overflow-hidden border border-[var(--border)] my-3 text-sm">
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900 border-b border-slate-700">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wide select-none">
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors select-none"
          aria-label="Copy code"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      <SyntaxHighlighter
        language={language || 'text'}
        style={isDark ? vscDarkPlus : vs}
        showLineNumbers={lineCount > 5}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '0.8125rem',
          lineHeight: '1.6',
          padding: '1rem',
        }}
        lineNumberStyle={{
          color: '#64748b',
          fontSize: '0.75rem',
          paddingRight: '1rem',
          userSelect: 'none',
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
}
