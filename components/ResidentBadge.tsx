import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'

export default async function ResidentBadge() {
  const t = await getTranslations('question')
  return (
    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
      {t('residentLabel')}
    </Badge>
  )
}
