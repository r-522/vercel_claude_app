export const AUTH_COOKIE_NAME = 'auth_session' as const

// 30 days in seconds
export const COOKIE_MAX_AGE = 2592000

export const RATE_LIMIT_MAX_ATTEMPTS = 10
export const RATE_LIMIT_WINDOW_MS = 900000 // 15 minutes in ms

export const MODELS = [
  { id: 'claude-opus-4-6',           display: 'Opus 4.6',   family: 'opus',   supportsThinking: true  },
  { id: 'claude-sonnet-4-6',         display: 'Sonnet 4.6', family: 'sonnet', supportsThinking: true  },
  { id: 'claude-haiku-4-5-20251001', display: 'Haiku 4.5',  family: 'haiku',  supportsThinking: false },
] as const

export type ModelId = typeof MODELS[number]['id']

export const DEFAULT_MODEL_ID: ModelId = 'claude-haiku-4-5-20251001'

export const EFFORT_LEVELS = [
  { id: 'low',    label: '低',   description: '簡単な質問への素早い回答',           budgetTokens: 1024,  temperature: 1.0  },
  { id: 'medium', label: '中',   description: '軽めのカジュアルなタスク',           budgetTokens: 3000,  temperature: 0.85 },
  { id: 'high',   label: '高',   description: '日常的な作業に適したバランス',       budgetTokens: 6000,  temperature: 0.7  },
  { id: 'xhigh',  label: '超高', description: '複雑で詳細な作業',                   budgetTokens: 12000, temperature: 0.4  },
  { id: 'max',    label: '最大', description: '最も難しい問題。最も時間がかかります。', budgetTokens: 24000, temperature: 0.1  },
] as const

export type EffortId = typeof EFFORT_LEVELS[number]['id']
export const DEFAULT_EFFORT_ID: EffortId = 'high'

// Model IDs that are allowed in the chat API (server-side validation)
export const ALLOWED_MODEL_IDS = MODELS.map((m) => m.id) as string[]

export const SYSTEM_PROMPT = `You are a professional knowledge assistant integrated into a research and document analysis platform. Your role is to provide accurate, well-structured responses to queries.

Format guidelines:
- Use Markdown formatting: headers (##, ###), bold, bullet lists, numbered lists, and code blocks where appropriate
- For code, always specify the language in fenced code blocks
- Be concise and precise — prefer structured answers over verbose prose
- Cite your reasoning clearly when making inferences

You assist with technical research, code analysis, writing, document review, and general knowledge queries.` as const
