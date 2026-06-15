import { SignJWT, jwtVerify } from 'jose'
import { AUTH_COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/constants'

function getSecret(): Uint8Array {
  const secret = process.env.COOKIE_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('COOKIE_SECRET must be set and at least 32 characters long')
  }
  return new TextEncoder().encode(secret)
}

export async function signAuthCookie(): Promise<string> {
  return new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret())
}

export async function verifyAuthCookie(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret(), { algorithms: ['HS256'] })
    return true
  } catch {
    return false
  }
}

export function buildCookieHeader(token: string): string {
  const parts = [
    `${AUTH_COOKIE_NAME}=${token}`,
    `Max-Age=${COOKIE_MAX_AGE}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure')
  }
  return parts.join('; ')
}

export function buildClearCookieHeader(): string {
  return `${AUTH_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`
}
