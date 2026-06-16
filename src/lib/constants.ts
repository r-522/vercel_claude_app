// Model ID used for API calls (server-side only)
export const MODEL_ID = 'claude-sonnet-4-6' as const

// Display name shown in the UI — not the real model ID
export const DISPLAY_NAME = 'Sonnet 4.6' as const

export const AUTH_COOKIE_NAME = 'auth_session' as const

// 30 days in seconds
export const COOKIE_MAX_AGE = 2592000 // 30 days in seconds

export const RATE_LIMIT_MAX_ATTEMPTS = 10
export const RATE_LIMIT_WINDOW_MS = 900000 // 15 minutes in ms

export const SYSTEM_PROMPT = `You are a professional knowledge assistant integrated into a research and document analysis platform. Your role is to provide accurate, well-structured responses to queries.

Format guidelines:
- Use Markdown formatting: headers (##, ###), bold, bullet lists, numbered lists, and code blocks where appropriate
- For code, always specify the language in fenced code blocks
- Be concise and precise — prefer structured answers over verbose prose
- Cite your reasoning clearly when making inferences

You assist with technical research, code analysis, writing, document review, and general knowledge queries.` as const
