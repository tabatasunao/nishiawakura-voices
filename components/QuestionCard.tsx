import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Question } from '@/lib/supabase/types'
import VoteButton from './VoteButton'

interface Props {
  question: Question
  rank: number
  locale: string
}

export default async function QuestionCard({ question, rank, locale }: Props) {
  const t = await getTranslations('home')
  const ct = await getTranslations('categories')

  const title = locale === 'en' && question.title_en_cache ? question.title_en_cache : question.title
  const isTop10 = rank <= 10
  const isSelected = question.status === 'selected'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4 pb-2">
        <div className="flex items-start gap-3">
          <span className={`text-2xl font-bold tabular-nums w-8 text-center flex-shrink-0 ${
            isTop10 ? 'text-[#2D6A4F]' : 'text-gray-300'
          }`}>
            {rank}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              <Badge variant="outline" className="text-xs">
                {ct(question.category as Parameters<typeof ct>[0])}
              </Badge>
              {isSelected && (
                <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-200">{t('selectedBadge')}</Badge>
              )}
              {isTop10 && !isSelected && (
                <Badge className="text-xs bg-green-100 text-green-800 border-green-200">{t('topBadge')}</Badge>
              )}
            </div>
            <Link href={`/questions/${question.id}`} className="font-semibold text-gray-900 hover:text-[#2D6A4F] leading-snug line-clamp-2">
              {question.number && <span className="text-gray-400 mr-1">Q{question.number}.</span>}
              {title}
            </Link>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-3 flex items-center justify-between gap-2">
        <div className="text-xs text-gray-500 flex gap-3">
          <span>{t('voteCount', { count: question.vote_count })}</span>
          {question.resident_vote_count > 0 && (
            <span className="text-green-700">{t('residentCount', { count: question.resident_vote_count })}</span>
          )}
        </div>
        <VoteButton
          questionId={question.id}
          initialVoteCount={question.vote_count}
          initialVoted={false}
        />
      </CardFooter>
    </Card>
  )
}
