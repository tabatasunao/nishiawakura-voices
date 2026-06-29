import { timingSafeEqual } from 'crypto'
import { notFound } from 'next/navigation'
import { after } from 'next/server'
import { cookies } from 'next/headers'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Badge } from '@/components/ui/badge'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { translateToEnglish } from '@/lib/translate'
import VoteButton from '@/components/VoteButton'
import CommentSection from '@/components/CommentSection'

function safeTokenEqual(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b || a.length !== b.length) return false
  try { return timingSafeEqual(Buffer.from(a), Buffer.from(b)) } catch { return false }
}

export default async function QuestionPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('question')
  const ct = await getTranslations('categories')
  const supabase = await createClient()

  const [{ data: question }, { data: commentsRaw }] = await Promise.all([
    supabase.from('questions').select('*').eq('id', id).single(),
    supabase.from('comments').select('*').eq('question_id', id).order('created_at', { ascending: true }),
  ])
  if (!question) notFound()

  // Schedule translation after response is sent so it doesn't block page load
  if (locale === 'en' && process.env.OPENAI_API_KEY) {
    const needsTitle = !question.title_en_cache
    const needsBody = !question.body_en_cache
    if (needsTitle || needsBody) {
      const adminClient = createAdminClient()
      after(async () => {
        try {
          const [titleEn, bodyEn] = await Promise.all([
            needsTitle ? translateToEnglish(question.title) : Promise.resolve(question.title_en_cache!),
            needsBody ? translateToEnglish(question.body) : Promise.resolve(question.body_en_cache!),
          ])
          await adminClient.from('questions').update({ title_en_cache: titleEn, body_en_cache: bodyEn }).eq('id', id)
        } catch {}
      })
    }
  }

  const title = locale === 'en' && question.title_en_cache ? question.title_en_cache : question.title
  const body = locale === 'en' && question.body_en_cache ? question.body_en_cache : question.body

  const cookieStore = await cookies()
  const isAdmin = !!process.env.ADMIN_TOKEN &&
    safeTokenEqual(cookieStore.get('nv_admin')?.value, process.env.ADMIN_TOKEN)

  return (
    <div>
      <Link href="/" className="text-sm text-forest hover:underline mb-6 inline-block py-1">
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
            <span className="mr-3">{t('voteCount', { count: question.vote_count })}</span>
            {question.resident_vote_count > 0 && (
              <span className="text-green-700">{t('residentVoteDetail', { count: question.resident_vote_count })}</span>
            )}
          </div>
          <VoteButton
            questionId={question.id}
            initialVoteCount={question.vote_count}
          />
        </div>
      </div>

      <CommentSection
        questionId={id}
        initialComments={commentsRaw ?? []}
        isAdmin={isAdmin}
      />
    </div>
  )
}
