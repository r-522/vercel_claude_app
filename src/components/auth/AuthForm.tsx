'use client'

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type ClipboardEvent,
} from 'react'
import { useRouter } from 'next/navigation'

export function AuthForm() {
  const router = useRouter()
  const [digits, setDigits] = useState<string[]>(['', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Single ref holding all 4 input elements — stable across renders
  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null])

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus()
  }

  useEffect(() => {
    focusInput(0)
  }, [])

  const submit = useCallback(
    async (code: string) => {
      if (code.length !== 4) return
      setLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
        const data = (await res.json()) as { success?: boolean; error?: string }

        if (res.ok && data.success) {
          router.replace('/')
          router.refresh()
        } else {
          setError(data.error ?? 'コードが正しくありません')
          setDigits(['', '', '', ''])
          setTimeout(() => focusInput(0), 0)
        }
      } catch {
        setError('コードが正しくありません')
        setDigits(['', '', '', ''])
        setTimeout(() => focusInput(0), 0)
      } finally {
        setLoading(false)
      }
    },
    [router],
  )

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)

    if (digit && index < 3) {
      focusInput(index + 1)
    }

    if (digit && index === 3) {
      const code = [...next.slice(0, 3), digit].join('')
      if (code.length === 4) submit(code)
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      focusInput(index - 1)
    }
  }

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (pasted.length === 4) {
      setDigits(pasted.split(''))
      submit(pasted)
    }
  }

  const handleButtonClick = () => {
    const code = digits.join('')
    if (code.length === 4) submit(code)
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-8 shadow-sm">
      <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest mb-6">
        Access Code
      </p>

      <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el }}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={loading}
            aria-label={`Digit ${i + 1}`}
            className={[
              'w-12 h-12 text-center text-lg font-mono rounded-md border outline-none transition-colors',
              'bg-[var(--background)] text-[var(--foreground)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-red-400 dark:border-red-500'
                : 'border-[var(--border)] focus:border-slate-400 dark:focus:border-slate-500',
            ].join(' ')}
          />
        ))}
      </div>

      {error && (
        <p className="text-center text-xs text-red-600 dark:text-red-400 mb-4" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleButtonClick}
        disabled={loading || digits.join('').length < 4}
        className="w-full py-2.5 px-4 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md text-sm font-medium transition-colors hover:bg-slate-700 dark:hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Verifying...' : 'Access'}
      </button>
    </div>
  )
}
