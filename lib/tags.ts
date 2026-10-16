export const SUGGESTED_TAGS = [
  '財政', '人口', '産業', '林業', '農業', '観光', '教育', '医療福祉', 'インフラ', '脱炭素', 'その他',
] as const

export type SuggestedTag = (typeof SUGGESTED_TAGS)[number]

export const MAX_TAGS = 5
export const MAX_TAG_LENGTH = 30

export function isSuggestedTag(tag: string): tag is SuggestedTag {
  return (SUGGESTED_TAGS as readonly string[]).includes(tag)
}

export function isValidCustomTag(tag: string): boolean {
  return tag.trim().length > 0 && tag.trim().length <= MAX_TAG_LENGTH
}

export function isValidTagList(tags: unknown): tags is string[] {
  if (!Array.isArray(tags)) return false
  if (tags.length === 0 || tags.length > MAX_TAGS) return false
  return tags.every(t => typeof t === 'string' && (isSuggestedTag(t) || isValidCustomTag(t)))
}
