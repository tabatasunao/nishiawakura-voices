const SESSION_KEY = 'nv_session'

export interface Session {
  sessionId: string
  isResident: boolean
  displayName: string
  declared: boolean
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // QuotaExceededError or similar — session won't persist but app stays functional
  }
}

export function getOrCreateSessionId(): string {
  const existing = getSession()
  if (existing?.sessionId) return existing.sessionId
  const id = crypto.randomUUID()
  saveSession({ sessionId: id, isResident: false, displayName: '', declared: false })
  return id
}
