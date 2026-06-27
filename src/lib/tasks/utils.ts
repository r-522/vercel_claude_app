const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'] as const

function toJST(date: Date): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
}

export function getJSTDateTimeString(): string {
  const jst = toJST(new Date())
  const y = jst.getFullYear()
  const m = jst.getMonth() + 1
  const d = jst.getDate()
  const day = DAY_NAMES[jst.getDay()]!
  const hh = String(jst.getHours()).padStart(2, '0')
  const mm = String(jst.getMinutes()).padStart(2, '0')
  return `現在の日時: ${y}年${m}月${d}日(${day}) ${hh}:${mm} JST`
}

export function getJSTDateString(): string {
  const jst = toJST(new Date())
  const y = jst.getFullYear()
  const m = String(jst.getMonth() + 1).padStart(2, '0')
  const d = String(jst.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function buildTaskPrompt(prompt: string, stateContent?: string): string {
  const parts: string[] = [getJSTDateTimeString()]
  if (stateContent) {
    parts.push(`\n前回の状態:\n${stateContent}`)
  }
  parts.push(`\n\n${prompt}`)
  return parts.join('')
}

export function shouldRunWeeklyTask(lastRunAt?: string): boolean {
  if (!lastRunAt) return true
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  return Date.now() - new Date(lastRunAt).getTime() >= sevenDaysMs
}

const STATE_PATTERN = /<!-- STATE: (.+?) -->/

export function parseStateUpdate(text: string): string | null {
  const match = STATE_PATTERN.exec(text)
  return match?.[1] ?? null
}

export function stripStateBlock(text: string): string {
  return text.replace(/\n?<!-- STATE: .+? -->\n?/g, '').trimEnd()
}
