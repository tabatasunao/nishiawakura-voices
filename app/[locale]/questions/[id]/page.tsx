import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { translateToEnglish } from '@/lib/translate'
import { cookies } from 'next/headers'
import VoteButton from '@/components/VoteButton'
import CommentSection from '@/components/CommentSection'

export default async function QuestionPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params
  const t = useTranslations('question')
  const ct = useTranslations('categories')
  const supabase = await createClient()

  const { data: question } = await supabase.from('questions').select('*').eq('id', id).single()
  if (!question) notFound()

  // Auto-translate if on English and no cache yet
  if (locale === 'en' && process.env.OPENAI_API_KEY) {
    const needsTitle = !question.title_en_cache
    const needsBody = !question.body_en_cache
    if (needsTitle || needsBody) {
      const adminClient = createAdminClient()
      const [titleEn, bodyEn] = await Promise.all([
        needsTitle ? translateToEnglish(question.title) : Promise.resolve(question.title_en_cache!),
        needsBody ? translateToEnglish(question.body) : Promise.resolve(question.body_en_cache!),
      ])
      await adminClient.from('questions').update({ title_en_cache: titleEn, body_en_cache: bodyEn }).eq('id', id)
      question.title_en_cache = titleEn
      question.body_en_cache = bodyEn
    }
  }

  const title = locale === 'en' && question.title_en_cache ? question.title_en_cache : question.title
  const body = locale === 'en' && question.body_en_cache ? question.body_en_cache : question.body

  // Check if requester is admin (via cookie)
  const cookieStore = await cookies()
  const adminCookie = cookieStore.get('nv_admin')?.value
  const isAdmin = adminCookie === process.env.ADMIN_TOKEN
  const adminToken = isAdmin ? process.env.ADMIN_TOKEN : undefined

  const { data: commentsRaw } = await supabase
    .from('comments')
    .select('*')
    .eq('question_id', id)
    .order('created_at', { ascending: true })

  return (
    <div>
      <Link href="/" className="text-sm text-[#2D6A4F] hover:underline mb-6 inline-block">
        ← {t('backToList')}
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className="text-xs">
            {ct(question.category as Parameters<typeof ct>[0])}
          </Badge>
          {question.number && (
            <Badge variant="secondary" className="text-xs">Q{question.number}</Badge>
          )}
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-4 leading-snug">{title}</h1>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{body}</p>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <span className="mr-3">{question.vote_count}票</span>
            {question.resident_vote_count > 0 && (
              <span className="text-green-700">うち村民{question.resident_vote_count}人</span>
            )}
          </div>
          <VoteButton
            questionId={question.id}
            initialVoteCount={question.vote_count}
            initialVoted={false}
          />
        </div>
      </div>

      <CommentSection
        questionId={id}
        initialComments={commentsRaw ?? []}
        adminToken={adminToken}
      />
    </div>
  )
}
