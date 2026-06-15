import { RATE_LIMIT_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS } from '@/lib/constants'
import type { RateLimitResult } from '@/lib/types'

interface Entry {
  count: number
  windowStart: number
}

// Module-level Map persists across requests in the same Node.js process.
// Note: in Vercel serverless, each function instance is isolated, so this
// provides best-effort rate limiting. For strict global rate limiting,
// replace with Redis/Upstash KV.
const store = new Map<string, Entry>()

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    store.set(ip, { count: 1, windowStart: now })
    return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - 1 }
  }

  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - entry.count }
}

// Periodic cleanup — call occasionally to prevent unbounded memory growth
export function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [ip, entry] of store.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      store.delete(ip)
    }
  }
}
