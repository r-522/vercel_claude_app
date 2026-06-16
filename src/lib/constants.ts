export const AUTH_COOKIE_NAME = 'auth_session' as const

// 30 days in seconds
export const COOKIE_MAX_AGE = 2592000

export const RATE_LIMIT_MAX_ATTEMPTS = 10
export const RATE_LIMIT_WINDOW_MS = 900000 // 15 minutes in ms

export const MODELS = [
  { id: 'claude-opus-4-6',           display: 'Opus 4.6',   family: 'opus'   },
  { id: 'claude-sonnet-4-6',         display: 'Sonnet 4.6', family: 'sonnet' },
  { id: 'claude-haiku-4-5-20251001', display: 'Haiku 4.5',  family: 'haiku'  },
] as const

export type ModelId = typeof MODELS[number]['id']

export const DEFAULT_MODEL_ID: ModelId = 'claude-haiku-4-5-20251001'

export function getAppName(modelId: ModelId): string {
  const model = MODELS.find((m) => m.id === modelId)
  return `claude-${model?.family ?? 'haiku'}-app`
}

// Model IDs that are allowed in the chat API (server-side validation)
export const ALLOWED_MODEL_IDS = MODELS.map((m) => m.id) as string[]

export const SYSTEM_PROMPT = `You are a professional knowledge assistant integrated into a research and document analysis platform. Your role is to provide accurate, well-structured responses to queries.

Format guidelines:
- Use Markdown formatting: headers (##, ###), bold, bullet lists, numbered lists, and code blocks where appropriate
- For code, always specify the language in fenced code blocks
- Be concise and precise — prefer structured answers over verbose prose
- Cite your reasoning clearly when making inferences

You assist with technical research, code analysis, writing, document review, and general knowledge queries.` as const
