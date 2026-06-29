import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import LocaleSwitcher from './LocaleSwitcher'

export default async function NavBar() {
  const t = await getTranslations('nav')
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto max-w-3xl px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-forest leading-tight">
          西粟倉村
          <span className="text-gray-500 font-normal text-xs ml-1.5">公開質問状</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/questions/propose"
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-3 min-h-[44px] flex items-center"
          >
            {t('propose')}
          </Link>
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  )
}
