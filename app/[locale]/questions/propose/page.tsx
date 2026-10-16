import { getTranslations, setRequestLocale } from 'next-intl/server'
import ProposalForm from '@/components/ProposalForm'

export default async function ProposePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('propose')

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('title')}</h1>
      <p className="text-gray-500 text-sm mb-8">{t('subtitle')}</p>
      <ProposalForm />
    </div>
  )
}
