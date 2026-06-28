import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/server'
import QuestionCard from '@/components/QuestionCard'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('home')
  const supabase = await createClient()

  const [{ data: activeQuestions }, { data: proposedQuestions }] = await Promise.all([
    supabase
      .from('questions')
      .select('*')
      .in('status', ['active', 'selected'])
      .order('vote_count', { ascending: false }),
    supabase
      .from('questions')
      .select('*')
      .eq('status', 'proposed')
      .order('vote_count', { ascending: false }),
  ])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-600 text-sm leading-relaxed">{t('subtitle')}</p>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="mb-6">
          <TabsTrigger value="active">{t('tabs.active')}</TabsTrigger>
          <TabsTrigger value="proposed">
            {t('tabs.proposed')}
            {(proposedQuestions?.length ?? 0) > 0 && (
              <span className="ml-1.5 rounded-full bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5">
                {proposedQuestions!.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <ul className="space-y-3">
            {(activeQuestions ?? []).map((q, i) => (
              <li key={q.id}><QuestionCard question={q} rank={i + 1} locale={locale} /></li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="proposed">
          <ul className="space-y-3">
            {(proposedQuestions ?? []).map((q, i) => (
              <li key={q.id}><QuestionCard question={q} rank={i + 1} locale={locale} /></li>
            ))}
            {(proposedQuestions?.length ?? 0) === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">提案された質問はまだありません</p>
            )}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  )
}
