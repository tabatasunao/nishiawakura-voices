const KEY = 'nv_votes'

export function isVoted(questionId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const ids: string[] = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return ids.includes(questionId)
  } catch { return false }
}

export function setVoted(questionId: string, voted: boolean): void {
  if (typeof window === 'undefined') return
  try {
    const ids: string[] = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    const updated = voted
      ? [...new Set([...ids, questionId])]
      : ids.filter(id => id !== questionId)
    localStorage.setItem(KEY, JSON.stringify(updated))
  } catch {}
}
