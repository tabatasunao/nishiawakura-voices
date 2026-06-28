import { useTranslations } from 'next-intl'
import ProposalForm from '@/components/ProposalForm'

export default function ProposePage() {
  const t = useTranslations('propose')
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('title')}</h1>
      <p className="text-gray-500 text-sm mb-8">提案した質問はすぐに公開され、他の方が投票できます。</p>
      <ProposalForm />
    </div>
  )
}
