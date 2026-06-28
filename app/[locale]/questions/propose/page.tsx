import { redirect } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/server'
import ProposalForm from '@/components/ProposalForm'

export default async function ProposePage() {
  const t = useTranslations('propose')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('title')}</h1>
      <p className="text-gray-500 text-sm mb-8">提案した質問はすぐに公開され、他の方が投票できます。</p>
      <ProposalForm />
    </div>
  )
}
