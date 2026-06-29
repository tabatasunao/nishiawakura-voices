export const VALID_CATEGORIES = [
  '財政', '人口', '産業', '林業', '農業', '観光', '教育', '医療福祉', 'インフラ', '脱炭素', 'その他',
] as const

export type Category = (typeof VALID_CATEGORIES)[number]
