'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale() {
    const next = locale === 'ja' ? 'en' : 'ja'
    // Replace /ja/ or /en/ prefix
    const newPath = pathname.replace(/^\/(ja|en)/, `/${next}`)
    router.push(newPath)
  }

  return (
    <Button variant="ghost" size="sm" onClick={switchLocale} className="text-sm font-medium">
      {locale === 'ja' ? 'EN' : '日本語'}
    </Button>
  )
}
