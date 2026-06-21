import { NextRequest, NextResponse } from 'next/server'
import { cleanupExpiredEntries } from '@/lib/auth/rate-limiter'

export const runtime = 'nodejs'

// Called by Vercel Cron hourly to prevent unbounded memory growth in the rate limiter.
// Requires env var: CRON_SECRET
export async function POST(req: NextRequest): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  cleanupExpiredEntries()
  return NextResponse.json({ ok: true })
}
