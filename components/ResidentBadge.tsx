import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'

export default function ResidentBadge() {
  const t = useTranslations('question')
  return (
    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
      {t('residentLabel')}
    </Badge>
  )
}
