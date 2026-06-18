import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './CodeBlock'

interface MarkdownRendererProps {
  content: string
}

const REMARK_PLUGINS = [remarkGfm]

const MD_COMPONENTS: Components = {
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className ?? '')
    if (match) {
      return (
        <CodeBlock language={match[1]}>
          {String(children).replace(/\n$/, '')}
        </CodeBlock>
      )
    }
    return (
      <code className="px-1.5 py-0.5 rounded text-[0.8125rem] font-mono bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-[var(--border)]">
        {children}
      </code>
    )
  },
  p({ children }) {
    return <p className="mb-3 last:mb-0 leading-relaxed text-sm">{children}</p>
  },
  h1({ children }) {
    return (
      <h1 className="text-base font-semibold mt-5 mb-2 text-[var(--foreground)]">
        {children}
      </h1>
    )
  },
  h2({ children }) {
    return (
      <h2 className="text-sm font-semibold mt-4 mb-2 text-[var(--foreground)] border-b border-[var(--border)] pb-1">
        {children}
      </h2>
    )
  },
  h3({ children }) {
    return (
      <h3 className="text-sm font-semibold mt-3 mb-1.5 text-[var(--foreground)]">
        {children}
      </h3>
    )
  },
  ul({ children }) {
    return <ul className="list-disc list-outside ml-4 mb-3 space-y-1">{children}</ul>
  },
  ol({ children }) {
    return <ol className="list-decimal list-outside ml-4 mb-3 space-y-1">{children}</ol>
  },
  li({ children }) {
    return <li className="text-sm leading-relaxed pl-0.5">{children}</li>
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-[3px] border-slate-300 dark:border-slate-600 pl-4 my-3 text-[var(--text-muted)] text-sm">
        {children}
      </blockquote>
    )
  },
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-slate-700 dark:text-slate-300 underline underline-offset-2 hover:text-slate-900 dark:hover:text-white text-sm"
      >
        {children}
      </a>
    )
  },
  strong({ children }) {
    return <strong className="font-semibold text-[var(--foreground)]">{children}</strong>
  },
  em({ children }) {
    return <em className="italic text-[var(--foreground)]">{children}</em>
  },
  hr() {
    return <hr className="my-4 border-[var(--border)]" />
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto my-3 rounded-md border border-[var(--border)]">
        <table className="w-full text-sm border-collapse">{children}</table>
      </div>
    )
  },
  thead({ children }) {
    return <thead className="bg-slate-50 dark:bg-slate-800">{children}</thead>
  },
  th({ children }) {
    return (
      <th className="border-b border-[var(--border)] px-4 py-2 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
        {children}
      </th>
    )
  },
  td({ children }) {
    return (
      <td className="border-b border-[var(--border)] last:border-0 px-4 py-2 text-sm">
        {children}
      </td>
    )
  },
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={MD_COMPONENTS}>
      {content}
    </ReactMarkdown>
  )
}
