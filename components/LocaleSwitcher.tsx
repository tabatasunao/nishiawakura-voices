'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'

export default function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale() {
    const next = locale === 'ja' ? 'en' : 'ja'
    router.replace(pathname, { locale: next })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={switchLocale}
      className="text-sm font-medium min-h-[44px] gap-1"
      aria-label={locale === 'ja' ? 'Switch to English' : '日本語に切り替え'}
    >
      <span className="font-bold text-forest">{locale.toUpperCase()}</span>
      <span className="text-gray-300">|</span>
      <span className="text-gray-400">{locale === 'ja' ? 'EN' : 'JA'}</span>
    </Button>
  )
}
