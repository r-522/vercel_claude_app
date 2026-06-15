export interface RateLimitResult {
  allowed: boolean
  remaining: number
}

export interface AuthVerifyResponse {
  success?: boolean
  error?: string
}
