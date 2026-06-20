import { EncryptJWT, jwtDecrypt } from 'jose'

const ALG = 'dir' as const
const ENC = 'A256GCM' as const

function getEncryptionKey(): Uint8Array {
  const secret = process.env.COOKIE_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('COOKIE_SECRET must be set and at least 32 characters long')
  }
  return new TextEncoder().encode(secret.slice(0, 32))
}

export async function encryptGitHubToken(token: string): Promise<string> {
  return new EncryptJWT({ ghToken: token })
    .setProtectedHeader({ alg: ALG, enc: ENC })
    .setIssuedAt()
    .setExpirationTime('30d')
    .encrypt(getEncryptionKey())
}

export async function decryptGitHubToken(encrypted: string): Promise<string | null> {
  try {
    const { payload } = await jwtDecrypt(encrypted, getEncryptionKey())
    const token = (payload as Record<string, unknown>).ghToken
    return typeof token === 'string' ? token : null
  } catch {
    return null
  }
}
