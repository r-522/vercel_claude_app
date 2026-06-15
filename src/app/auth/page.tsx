import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyAuthCookie } from '@/lib/auth/cookies'
import { AUTH_COOKIE_NAME, DISPLAY_NAME } from '@/lib/constants'
import { AuthForm } from '@/components/auth/AuthForm'

export default async function AuthPage() {
  // Redirect authenticated users directly to the app
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (token && (await verifyAuthCookie(token))) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-xs">
        {/* Header — looks like a standard internal tool login */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 bg-slate-800 dark:bg-slate-200 rounded-[3px] flex-shrink-0" />
            <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {DISPLAY_NAME}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] tracking-wide uppercase">
            Knowledge Base
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  )
}
